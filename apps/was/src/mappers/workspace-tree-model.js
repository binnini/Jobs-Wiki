function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function normalizeTreeSegments(segments) {
  return (Array.isArray(segments) ? segments : [])
    .map((segment) => (typeof segment === "string" ? segment.trim() : ""))
    .filter(Boolean)
}

function buildWorkspaceTreeKey(sectionId, segments) {
  return `${sectionId}:${segments.join("/")}`
}

export function normalizeWorkspacePath({
  sectionId,
  nodeType = "document",
  segments = [],
  label,
  path = null,
} = {}) {
  const normalizedSegments = normalizeTreeSegments(segments)
  const key = buildWorkspaceTreeKey(sectionId ?? "workspace", normalizedSegments)
  const parentKey =
    normalizedSegments.length > 1
      ? buildWorkspaceTreeKey(sectionId ?? "workspace", normalizedSegments.slice(0, -1))
      : null
  const leaf = normalizedSegments.at(-1) ?? null

  return compactObject({
    sectionId: sectionId ?? null,
    nodeType,
    segments: normalizedSegments,
    leaf,
    key,
    parentKey,
    label,
    path,
  })
}

export function normalizeWorkspaceNavigationItem(item, sectionId) {
  return compactObject({
    objectRef:
      item.objectId && item.objectKind
        ? compactObject({
            objectId: item.objectId,
            objectKind: item.objectKind,
            title: item.title,
          })
        : undefined,
    kind: item.kind ?? item.objectKind,
    layer: item.layer ?? sectionId,
    path: item.path ?? null,
    active: item.active,
    workspacePath: item.workspacePath
      ? normalizeWorkspacePath({
          sectionId: item.workspacePath.sectionId ?? sectionId,
          nodeType: item.workspacePath.nodeType,
          segments: item.workspacePath.segments,
          label: item.workspacePath.label ?? item.title,
          path: item.path ?? null,
        })
      : undefined,
  })
}

function createFolderNode({ sectionId, label, segments, layer }) {
  const workspacePath = normalizeWorkspacePath({
    sectionId,
    nodeType: "folder",
    segments,
    label,
  })

  return {
    kind: "folder",
    nodeType: "folder",
    label,
    layer,
    path: null,
    workspacePath,
    children: [],
  }
}

function compareTreeNodes(leftNode, rightNode) {
  const getPriority = (node) => {
    if (node.nodeType === "special_view") {
      return 0
    }

    if (node.nodeType === "folder") {
      return 1
    }

    return 2
  }

  const priorityDiff = getPriority(leftNode) - getPriority(rightNode)

  if (priorityDiff !== 0) {
    return priorityDiff
  }

  const leftLabel = String(leftNode.label ?? leftNode.objectRef?.title ?? "").trim()
  const rightLabel = String(rightNode.label ?? rightNode.objectRef?.title ?? "").trim()

  return leftLabel.localeCompare(rightLabel, "ko", {
    numeric: true,
    sensitivity: "base",
  })
}

function sortWorkspaceTreeNodes(nodes) {
  return [...nodes]
    .map((node) => ({
      ...node,
      children: Array.isArray(node.children) ? sortWorkspaceTreeNodes(node.children) : [],
    }))
    .sort(compareTreeNodes)
}

export function buildWorkspaceTreeNodes(items, sectionId) {
  const roots = []
  const nodesByKey = new Map()

  for (const item of items ?? []) {
    const normalizedItem = normalizeWorkspaceNavigationItem(item, sectionId)
    const workspacePath = normalizedItem.workspacePath
    const itemLabel =
      workspacePath?.label ?? item.title ?? normalizedItem.objectRef?.title ?? null

    if (!workspacePath?.segments?.length) {
      roots.push({
        ...normalizedItem,
        label: itemLabel,
        nodeType: workspacePath?.nodeType ?? "document",
        children: [],
      })
      continue
    }

    let siblings = roots
    const { segments } = workspacePath

    for (let index = 0; index < segments.length; index += 1) {
      const currentSegments = segments.slice(0, index + 1)
      const currentKey = buildWorkspaceTreeKey(sectionId, currentSegments)
      const isLeaf = index === segments.length - 1

      if (isLeaf) {
        siblings.push({
          ...normalizedItem,
          label: itemLabel,
          nodeType: workspacePath.nodeType ?? "document",
          workspacePath: compactObject({
            ...workspacePath,
            key: currentKey,
            parentKey:
              currentSegments.length > 1
                ? buildWorkspaceTreeKey(sectionId, currentSegments.slice(0, -1))
                : null,
          }),
          children: [],
        })
        break
      }

      let folderNode = nodesByKey.get(currentKey)

      if (!folderNode) {
        folderNode = createFolderNode({
          sectionId,
          label: segments[index],
          segments: currentSegments,
          layer: normalizedItem.layer ?? sectionId,
        })
        nodesByKey.set(currentKey, folderNode)
        siblings.push(folderNode)
      }

      siblings = folderNode.children
    }
  }

  return sortWorkspaceTreeNodes(roots)
}
