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

function compactOptionalObject(value) {
  if (!value) {
    return undefined
  }

  const compactedValue = compactObject(value)

  return Object.keys(compactedValue).length > 0 ? compactedValue : undefined
}

function mapOpportunitySource(source) {
  return compactOptionalObject({
    provider: source?.provider,
    sourceId: source?.sourceId,
    sourceUrl: source?.sourceUrl,
    mobileSourceUrl: source?.mobileSourceUrl,
  })
}

function mapCompany(company) {
  return compactOptionalObject({
    companyRef: company?.objectId
      ? mapKnowledgeObjectRef(company.objectId, "company", company.name)
      : undefined,
    name: company?.name,
    summary: company?.summary,
    homepageUrl: company?.homepageUrl,
    mainBusiness: company?.mainBusiness,
  })
}

function mapRoles(roles) {
  const mappedRoles =
    roles
      ?.map((role) =>
        compactOptionalObject({
          roleRef: role.objectId
            ? mapKnowledgeObjectRef(role.objectId, "role", role.label)
            : undefined,
          label: role.label,
        }),
      )
      .filter(Boolean) ?? []

  return mappedRoles.length > 0 ? mappedRoles : undefined
}

function mapQualification(qualification) {
  return compactOptionalObject({
    locationText: qualification?.locationText,
    requirementsText: qualification?.requirementsText,
    selectionProcessText: qualification?.selectionProcessText,
  })
}

function mapAnalysis(analysis) {
  return compactOptionalObject({
    fitScore: analysis?.fitScore,
    strengthsSummary: analysis?.strengthsSummary,
    riskSummary: analysis?.riskSummary,
  })
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
        source: mapOpportunitySource(record.source),
      }),
      company: mapCompany(record.company),
      roles: mapRoles(record.roles),
      qualification: mapQualification(record.qualification),
      analysis: mapAnalysis(record.analysis),
      evidence: record.evidence?.map(mapEvidenceItem),
      relatedDocuments: record.relatedDocuments?.map(mapRelatedDocument),
    },
  }
}
