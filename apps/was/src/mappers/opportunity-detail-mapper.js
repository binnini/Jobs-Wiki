import {
  mapEvidenceItem,
  mapKnowledgeObjectRef,
  mapOpportunityRef,
  mapProjectionSync,
  mapRelatedDocument,
} from "./shared.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

export function mapOpportunityDetail(record) {
  return {
    projection: "opportunity_detail",
    sync: mapProjectionSync(record.sync, "opportunity_detail"),
    item: {
      opportunityRef: mapOpportunityRef(record.opportunityId, record.title),
      objectRef: mapKnowledgeObjectRef(record.objectId, "opportunity", record.title),
      surface: compactObject({
        title: record.title,
        summary: record.summary,
        descriptionMarkdown: record.descriptionMarkdown,
      }),
      metadata: compactObject({
        employmentType: record.employmentType,
        opensAt: record.opensAt,
        closesAt: record.closesAt,
        status: record.status,
        source: record.source,
      }),
      company: record.company
        ? compactObject({
            companyRef: record.company.objectId
              ? mapKnowledgeObjectRef(
                  record.company.objectId,
                  "company",
                  record.company.name,
                )
              : undefined,
            name: record.company.name,
            summary: record.company.summary,
            homepageUrl: record.company.homepageUrl,
            mainBusiness: record.company.mainBusiness,
          })
        : undefined,
      roles: record.roles?.map((role) =>
        compactObject({
          roleRef: role.objectId
            ? mapKnowledgeObjectRef(role.objectId, "role", role.label)
            : undefined,
          label: role.label,
        }),
      ),
      qualification: record.qualification,
      analysis: record.analysis,
      evidence: record.evidence?.map(mapEvidenceItem),
      relatedDocuments: record.relatedDocuments?.map(mapRelatedDocument),
    },
  }
}
