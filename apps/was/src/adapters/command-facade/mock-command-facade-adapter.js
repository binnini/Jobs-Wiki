export function createMockCommandFacadeAdapter() {
  return {
    async submitCommand({ command } = {}) {
      const sourceId = command?.payload?.sourceId ?? "unknown"

      return {
        commandId: `mock-command-${sourceId}`,
        status: "accepted",
        acceptedAt: "2026-04-18T09:00:00.000Z",
        projectionStates: [
          {
            projection: "workspace_summary",
            visibility: "pending",
          },
        ],
      }
    },

    async triggerWorknetIngestion({ sourceId }) {
      return this.submitCommand({
        command: {
          name: "jobs_wiki.ingestion.trigger_worknet",
          payload: {
            sourceId,
          },
        },
      })
    },

    async getCommandStatus({ commandId }) {
      return {
        commandId,
        status: "accepted",
        projectionStates: [
          {
            projection: "workspace_summary",
            visibility: "pending",
          },
        ],
      }
    },
  }
}
