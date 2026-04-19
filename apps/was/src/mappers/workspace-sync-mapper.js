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
        })
      : undefined,
  })
}
