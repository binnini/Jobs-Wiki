import { opportunityListFixture } from "./opportunities.fixture.js"

export const workspaceSummaryFixture = {
  profileSnapshot: {
    targetRole: "Backend Platform Engineer",
    experience: "5 years",
    education: "B.S. Computer Science",
    location: "Seoul",
    domain: "Developer productivity",
    skills: ["Node.js", "TypeScript", "API design", "Testing"],
    sourceSummary: ["resume", "portfolio", "project notes"],
  },
  recommendedOpportunities: opportunityListFixture,
  marketBrief: {
    signals: [
      "Companies are prioritizing report surfaces that lead into follow-up actions.",
      "API boundary clarity is becoming a hiring requirement for platform teams.",
    ],
    risingSkills: ["Observability", "Contract testing", "Adapter design"],
    notableCompanies: ["Northstar Data", "Fieldline"],
  },
  skillsGap: {
    strong: ["Runtime layout design", "API scaffolding"],
    requested: ["Distributed tracing", "Data warehouse modeling"],
    recommendedToStrengthen: ["Structured logging", "Contract-level test coverage"],
  },
  actionQueue: [
    {
      actionId: "action_review_platform_role",
      label: "Review backend platform role fit",
      description: "Compare current evidence against platform ownership requirements.",
      relatedOpportunityId: "opp_backend_platform",
      relatedOpportunityTitle: "Backend Platform Engineer",
    },
  ],
  askFollowUps: [
    "Which opportunity has the clearest strengths evidence?",
    "What is missing before applying to the platform role?",
  ],
  sync: {
    visibility: "applied",
    version: "mock-v1",
    visibleAt: "2026-04-18T09:00:00.000Z",
  },
}
