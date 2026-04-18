function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

export function mapProjectionSync(sync, projection) {
  if (!sync) {
    return undefined
  }

  return compactObject({
    projection,
    visibility: sync.visibility,
    lastKnownVersion: sync.version,
    lastVisibleAt: sync.visibleAt,
    refreshRecommended:
      sync.visibility === "partial" || sync.visibility === "stale"
        ? true
        : undefined,
  })
}

export function mapOpportunityRef(opportunityId, title) {
  return compactObject({
    opportunityId,
    title,
  })
}

export function mapKnowledgeObjectRef(objectId, objectKind, title) {
  return compactObject({
    objectId,
    objectKind,
    title,
  })
}

export function mapOpportunityListItem(record) {
  return compactObject({
    opportunityRef: mapOpportunityRef(record.opportunityId, record.title),
    objectRef: mapKnowledgeObjectRef(record.objectId, "opportunity", record.title),
    surface: compactObject({
      title: record.title,
      companyName: record.companyName,
      roleLabels: record.roleLabels,
      summary: record.summary,
    }),
    metadata: compactObject({
      employmentType: record.employmentType,
      opensAt: record.opensAt,
      closesAt: record.closesAt,
      status: record.status,
    }),
    decoration: compactObject({
      urgencyLabel: record.urgencyLabel,
      closingInDays: record.closingInDays,
      whyMatched: record.whyMatched,
      sourceLabel: record.sourceLabel,
    }),
  })
}

export function mapEvidenceItem(record) {
  return compactObject({
    evidenceId: record.evidenceId,
    kind: record.kind,
    label: record.label,
    documentRef:
      record.documentObjectId && record.documentObjectKind
        ? mapKnowledgeObjectRef(
            record.documentObjectId,
            record.documentObjectKind,
            record.documentTitle,
          )
        : undefined,
    excerpt: record.excerpt,
    provenance: record.provenance,
  })
}

export function mapRelatedDocument(record) {
  return compactObject({
    documentRef: mapKnowledgeObjectRef(
      record.documentObjectId,
      record.documentObjectKind,
      record.documentTitle,
    ),
    role: record.role,
    excerpt: record.excerpt,
  })
}
