import { WorknetClient } from "../../../../packages/integrations/worknet/src/client.ts"
import { WorknetRecruitingProvider } from "../../../../packages/integrations/worknet/src/recruiting.ts"

export function createWorknetRecruitingClient(env) {
  const client = new WorknetClient({
    keys: env.worknetKeys,
  })

  return new WorknetRecruitingProvider(client)
}
