export async function getDocumentDetailService({
  readAuthority,
  userContext,
  documentId,
}) {
  return readAuthority.getDocumentDetail({
    userContext,
    documentId,
  })
}
