import { createTemporarilyUnavailableError } from "../http/errors.js"

const DEFAULT_SYNC_PROJECTIONS = [
  "workspace_summary",
  "opportunity_list",
  "opportunity_detail",
  "calendar",
]

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function dedupeProjectionStates(states) {
  const projectionStateMap = new Map()

  for (const state of states ?? []) {
    if (!state?.projection || !state?.visibility) {
      continue
    }

    if (!projectionStateMap.has(state.projection)) {
      projectionStateMap.set(
        state.projection,
        compactObject({
          projection: state.projection,
          visibility: state.visibility,
          version: state.version,
          visibleAt: state.visibleAt,
        }),
      )
    }
  }

  return Array.from(projectionStateMap.values())
}

function translateCommandStatusToProjectionStates(commandStatus) {
  if (commandStatus?.projectionStates?.length) {
    return dedupeProjectionStates(commandStatus.projectionStates)
  }

  const visibility =
    commandStatus?.status === "succeeded"
      ? "unknown"
      : commandStatus?.status === "failed" || commandStatus?.status === "cancelled"
        ? "stale"
        : "pending"

  return DEFAULT_SYNC_PROJECTIONS.map((projection) => ({
    projection,
    visibility,
  }))
}

export async function getWorkspaceSyncService({
  readAuthority,
  commandFacade,
  userContext,
  query,
}) {
  if (query?.commandId) {
    const command = await commandFacade.getCommandStatus({
      commandId: query.commandId,
    })

    return {
      command: compactObject({
        commandId: command.commandId,
        status: command.status,
      }),
      projections: translateCommandStatusToProjectionStates(command),
    }
  }

  const projectionReads = [
    {
      projection: "workspace_summary",
      read() {
        return readAuthority.getWorkspaceSummary({
          userContext,
        })
      },
    },
    {
      projection: "opportunity_list",
      read() {
        return readAuthority.listOpportunities({
          userContext,
          query: {
            limit: 1,
          },
        })
      },
    },
    {
      projection: "calendar",
      read() {
        return readAuthority.getCalendar({
          userContext,
          query: {},
        })
      },
    },
  ]

  const results = await Promise.allSettled(projectionReads.map((entry) => entry.read()))

  const projections = dedupeProjectionStates(
    results
      .map((result, index) => {
        if (result.status !== "fulfilled" || !result.value?.sync?.visibility) {
          return undefined
        }

        return {
          projection: projectionReads[index].projection,
          visibility: result.value.sync.visibility,
          version: result.value.sync.version,
          visibleAt: result.value.sync.visibleAt,
        }
      })
      .filter(Boolean),
  )

  if (projections.length === 0) {
    throw createTemporarilyUnavailableError(
      "No workspace sync projections are currently available.",
      {
        adapter: "workspace_sync",
      },
    )
  }

  return {
    projections,
  }
}
