import { triggerWorknetIngestionService } from "../services/trigger-worknet-ingestion-service.js"
import { validateWorknetSourceId } from "../validators/command-validator.js"

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
        })

        return {
          status: 202,
          body: result,
        }
      },
    },
  ]
}
