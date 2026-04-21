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

function mapDocumentGeneration(generation) {
  return compactOptionalObject({
    operation: generation?.operation,
    provider: generation?.provider,
    model: generation?.model,
    generatedAt: generation?.generatedAt,
    sourceDocument: compactOptionalObject({
      documentId: generation?.sourceDocument?.documentId,
      title: generation?.sourceDocument?.title,
      layer: generation?.sourceDocument?.layer,
      version: generation?.sourceDocument?.version,
    }),
    trace: Array.isArray(generation?.trace) ? generation.trace : undefined,
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
        version: record.metadata?.version,
        assetRefs: record.metadata?.assetRefs,
        status: record.metadata?.status,
        generation: mapDocumentGeneration(record.metadata?.generation),
      }),
      relatedObjects: record.relatedObjects?.map((item) =>
        mapKnowledgeObjectRef(item.objectId, item.objectKind, item.title),
      ),
    },
  }
}
