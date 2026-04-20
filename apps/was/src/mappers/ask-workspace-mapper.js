import {
  mapEvidenceItem,
  mapKnowledgeObjectRef,
  mapOpportunityListItem,
  mapOpportunityRef,
  mapProjectionSync,
  mapRelatedDocument,
} from "./shared.js"

function mapActiveContext(activeContext) {
  if (!activeContext?.contextType) {
    return undefined
  }

  return {
    contextType: activeContext.contextType,
    title: activeContext.title,
    layer: activeContext.layer,
    opportunityRef: activeContext.opportunityId
      ? mapOpportunityRef(activeContext.opportunityId, activeContext.title)
      : undefined,
    documentRef: activeContext.documentId
      ? mapKnowledgeObjectRef(
          activeContext.documentId,
          "document",
          activeContext.title,
        )
      : undefined,
  }
}

export function mapAskWorkspace(record) {
  return {
    projection: "ask",
    sync: mapProjectionSync(record.sync, "ask"),
    activeContext: mapActiveContext(record.activeContext),
    answer: record.answer,
    evidence: (record.evidence ?? []).map(mapEvidenceItem),
    relatedOpportunities: (record.relatedOpportunities ?? []).map(
      mapOpportunityListItem,
    ),
    relatedDocuments: (record.relatedDocuments ?? []).map(mapRelatedDocument),
  }
}
