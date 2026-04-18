export async function askWorkspaceService({
  askWorkspace,
  userContext,
  input,
}) {
  return askWorkspace.askWorkspace({
    userContext,
    question: input.question,
    opportunityId: input.opportunityId,
    save: input.save,
  })
}
