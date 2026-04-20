import {
  mapKnowledgeObjectRef,
  mapProjectionSync,
} from "./shared.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function compactOptionalObject(value) {
  if (!value) {
    return undefined
  }

  const compactedValue = compactObject(value)
  return Object.keys(compactedValue).length > 0 ? compactedValue : undefined
}

function mapDocumentSource(source) {
  return compactOptionalObject({
    provider: source?.provider,
    sourceId: source?.sourceId,
    fetchedAt: source?.fetchedAt,
  })
}

export function mapDocumentDetail(record) {
  return {
    projection: "document",
    sync: mapProjectionSync(record.sync, "document"),
    item: {
      documentRef: mapKnowledgeObjectRef(record.documentId, "document", record.title),
      layer: record.layer,
      writable: record.writable,
      surface: compactObject({
        title: record.title,
        bodyMarkdown: record.bodyMarkdown,
        summary: record.summary,
      }),
      metadata: compactOptionalObject({
        source: mapDocumentSource(record.metadata?.source),
        updatedAt: record.metadata?.updatedAt,
        tags: record.metadata?.tags,
      }),
      relatedObjects: record.relatedObjects?.map((item) =>
        mapKnowledgeObjectRef(item.objectId, item.objectKind, item.title),
      ),
    },
  }
}
