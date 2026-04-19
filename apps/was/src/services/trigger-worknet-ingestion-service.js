export async function triggerWorknetIngestionService({
  commandFacade,
  sourceId,
}) {
  return commandFacade.triggerWorknetIngestion({
    sourceId,
  })
}
