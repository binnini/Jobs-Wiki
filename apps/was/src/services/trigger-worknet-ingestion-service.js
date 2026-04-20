export async function triggerWorknetIngestionService({
  commandFacade,
  sourceId,
  requestId,
}) {
  return commandFacade.triggerWorknetIngestion({
    sourceId,
    idempotencyKey: requestId,
  })
}
