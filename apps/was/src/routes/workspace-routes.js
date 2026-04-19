import { mapAskWorkspace } from "../mappers/ask-workspace-mapper.js"
import { mapWorkspaceSummary } from "../mappers/workspace-summary-mapper.js"
import { mapWorkspaceSync } from "../mappers/workspace-sync-mapper.js"
import { askWorkspaceService } from "../services/ask-workspace-service.js"
import { getWorkspaceSyncService } from "../services/get-workspace-sync-service.js"
import { getWorkspaceSummaryService } from "../services/get-workspace-summary-service.js"
import {
  validateAskWorkspaceRequest,
  validateWorkspaceSyncQuery,
} from "../validators/workspace-validator.js"

export function createWorkspaceRoutes({ adapters }) {
  return [
    {
      method: "GET",
      path: "/api/workspace/summary",
      name: "getWorkspaceSummary",
      async handler(context) {
        const result = await getWorkspaceSummaryService({
          readAuthority: adapters.readAuthority,
          userContext: context.userContext,
        })

        return {
          status: 200,
          body: mapWorkspaceSummary(result),
        }
      },
    },
    {
      method: "POST",
      path: "/api/workspace/ask",
      name: "askWorkspace",
      async handler(context) {
        const input = validateAskWorkspaceRequest(await context.readJsonBody())
        const result = await askWorkspaceService({
          askWorkspace: adapters.askWorkspace,
          userContext: context.userContext,
          input,
        })

        return {
          status: 200,
          body: mapAskWorkspace(result),
        }
      },
    },
    {
      method: "GET",
      path: "/api/workspace/sync",
      name: "getWorkspaceSync",
      async handler(context) {
        const query = validateWorkspaceSyncQuery(context.searchParams)
        const result = await getWorkspaceSyncService({
          readAuthority: adapters.readAuthority,
          commandFacade: adapters.commandFacade,
          userContext: context.userContext,
          query,
        })

        return {
          status: 200,
          body: mapWorkspaceSync(result),
        }
      },
    },
  ]
}
