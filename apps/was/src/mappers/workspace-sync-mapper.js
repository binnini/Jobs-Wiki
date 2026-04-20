import { mapProjectionSync } from "./shared.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

export function mapWorkspaceSync(record) {
  return compactObject({
    projections:
      record.projections
        ?.map((state) => mapProjectionSync(state, state.projection))
        .filter(Boolean) ?? [],
    command: record.command
      ? compactObject({
          commandId: record.command.commandId,
          status: record.command.status,
          outcome: record.command.outcome,
          acceptedAt: record.command.acceptedAt,
          finishedAt: record.command.finishedAt,
          affectedObjectRefs: record.command.affectedObjectRefs,
          affectedRelationRefs: record.command.affectedRelationRefs,
          refreshScopes: record.command.refreshScopes,
          error: record.command.error,
        })
      : undefined,
  })
}
