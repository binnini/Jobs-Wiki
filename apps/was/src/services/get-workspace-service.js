export async function getWorkspaceService({
  readAuthority,
  userContext,
}) {
  return readAuthority.getWorkspace({
    userContext,
  })
}
