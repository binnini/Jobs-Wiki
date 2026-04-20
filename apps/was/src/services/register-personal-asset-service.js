export async function registerPersonalAssetService({
  personalDocument,
  userContext,
  input,
}) {
  return personalDocument.registerPersonalAsset({
    userContext,
    input,
  })
}
