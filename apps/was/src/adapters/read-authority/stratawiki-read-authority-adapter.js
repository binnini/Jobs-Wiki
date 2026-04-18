import { createTemporarilyUnavailableError } from "../../http/errors.js"

function unavailable() {
  throw createTemporarilyUnavailableError(
    "Real read authority adapter is not configured yet.",
    {
      adapter: "stratawiki_read_authority",
    },
  )
}

export function createStratawikiReadAuthorityAdapter() {
  return {
    getWorkspaceSummary: unavailable,
    listOpportunities: unavailable,
    getOpportunityDetail: unavailable,
    getCalendar: unavailable,
  }
}
