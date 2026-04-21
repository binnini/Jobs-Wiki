import {
  mapKnowledgeObjectRef,
  mapProjectionSync,
} from "./shared.js"
import {
  buildWorkspaceTreeNodes,
  normalizeWorkspaceNavigationItem,
} from "./workspace-tree-model.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function mapWorkspaceNavigationItem(item) {
  const normalizedItem = normalizeWorkspaceNavigationItem(item, item.layer)

  return compactObject({
    ...normalizedItem,
    objectRef: mapKnowledgeObjectRef(item.objectId, item.objectKind, item.title),
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
        tree: buildWorkspaceTreeNodes(section.items ?? [], section.sectionId),
      })),
    },
    activeProjection: mapActiveProjection(record),
  })
}
