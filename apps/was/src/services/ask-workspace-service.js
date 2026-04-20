export async function askWorkspaceService({
  askWorkspace,
  userContext,
  input,
}) {
  const result = await askWorkspace.askWorkspace({
    userContext,
    question: input.question,
    opportunityId: input.opportunityId,
    documentId: input.documentId,
    // `save` stays reserved in the MVP contract and is intentionally a no-op.
  })

  return {
    ...result,
    evidence: Array.isArray(result.evidence) ? result.evidence : [],
    relatedOpportunities: Array.isArray(result.relatedOpportunities)
      ? result.relatedOpportunities
      : [],
    relatedDocuments: Array.isArray(result.relatedDocuments)
      ? result.relatedDocuments
      : [],
  }
}
