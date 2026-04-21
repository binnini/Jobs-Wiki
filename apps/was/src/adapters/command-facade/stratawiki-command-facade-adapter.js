import { randomUUID } from "node:crypto"
import { createStratawikiCommandFacadeClient } from "./stratawiki-command-facade-client.js"
import { loadEnv as loadIngestionEnv } from "../../../../ingestion/src/config/env.js"
import { createClients as createIngestionClients } from "../../../../ingestion/src/clients/index.js"
import { runWorknetIngestion } from "../../../../ingestion/src/jobs/run-worknet-ingestion.js"
const LOCAL_COMMAND_PREFIX = "jobs-wiki-local-worknet"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

export function createStratawikiCommandFacadeAdapter({
  env = {},
  client: providedClient,
  loadIngestionEnvImpl = loadIngestionEnv,
  createIngestionClientsImpl = createIngestionClients,
  runWorknetIngestionImpl = runWorknetIngestion,
} = {}) {
  let resolvedClient = providedClient
  const localCommandStore = new Map()

  function getClient() {
    if (!resolvedClient) {
      resolvedClient = createStratawikiCommandFacadeClient({ env })
    }

    return resolvedClient
  }

  function createLocalCommandId(sourceId) {
    return `${LOCAL_COMMAND_PREFIX}:${sourceId}:${randomUUID()}`
  }

  function storeLocalCommand(record) {
    localCommandStore.set(record.commandId, record)
    return record
  }

  function buildNoopLogger() {
    return {
      info() {},
      warn() {},
      error() {},
    }
  }

  function summarizeProjectionStates(result) {
    const projections = [
      "workspace_summary",
      "opportunity_list",
      "calendar",
    ]

    return projections.map((projection) => ({
      projection,
      visibility: result?.status === "ingested" ? "applied" : "unknown",
    }))
  }

  function summarizeAffectedObjectRefs(result) {
    return (result?.batches ?? [])
      .map((batch) => batch?.sourceId)
      .filter((value) => typeof value === "string" && value !== "")
  }

  async function runLocalWorknetCommand({ sourceId, idempotencyKey }) {
    const commandId = createLocalCommandId(sourceId)
    const acceptedAt = new Date().toISOString()
    const ingestionEnv = loadIngestionEnvImpl({
      STRATAWIKI_BASE_URL: env.stratawikiBaseUrl ?? process.env.STRATAWIKI_BASE_URL,
      STRATAWIKI_API_TOKEN: env.stratawikiApiToken ?? process.env.STRATAWIKI_API_TOKEN,
      STRATAWIKI_HTTP_TIMEOUT_MS:
        String(env.stratawikiHttpTimeoutMs ?? process.env.STRATAWIKI_HTTP_TIMEOUT_MS ?? ""),
    })
    const clients = createIngestionClientsImpl(ingestionEnv)
    const runId = `jobs-wiki-admin-${randomUUID().slice(0, 8)}`

    try {
      const result = await runWorknetIngestionImpl({
        env: ingestionEnv,
        logger: buildNoopLogger(),
        dryRun: false,
        sourceId,
        runId,
        clients,
      })

      return storeLocalCommand({
        commandId,
        status: "succeeded",
        outcome: "fully_applied",
        acceptedAt,
        finishedAt: new Date().toISOString(),
        refreshScopes: ["workspace_summary", "opportunity_list", "calendar"],
        projectionStates: summarizeProjectionStates(result),
        affectedObjectRefs: summarizeAffectedObjectRefs(result),
      })
    } catch (error) {
      const message = error?.message ?? "WorkNet ingestion failed."
      return storeLocalCommand({
        commandId,
        status: "failed",
        outcome: "failed",
        acceptedAt,
        finishedAt: new Date().toISOString(),
        refreshScopes: ["workspace_summary"],
        projectionStates: [
          {
            projection: "workspace_summary",
            visibility: "stale",
          },
        ],
        error: {
          code: error?.code ?? "worknet_ingestion_failed",
          message,
          retryable: false,
        },
      })
    }
  }

  return {
    async submitCommand({ requestId, command } = {}) {
      const accepted = await getClient().submitCommand({
        requestId: requestId ?? `jobs-wiki-command-${randomUUID()}`,
        command,
      })

      return compactObject({
        commandId: accepted.commandId,
        status: accepted.status,
        acceptedAt: accepted.acceptedAt,
        outcome: accepted.outcome,
        affectedObjectRefs: accepted.affectedObjectRefs,
        affectedRelationRefs: accepted.affectedRelationRefs,
        refreshScopes: accepted.refreshScopes,
        projectionStates: accepted.projectionStates,
        error: accepted.error,
      })
    },

    async triggerWorknetIngestion({ sourceId, idempotencyKey } = {}) {
      return runLocalWorknetCommand({ sourceId, idempotencyKey })
    },

    async getCommandStatus({ commandId }) {
      if (localCommandStore.has(commandId)) {
        return localCommandStore.get(commandId)
      }

      const status = await getClient().getCommandStatus({
        commandId,
      })

      return compactObject({
        commandId: status.commandId,
        status: status.status,
        outcome: status.outcome,
        acceptedAt: status.acceptedAt,
        finishedAt: status.finishedAt,
        affectedObjectRefs: status.affectedObjectRefs,
        affectedRelationRefs: status.affectedRelationRefs,
        refreshScopes: status.refreshScopes,
        projectionStates: status.projectionStates,
        error: status.error,
      })
    },
  }
}
