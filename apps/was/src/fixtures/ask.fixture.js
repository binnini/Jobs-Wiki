import { opportunityListFixture } from "./opportunities.fixture.js"

export const askWorkspaceFixture = {
  answer: {
    answerId: "answer_mock_gap_review",
    markdown:
      "The strongest fit is the backend platform role because the current profile already shows API boundary design and runtime scaffolding experience.",
    generatedAt: "2026-04-18T09:00:00.000Z",
  },
  evidence: [
    {
      evidenceId: "evidence_mock_api_boundary",
      kind: "interpretation",
      label: "Service and adapter separation is already part of the candidate story.",
      documentObjectId: "document:note:service-boundary",
      documentObjectKind: "note",
      documentTitle: "Service Boundary Note",
      excerpt: "Separated route, service, mapper, and adapter concerns in prior work.",
      provenance: {
        sourceVersion: "mock-v1",
        sourcePointer: "note-1",
      },
    },
  ],
  relatedOpportunities: opportunityListFixture,
  relatedDocuments: [
    {
      documentObjectId: "document:resume",
      documentObjectKind: "document",
      documentTitle: "Resume Snapshot",
      role: "personal",
      excerpt: "Highlights backend API ownership and architecture work.",
    },
  ],
  sync: {
    visibility: "applied",
    version: "mock-v1",
    visibleAt: "2026-04-18T09:00:00.000Z",
  },
}
