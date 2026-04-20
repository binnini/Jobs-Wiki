function buildMockCommandStatus(commandId) {
  if (commandId.includes("partial")) {
    return {
      commandId,
      status: "succeeded",
      outcome: "partially_applied",
      refreshScopes: ["workspace_summary", "calendar"],
      projectionStates: [
        {
          projection: "workspace_summary",
          visibility: "applied",
        },
        {
          projection: "calendar",
          visibility: "pending",
        },
      ],
    }
  }

  if (commandId.includes("failed")) {
    return {
      commandId,
      status: "failed",
      outcome: "failed",
      refreshScopes: ["workspace_summary"],
      error: {
        code: "temporarily_unavailable",
        message: "The downstream ingestion queue is temporarily unavailable.",
        retryable: true,
      },
    }
  }

  return {
    commandId,
    status: "accepted",
    refreshScopes: ["workspace_summary"],
    projectionStates: [
      {
        projection: "workspace_summary",
        visibility: "pending",
      },
    ],
  }
}

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
      return buildMockCommandStatus(commandId)
    },
  }
}
