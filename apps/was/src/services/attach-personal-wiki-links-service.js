export async function attachPersonalWikiLinksService({
  personalDocument,
  userContext,
  documentId,
  input,
}) {
  return personalDocument.attachPersonalWikiLinks({
    userContext,
    documentId,
    input,
  })
}
