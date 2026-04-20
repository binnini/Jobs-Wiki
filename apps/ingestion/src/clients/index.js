import { createStratawikiWriteClient } from "./stratawiki-write-client.js"
import { createWorknetRecruitingClient } from "./worknet-recruiting-client.js"

export function createClients(env) {
  return {
    stratawiki: createStratawikiWriteClient(env),
    worknetRecruiting: createWorknetRecruitingClient(env),
  }
}
