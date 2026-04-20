export async function updateDocumentService({
  personalDocument,
  userContext,
  documentId,
  input,
}) {
  return personalDocument.updatePersonalDocument({
    userContext,
    documentId,
    input,
  })
}
