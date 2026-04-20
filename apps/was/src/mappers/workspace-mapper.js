import {
  mapKnowledgeObjectRef,
  mapProjectionSync,
} from "./shared.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function mapWorkspaceNavigationItem(item) {
  return compactObject({
    objectRef: mapKnowledgeObjectRef(item.objectId, item.objectKind, item.title),
    kind: item.kind ?? item.objectKind,
    layer: item.layer,
    path: item.path,
    active: item.active,
  })
}

function findActiveObject(record, objectId) {
  return record.sections
    ?.flatMap((section) => section.items ?? [])
    .find((item) => item.objectId === objectId)
}

function mapActiveProjection(record) {
  if (!record.activeProjection?.projection) {
    return undefined
  }

  const activeItem = record.activeProjection.objectId
    ? findActiveObject(record, record.activeProjection.objectId)
    : undefined

  return compactObject({
    projection: record.activeProjection.projection,
    objectRef:
      record.activeProjection.objectId && activeItem
        ? mapKnowledgeObjectRef(
            activeItem.objectId,
            activeItem.objectKind,
            activeItem.title,
          )
        : undefined,
  })
}

export function mapWorkspace(record) {
  return compactObject({
    projection: "workspace",
    sync: mapProjectionSync(record.sync, "workspace"),
    navigation: {
      sections: (record.sections ?? []).map((section) => ({
        sectionId: section.sectionId,
        label: section.label,
        items: (section.items ?? []).map(mapWorkspaceNavigationItem),
      })),
    },
    activeProjection: mapActiveProjection(record),
  })
}
