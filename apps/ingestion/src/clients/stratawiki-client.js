import {
  createStratawikiHttpClient,
  shouldUseStratawikiWrapperFallback,
} from "../../../../packages/integrations/stratawiki-http/client.js"
import { createStratawikiCliClient } from "./stratawiki-cli-client.js"

function resolveIntegrationMode(env) {
  const configuredMode = String(env.stratawikiIntegrationMode ?? "auto").trim().toLowerCase()

  if (configuredMode === "http" || configuredMode === "wrapper") {
    return configuredMode
  }

  return env.stratawikiBaseUrl ? "http" : "wrapper"
}

function canUseWrapperFallback(env) {
  return (
    String(env.stratawikiIntegrationMode ?? "auto").trim().toLowerCase() === "auto" &&
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

async function withFallback({
  env,
  primaryMode,
  httpRun,
  wrapperRun,
}) {
  if (primaryMode === "wrapper") {
    return await wrapperRun()
  }

  try {
    return await httpRun()
  } catch (error) {
    if (!canUseWrapperFallback(env) || !shouldUseStratawikiWrapperFallback(error)) {
      throw error
    }

    return await wrapperRun()
  }
}

export function createStratawikiClient(
  env,
  { cliClient = createStratawikiCliClient(env), httpClient = createHttpClient(env) } = {},
) {
  const primaryMode = resolveIntegrationMode(env)

  if (primaryMode === "http" && !httpClient) {
    throw new Error(
      "HTTP mode requires STRATAWIKI_BASE_URL. Set STRATAWIKI_BASE_URL or switch STRATAWIKI_INTEGRATION_MODE=wrapper.",
    )
  }

  return {
    mode: primaryMode,
    wrapperPath: cliClient.wrapperPath,
    configured:
      primaryMode === "http"
        ? Boolean(httpClient)
        : Boolean(env.stratawikiCliWrapper),
    async assertWriteRuntimeConfig() {
      if (primaryMode === "http") {
        if (!httpClient) {
          throw new Error(
            "HTTP mode requires STRATAWIKI_BASE_URL for StrataWiki write requests.",
          )
        }
        return
      }

      return await cliClient.assertWriteRuntimeConfig()
    },
    async listTools() {
      return await withFallback({
        env,
        primaryMode,
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
