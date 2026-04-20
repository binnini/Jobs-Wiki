import { triggerWorknetIngestionService } from "../services/trigger-worknet-ingestion-service.js"
import { validateWorknetSourceId } from "../validators/command-validator.js"

function getIdempotencyKey(headers) {
  const headerValue =
    headers["idempotency-key"] ?? headers["x-idempotency-key"] ?? undefined

  if (typeof headerValue !== "string" || headerValue.trim() === "") {
    return undefined
  }

  return headerValue.trim()
}

export function createAdminRoutes({ adapters }) {
  return [
    {
      method: "POST",
      path: "/api/admin/ingestions/worknet/:sourceId",
      name: "triggerWorknetIngestion",
      async handler(context) {
        const sourceId = validateWorknetSourceId(context.params.sourceId)
        const result = await triggerWorknetIngestionService({
          commandFacade: adapters.commandFacade,
          sourceId,
          requestId: getIdempotencyKey(context.headers) ?? context.requestId,
        })

        return {
          status: 202,
          body: result,
        }
      },
    },
  ]
}
