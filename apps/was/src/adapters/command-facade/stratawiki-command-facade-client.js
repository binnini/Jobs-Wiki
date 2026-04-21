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
    version:
      state?.version ??
      state?.lastKnownVersion ??
      state?.last_known_version,
    visibleAt:
      state?.visibleAt ??
      state?.lastVisibleAt ??
      state?.visible_at ??
      state?.last_visible_at,
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

function filterStringArray(value) {
  return value?.filter?.((entry) => typeof entry === "string") ?? undefined
}

function normalizeSubmissionResponse(rawResponse) {
  const acceptedRecord = rawResponse?.command ?? rawResponse
  const projectionStates =
    (
      acceptedRecord?.projectionStates ??
      acceptedRecord?.projection_states
    )?.map(normalizeProjectionState).filter(Boolean) ?? []
  const commandId = acceptedRecord?.commandId ?? acceptedRecord?.command_id
  const acceptedAt =
    acceptedRecord?.acceptedAt ??
    acceptedRecord?.accepted_at ??
    acceptedRecord?.submitted_at
  const status = acceptedRecord?.status ?? acceptedRecord?.state

  if (
    typeof commandId !== "string" ||
    typeof acceptedAt !== "string"
  ) {
    throw createUnknownFailureError(
      "The StrataWiki command facade submit response is missing required fields.",
      {
        adapter: "stratawiki_command_facade",
      },
    )
  }

  return compactObject({
    commandId,
    status: typeof status === "string" ? status : "accepted",
    acceptedAt,
    finishedAt: acceptedRecord?.finishedAt ?? acceptedRecord?.finished_at,
    outcome:
      typeof acceptedRecord?.outcome === "string"
        ? acceptedRecord.outcome
        : undefined,
    affectedObjectRefs: filterStringArray(
      acceptedRecord?.affectedObjectRefs ?? acceptedRecord?.affected_object_refs,
    ),
    affectedRelationRefs: filterStringArray(
      acceptedRecord?.affectedRelationRefs ?? acceptedRecord?.affected_relation_refs,
    ),
    refreshScopes: filterStringArray(
      acceptedRecord?.refreshScopes ?? acceptedRecord?.refresh_scopes,
    ),
    projectionStates: projectionStates.length > 0 ? projectionStates : undefined,
    error: normalizeCommandError(acceptedRecord?.error),
  })
}

function normalizeStatusResponse(rawResponse) {
  const commandRecord = rawResponse?.command ?? rawResponse
  const projectionStates =
    (
      commandRecord?.projectionStates ??
      commandRecord?.projection_states
    )?.map(normalizeProjectionState).filter(Boolean) ?? []
  const commandId = commandRecord?.commandId ?? commandRecord?.command_id
  const status = commandRecord?.status ?? commandRecord?.state

  if (
    typeof commandId !== "string" ||
    typeof status !== "string"
  ) {
    throw createUnknownFailureError(
      "The StrataWiki command facade status response is missing required fields.",
      {
        adapter: "stratawiki_command_facade",
      },
    )
  }

  return compactObject({
    commandId,
    status,
    outcome:
      typeof commandRecord.outcome === "string" ? commandRecord.outcome : undefined,
    acceptedAt:
      commandRecord?.acceptedAt ??
      commandRecord?.accepted_at ??
      commandRecord?.submitted_at,
    finishedAt: commandRecord?.finishedAt ?? commandRecord?.finished_at,
    affectedObjectRefs: filterStringArray(
      commandRecord?.affectedObjectRefs ?? commandRecord?.affected_object_refs,
    ),
    affectedRelationRefs: filterStringArray(
      commandRecord?.affectedRelationRefs ?? commandRecord?.affected_relation_refs,
    ),
    refreshScopes: filterStringArray(
      commandRecord?.refreshScopes ?? commandRecord?.refresh_scopes,
    ),
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
          name: command?.name,
          arguments: command?.payload ?? command?.arguments,
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
