import { mapOpportunityListItem, mapProjectionSync } from "./shared.js"

export function mapOpportunityList(record) {
  return {
    projection: "opportunity_list",
    sync: mapProjectionSync(record.sync, "opportunity_list"),
    items: record.items.map(mapOpportunityListItem),
    nextCursor: record.nextCursor,
  }
}
