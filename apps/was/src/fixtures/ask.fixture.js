import { opportunityListFixture } from "./opportunities.fixture.js"

export const askWorkspaceFixture = {
  activeContext: {
    contextType: "workspace",
    title: "워크스페이스 전체 분석",
  },
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
      documentObjectId: "shared:interp:market-trend-jp-backend",
      documentObjectKind: "document",
      documentTitle: "일본 백엔드 채용 트렌드",
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
      documentObjectId: "personal_raw:personal:resume-v3",
      documentObjectKind: "document",
      documentTitle: "이력서_v3 작업본",
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
