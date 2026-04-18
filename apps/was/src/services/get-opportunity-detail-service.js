export async function getOpportunityDetailService({
  readAuthority,
  userContext,
  opportunityId,
}) {
  return readAuthority.getOpportunityDetail({
    userContext,
    opportunityId,
  })
}
