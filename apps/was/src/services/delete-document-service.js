export async function deleteDocumentService({
  personalDocument,
  userContext,
  documentId,
  input,
}) {
  return personalDocument.deletePersonalDocument({
    userContext,
    documentId,
    input,
  })
}
