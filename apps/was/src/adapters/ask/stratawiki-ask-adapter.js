import { createTemporarilyUnavailableError } from "../../http/errors.js"

function unavailable() {
  throw createTemporarilyUnavailableError(
    "Real ask adapter is not configured yet.",
    {
      adapter: "stratawiki_ask_workspace",
    },
  )
}

export function createStratawikiAskAdapter() {
  return {
    askWorkspace: unavailable,
  }
}
