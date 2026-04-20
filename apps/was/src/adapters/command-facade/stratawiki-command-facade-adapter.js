import { randomUUID } from "node:crypto"
import { createStratawikiCommandFacadeClient } from "./stratawiki-command-facade-client.js"

const WORKNET_COMMAND_NAME = "jobs_wiki.ingestion.trigger_worknet"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

export function createStratawikiCommandFacadeAdapter({
  env = {},
  client = createStratawikiCommandFacadeClient({ env }),
} = {}) {
  return {
    async submitCommand({ requestId, command } = {}) {
      const accepted = await client.submitCommand({
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
      return this.submitCommand({
        requestId: idempotencyKey ?? `jobs-wiki-worknet-${sourceId}-${randomUUID()}`,
        command: {
          name: WORKNET_COMMAND_NAME,
          payload: {
            sourceId,
          },
        },
      })
    },

    async getCommandStatus({ commandId }) {
      const status = await client.getCommandStatus({
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
