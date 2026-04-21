import { createStratawikiHttpClient, StratawikiHttpError } from "../../../../../packages/integrations/stratawiki-http/client.js"
import {
  createForbiddenError,
  createNotFoundError,
  createTemporarilyUnavailableError,
  createUnknownFailureError,
  createValidationError,
} from "../../http/errors.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function normalizeProjectionState(state) {
  return compactObject({
    projection: state?.projection,
    visibility: state?.visibility,
    version: state?.version ?? state?.lastKnownVersion,
    visibleAt: state?.visibleAt ?? state?.lastVisibleAt,
  })
}

function normalizeCommandError(error) {
  if (!error || typeof error !== "object") {
    return undefined
  }

  if (typeof error.code !== "string" || typeof error.message !== "string") {
    return undefined
  }

  return compactObject({
    code: error.code,
    message: error.message,
    retryable: typeof error.retryable === "boolean" ? error.retryable : undefined,
  })
}

function normalizeSubmissionResponse(rawResponse) {
  const acceptedRecord = rawResponse?.command ?? rawResponse
  const projectionStates =
    acceptedRecord?.projectionStates?.map(normalizeProjectionState).filter(Boolean) ?? []

  if (
    typeof acceptedRecord?.commandId !== "string" ||
    typeof acceptedRecord?.acceptedAt !== "string"
  ) {
    throw createUnknownFailureError(
      "The StrataWiki command facade submit response is missing required fields.",
      {
        adapter: "stratawiki_command_facade",
      },
    )
  }

  return compactObject({
    commandId: acceptedRecord.commandId,
    status:
      typeof acceptedRecord.status === "string" ? acceptedRecord.status : "accepted",
    acceptedAt: acceptedRecord.acceptedAt,
    outcome:
      typeof acceptedRecord.outcome === "string" ? acceptedRecord.outcome : undefined,
    affectedObjectRefs:
      acceptedRecord?.affectedObjectRefs?.filter((value) => typeof value === "string") ??
      undefined,
    affectedRelationRefs:
      acceptedRecord?.affectedRelationRefs?.filter((value) => typeof value === "string") ??
      undefined,
    refreshScopes:
      acceptedRecord?.refreshScopes?.filter((value) => typeof value === "string") ??
      undefined,
    projectionStates: projectionStates.length > 0 ? projectionStates : undefined,
    error: normalizeCommandError(acceptedRecord?.error),
  })
}

function normalizeStatusResponse(rawResponse) {
  const commandRecord = rawResponse?.command ?? rawResponse
  const projectionStates =
    commandRecord?.projectionStates?.map(normalizeProjectionState).filter(Boolean) ?? []

  if (
    typeof commandRecord?.commandId !== "string" ||
    typeof commandRecord?.status !== "string"
  ) {
    throw createUnknownFailureError(
      "The StrataWiki command facade status response is missing required fields.",
      {
        adapter: "stratawiki_command_facade",
      },
    )
  }

  return compactObject({
    commandId: commandRecord.commandId,
    status: commandRecord.status,
    outcome:
      typeof commandRecord.outcome === "string" ? commandRecord.outcome : undefined,
    acceptedAt: commandRecord.acceptedAt,
    finishedAt: commandRecord.finishedAt,
    affectedObjectRefs:
      commandRecord?.affectedObjectRefs?.filter((value) => typeof value === "string") ??
      undefined,
    affectedRelationRefs:
      commandRecord?.affectedRelationRefs?.filter((value) => typeof value === "string") ??
      undefined,
    refreshScopes:
      commandRecord?.refreshScopes?.filter((value) => typeof value === "string") ??
      undefined,
    projectionStates: projectionStates.length > 0 ? projectionStates : undefined,
    error: normalizeCommandError(commandRecord?.error),
  })
}

function mapHttpError(error, { operation }) {
  if (!(error instanceof StratawikiHttpError)) {
    return createUnknownFailureError(error.message ?? `${operation} failed.`, {
      adapter: "stratawiki_command_facade",
      operation,
    }, error)
  }

  const details = {
    adapter: "stratawiki_command_facade",
    operation,
    upstreamCode: error.code,
    requestId: error.requestId,
    path: error.details?.path,
  }

  if (error.status === 404 || error.code === "not_found") {
    return createNotFoundError(error.message, details)
  }

  if (error.status === 422 || error.code === "validation_error") {
    return createValidationError(error.message, details)
  }

  if (error.status === 401 || error.status === 403 || error.code === "unauthorized") {
    return createForbiddenError(error.message, details)
  }

  if (error.retryable) {
    return createTemporarilyUnavailableError(error.message, details)
  }

  return createUnknownFailureError(error.message, details, error)
}

function normalizeCommandFacadeStatus(commandStatus) {
  return compactObject({
    commandId: commandStatus.commandId,
    status: commandStatus.status,
    outcome: commandStatus.outcome,
    acceptedAt: commandStatus.acceptedAt,
    finishedAt: commandStatus.finishedAt,
    affectedObjectRefs: commandStatus.affectedObjectRefs,
    affectedRelationRefs: commandStatus.affectedRelationRefs,
    refreshScopes: commandStatus.refreshScopes,
    projectionStates: commandStatus.projectionStates,
    error: commandStatus.error,
  })
}

export function createStratawikiCommandFacadeClient({
  env = {},
  httpClient: providedHttpClient,
} = {}) {
  const httpClient =
    providedHttpClient ??
    (env.stratawikiBaseUrl
      ? createStratawikiHttpClient({
          baseUrl: env.stratawikiBaseUrl,
          apiToken: env.stratawikiApiToken,
          timeoutMs: env.stratawikiHttpTimeoutMs,
        })
      : null)

  if (!httpClient) {
    throw createTemporarilyUnavailableError(
      "STRATAWIKI_BASE_URL is required for the StrataWiki command facade HTTP client.",
      {
        adapter: "stratawiki_command_facade",
      },
    )
  }

  return {
    async submitCommand({ requestId, command, idempotencyKey } = {}) {
      try {
        const rawResponse = await httpClient.submitCommand({
          requestId,
          command,
          idempotencyKey: idempotencyKey ?? requestId,
        })

        return normalizeSubmissionResponse(rawResponse)
      } catch (error) {
        throw mapHttpError(error, { operation: "submitCommand" })
      }
    },

    async triggerWorknetIngestion({ sourceId, idempotencyKey } = {}) {
      return this.submitCommand({
        requestId: idempotencyKey,
        idempotencyKey,
        command: {
          name: "jobs_wiki.ingestion.trigger_worknet",
          payload: {
            sourceId,
          },
        },
      })
    },

    async getCommandStatus({ commandId } = {}) {
      try {
        const rawResponse = await httpClient.getCommandStatus({
          commandId,
        })

        return normalizeStatusResponse(rawResponse)
      } catch (error) {
        throw mapHttpError(error, { operation: "getCommandStatus" })
      }
    },
  }
}
