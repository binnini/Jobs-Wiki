export async function createDocumentService({
  personalDocument,
  userContext,
  input,
}) {
  return personalDocument.createPersonalDocument({
    userContext,
    input,
  })
}
