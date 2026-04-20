import {
  StratawikiHttpError,
  createStratawikiHttpClient,
  shouldUseStratawikiWrapperFallback,
} from "../../../../packages/integrations/stratawiki-http/client.js"
import { createStratawikiCliClient } from "./stratawiki-cli-client.js"

export class StratawikiWriteError extends Error {
  constructor({
    message,
    code = "unknown_failure",
    retryable = false,
    status = null,
    transport = null,
    operation = null,
    details,
    cause,
  }) {
    super(message, cause ? { cause } : undefined)
    this.name = "StratawikiWriteError"
    this.code = code
    this.retryable = retryable
    this.status = status
    this.transport = transport
    this.operation = operation
    this.details = details
  }
}

function resolveIntegrationMode(env) {
  const configuredMode = String(
    env.stratawikiIntegrationMode ?? "auto",
  ).trim().toLowerCase()

  if (configuredMode === "http" || configuredMode === "wrapper") {
    return configuredMode
  }

  return env.stratawikiBaseUrl ? "http" : "wrapper"
}

function canUseWrapperFallback(env) {
  return (
    String(env.stratawikiIntegrationMode ?? "auto").trim().toLowerCase() ===
      "auto" &&
    Boolean(env.stratawikiCliWrapper)
  )
}

function createHttpClient(env) {
  if (!env.stratawikiBaseUrl) {
    return null
  }

  return createStratawikiHttpClient({
    baseUrl: env.stratawikiBaseUrl,
    apiToken: env.stratawikiApiToken,
    timeoutMs: env.stratawikiHttpTimeoutMs,
  })
}

function looksLikeConfigurationFailure(message) {
  return [
    "Missing required env",
    "Invalid STRATAWIKI_",
    "requires STRATAWIKI_BASE_URL",
    "does not exist",
    "not executable",
    "no valid artifact paths were parsed",
  ].some((pattern) => message.includes(pattern))
}

function normalizeWriteError(error, { transport, operation }) {
  if (error instanceof StratawikiWriteError) {
    return error
  }

  if (error instanceof StratawikiHttpError) {
    return new StratawikiWriteError({
      message: error.message,
      code: error.code ?? "temporarily_unavailable",
      retryable: Boolean(error.retryable),
      status: error.status ?? null,
      transport,
      operation,
      details: error.details,
      cause: error,
    })
  }

  const message = error?.message ?? "Unknown StrataWiki write failure"
  const configurationFailure =
    operation === "assert_write_runtime_config" ||
    looksLikeConfigurationFailure(message)

  return new StratawikiWriteError({
    message,
    code: configurationFailure ? "configuration_invalid" : "unknown_failure",
    retryable: false,
    transport,
    operation,
    details: configurationFailure
      ? undefined
      : {
          cause: message,
        },
    cause: error,
  })
}

async function withFallback({
  env,
  primaryMode,
  httpRun,
  wrapperRun,
  operation,
}) {
  if (primaryMode === "wrapper") {
    try {
      return await wrapperRun()
    } catch (error) {
      throw normalizeWriteError(error, {
        transport: "wrapper",
        operation,
      })
    }
  }

  try {
    return await httpRun()
  } catch (error) {
    if (
      canUseWrapperFallback(env) &&
      shouldUseStratawikiWrapperFallback(error)
    ) {
      try {
        return await wrapperRun()
      } catch (wrapperError) {
        throw normalizeWriteError(wrapperError, {
          transport: "wrapper",
          operation,
        })
      }
    }

    throw normalizeWriteError(error, {
      transport: "http",
      operation,
    })
  }
}

export function createStratawikiWriteClient(
  env,
  {
    cliClient = createStratawikiCliClient(env),
    httpClient = createHttpClient(env),
  } = {},
) {
  const primaryMode = resolveIntegrationMode(env)

  if (primaryMode === "http" && !httpClient) {
    throw new StratawikiWriteError({
      message:
        "HTTP mode requires STRATAWIKI_BASE_URL. Set STRATAWIKI_BASE_URL or switch STRATAWIKI_INTEGRATION_MODE=wrapper.",
      code: "configuration_invalid",
      retryable: false,
      transport: "http",
      operation: "create_client",
    })
  }

  return {
    mode: primaryMode,
    wrapperPath: cliClient.wrapperPath,
    configured:
      primaryMode === "http"
        ? Boolean(httpClient)
        : Boolean(env.stratawikiCliWrapper),
    async assertWriteRuntimeConfig() {
      try {
        if (primaryMode === "http") {
          if (!httpClient) {
            throw new Error(
              "HTTP mode requires STRATAWIKI_BASE_URL for StrataWiki write requests.",
            )
          }
          return
        }

        return await cliClient.assertWriteRuntimeConfig()
      } catch (error) {
        throw normalizeWriteError(error, {
          transport: primaryMode,
          operation: "assert_write_runtime_config",
        })
      }
    },
    async listTools() {
      return await withFallback({
        env,
        primaryMode,
        operation: "list_tools",
        httpRun() {
          return httpClient.listTools()
        },
        wrapperRun() {
          return cliClient.listTools()
        },
      })
    },
    async callTool(name, args = {}, options = {}) {
      return await withFallback({
        env,
        primaryMode,
        operation: name,
        httpRun() {
          return httpClient.callTool({
            name,
            arguments: args,
            idempotencyKey: options.idempotencyKey,
          })
        },
        wrapperRun() {
          return cliClient.callTool(name, args, options)
        },
      })
    },
    async validateDomainProposalBatch({ batch, requestId, idempotencyKey } = {}) {
      return await withFallback({
        env,
        primaryMode,
        operation: "validate_domain_proposal_batch",
        httpRun() {
          return httpClient.validateDomainProposalBatch({
            batch,
            requestId,
            idempotencyKey,
          })
        },
        wrapperRun() {
          return cliClient.callTool(
            "validate_domain_proposal_batch",
            { batch },
            { envelope: false },
          )
        },
      })
    },
    async ingestDomainProposalBatch({ batch, requestId, idempotencyKey } = {}) {
      return await withFallback({
        env,
        primaryMode,
        operation: "ingest_domain_proposal_batch",
        httpRun() {
          return httpClient.ingestDomainProposalBatch({
            batch,
            requestId,
            idempotencyKey,
          })
        },
        wrapperRun() {
          return cliClient.callTool(
            "ingest_domain_proposal_batch",
            { batch },
            { envelope: false },
          )
        },
      })
    },
  }
}
