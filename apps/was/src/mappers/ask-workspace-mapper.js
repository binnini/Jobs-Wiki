import {
  mapEvidenceItem,
  mapOpportunityListItem,
  mapProjectionSync,
  mapRelatedDocument,
} from "./shared.js"

export function mapAskWorkspace(record) {
  return {
    projection: "ask",
    sync: mapProjectionSync(record.sync, "ask"),
    answer: record.answer,
    evidence: record.evidence.map(mapEvidenceItem),
    relatedOpportunities: record.relatedOpportunities?.map(mapOpportunityListItem),
    relatedDocuments: record.relatedDocuments?.map(mapRelatedDocument),
  }
}
