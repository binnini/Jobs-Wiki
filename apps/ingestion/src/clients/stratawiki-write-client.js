import {
  StratawikiHttpError,
  createStratawikiHttpClient,
} from "../../../../packages/integrations/stratawiki-http/client.js"

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
    "Jobs-Wiki ingestion flows now require STRATAWIKI_INTEGRATION_MODE=http",
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

function ensureHttpMode(env, httpClient) {
  const configuredMode = String(env.stratawikiIntegrationMode ?? "http").trim().toLowerCase()

  if (configuredMode !== "http") {
    throw new StratawikiWriteError({
      message:
        "Jobs-Wiki ingestion flows now require STRATAWIKI_INTEGRATION_MODE=http.",
      code: "configuration_invalid",
      retryable: false,
      transport: "http",
      operation: "create_client",
    })
  }

  if (!httpClient) {
    throw new StratawikiWriteError({
      message:
        "Jobs-Wiki ingestion flows require STRATAWIKI_BASE_URL for HTTP mode.",
      code: "configuration_invalid",
      retryable: false,
      transport: "http",
      operation: "create_client",
    })
  }
}

export function createStratawikiWriteClient(
  env,
  {
    httpClient = createHttpClient(env),
  } = {},
) {
  ensureHttpMode(env, httpClient)

  async function runHttp(httpRun, operation) {
    try {
      return await httpRun()
    } catch (error) {
      throw normalizeWriteError(error, {
        transport: "http",
        operation,
      })
    }
  }

  return {
    mode: "http",
    wrapperPath: null,
    configured: Boolean(httpClient),
    async assertWriteRuntimeConfig() {
      if (!httpClient) {
        throw new StratawikiWriteError({
          message:
            "Jobs-Wiki ingestion flows require STRATAWIKI_BASE_URL for HTTP mode.",
          code: "configuration_invalid",
          retryable: false,
          transport: "http",
          operation: "assert_write_runtime_config",
        })
      }
    },
    async listTools() {
      return await runHttp(() => httpClient.listTools(), "list_tools")
    },
    async callTool(name, args = {}, options = {}) {
      return await runHttp(
        () =>
          httpClient.callTool({
            name,
            arguments: args,
            idempotencyKey: options.idempotencyKey,
          }),
        name,
      )
    },
    async validateDomainProposalBatch({ batch, requestId, idempotencyKey } = {}) {
      return await runHttp(
        () =>
          httpClient.validateDomainProposalBatch({
            batch,
            requestId,
            idempotencyKey,
          }),
        "validate_domain_proposal_batch",
      )
    },
    async ingestDomainProposalBatch({ batch, requestId, idempotencyKey } = {}) {
      return await runHttp(
        () =>
          httpClient.ingestDomainProposalBatch({
            batch,
            requestId,
            idempotencyKey,
          }),
        "ingest_domain_proposal_batch",
      )
    },
  }
}
