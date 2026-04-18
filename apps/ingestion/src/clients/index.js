import { createStratawikiCliClient } from "./stratawiki-cli-client.js"
import { createWorknetRecruitingClient } from "./worknet-recruiting-client.js"

export function createClients(env) {
  return {
    stratawiki: createStratawikiCliClient(env),
    worknetRecruiting: createWorknetRecruitingClient(env),
  }
}
