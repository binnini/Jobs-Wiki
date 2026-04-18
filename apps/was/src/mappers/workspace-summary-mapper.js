import {
  mapOpportunityListItem,
  mapProjectionSync,
  mapOpportunityRef,
} from "./shared.js"

export function mapWorkspaceSummary(record) {
  const recommendedOpportunities = (record.recommendedOpportunities ?? []).map(
    mapOpportunityListItem,
  )
  const recommendedOpportunityTitles = new Map(
    (record.recommendedOpportunities ?? [])
      .filter((item) => item.opportunityId && item.title)
      .map((item) => [item.opportunityId, item.title]),
  )

  return {
    projection: "workspace_summary",
    sync: mapProjectionSync(record.sync, "workspace_summary"),
    profileSnapshot: record.profileSnapshot,
    recommendedOpportunities,
    marketBrief: record.marketBrief,
    skillsGap: record.skillsGap,
    actionQueue: record.actionQueue?.map((item) => ({
      actionId: item.actionId,
      label: item.label,
      description: item.description,
      relatedOpportunityRef: item.relatedOpportunityId
        ? mapOpportunityRef(
            item.relatedOpportunityId,
            item.relatedOpportunityTitle ??
              recommendedOpportunityTitles.get(item.relatedOpportunityId),
          )
        : undefined,
    })),
    askFollowUps: record.askFollowUps,
  }
}
