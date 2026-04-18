export async function getWorkspaceSummaryService({
  readAuthority,
  userContext,
}) {
  return readAuthority.getWorkspaceSummary({
    userContext,
  })
}
