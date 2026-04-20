export async function suggestPersonalWikiLinksService({
  personalDocument,
  userContext,
  documentId,
  input,
}) {
  return personalDocument.suggestPersonalWikiLinks({
    userContext,
    documentId,
    input,
  })
}
