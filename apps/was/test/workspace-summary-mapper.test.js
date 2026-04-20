import test from "node:test"
import assert from "node:assert/strict"
import { mapWorkspaceSummary } from "../src/mappers/workspace-summary-mapper.js"

test("mapWorkspaceSummary backfills action queue opportunity titles from recommendations", () => {
  const result = mapWorkspaceSummary({
    profileSnapshot: {
      targetRole: "Backend Engineer",
      experience: "2 years",
      skills: ["Node.js"],
    },
    recommendedOpportunities: [
      {
        opportunityId: "opp_backend_platform",
        objectId: "opportunity:backend_platform",
        title: "Backend Platform Engineer",
      },
    ],
    actionQueue: [
      {
        actionId: "action_review_platform_role",
        label: "Review fit",
        relatedOpportunityId: "opp_backend_platform",
      },
    ],
  })

  assert.deepEqual(result.actionQueue, [
    {
      actionId: "action_review_platform_role",
      label: "Review fit",
      description: undefined,
      relatedOpportunityRef: {
        opportunityId: "opp_backend_platform",
        title: "Backend Platform Engineer",
      },
    },
  ])
})
