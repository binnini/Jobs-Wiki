export async function generatePersonalWikiDocumentService({
  personalDocument,
  userContext,
  documentId,
  input,
}) {
  return personalDocument.generatePersonalWikiDocument({
    userContext,
    documentId,
    input,
  })
}
