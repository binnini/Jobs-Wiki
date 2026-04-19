import { randomUUID } from "node:crypto"
import { createStratawikiCommandFacadeClient } from "./stratawiki-command-facade-client.js"

const WORKNET_COMMAND_NAME = "jobs_wiki.ingestion.trigger_worknet"

export function createStratawikiCommandFacadeAdapter({
  env = {},
  client = createStratawikiCommandFacadeClient({ env }),
} = {}) {
  return {
    async triggerWorknetIngestion({ sourceId, idempotencyKey } = {}) {
      const accepted = await client.submitCommand({
        requestId: idempotencyKey ?? `jobs-wiki-worknet-${sourceId}-${randomUUID()}`,
        command: {
          name: WORKNET_COMMAND_NAME,
          payload: {
            sourceId,
          },
        },
      })

      return {
        commandId: accepted.commandId,
        acceptedAt: accepted.acceptedAt,
      }
    },

    async getCommandStatus({ commandId }) {
      const status = await client.getCommandStatus({
        commandId,
      })

      return {
        commandId: status.commandId,
        status: status.status,
        projectionStates: status.projectionStates,
      }
    },
  }
}
