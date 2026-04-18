import { createTemporarilyUnavailableError } from "../../http/errors.js"

function unavailable() {
  throw createTemporarilyUnavailableError(
    "Real command facade adapter is not configured yet.",
    {
      adapter: "stratawiki_command_facade",
    },
  )
}

export function createStratawikiCommandFacadeAdapter() {
  return {
    triggerWorknetIngestion: unavailable,
    getCommandStatus: unavailable,
  }
}
