import {
  mapOpportunityListItem,
  mapProjectionSync,
  mapOpportunityRef,
} from "./shared.js"

export function mapWorkspaceSummary(record) {
  return {
    projection: "workspace_summary",
    sync: mapProjectionSync(record.sync, "workspace_summary"),
    profileSnapshot: record.profileSnapshot,
    recommendedOpportunities: record.recommendedOpportunities.map(
      mapOpportunityListItem,
    ),
    marketBrief: record.marketBrief,
    skillsGap: record.skillsGap,
    actionQueue: record.actionQueue?.map((item) => ({
      actionId: item.actionId,
      label: item.label,
      description: item.description,
      relatedOpportunityRef: item.relatedOpportunityId
        ? mapOpportunityRef(item.relatedOpportunityId)
        : undefined,
    })),
    askFollowUps: record.askFollowUps,
  }
}
