export function createMockCommandFacadeAdapter() {
  return {
    async triggerWorknetIngestion({ sourceId }) {
      return {
        commandId: `mock-command-${sourceId}`,
        acceptedAt: "2026-04-18T09:00:00.000Z",
      }
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
