export async function listOpportunitiesService({
  readAuthority,
  userContext,
  query,
}) {
  return readAuthority.listOpportunities({
    userContext,
    query,
  })
}
