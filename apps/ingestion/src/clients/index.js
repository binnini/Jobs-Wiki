import { createStratawikiClient } from "./stratawiki-client.js"
import { createWorknetRecruitingClient } from "./worknet-recruiting-client.js"

export function createClients(env) {
  return {
    stratawiki: createStratawikiClient(env),
    worknetRecruiting: createWorknetRecruitingClient(env),
  }
}
