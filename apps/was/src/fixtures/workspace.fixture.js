export const workspaceFixture = {
  sections: [
    {
      sectionId: "shared",
      label: "shared",
      items: [
        {
          objectId: "report:baseline",
          objectKind: "report",
          title: "기본 리포트",
          kind: "report",
          layer: "shared",
          path: "/workspace",
          active: true,
        },
        {
          objectId: "calendar:applications",
          objectKind: "calendar",
          title: "지원 일정",
          kind: "calendar",
          layer: "shared",
          path: "/calendar",
        },
        {
          objectId: "shared:interp:market-trend-jp-backend",
          objectKind: "document",
          title: "일본 백엔드 채용 트렌드",
          kind: "document",
          layer: "shared",
          path: "/documents/shared%3Ainterp%3Amarket-trend-jp-backend",
        },
        {
          objectId: "opportunity:backend_platform",
          objectKind: "opportunity",
          title: "Backend Platform Engineer",
          kind: "opportunity",
          layer: "shared",
          path: "/opportunities/opp_backend_platform",
        },
        {
          objectId: "opportunity:report_runtime",
          objectKind: "opportunity",
          title: "Report Runtime Engineer",
          kind: "opportunity",
          layer: "shared",
          path: "/opportunities/opp_report_runtime",
        },
      ],
    },
    {
      sectionId: "personal_raw",
      label: "personal/raw",
      items: [
        {
          objectId: "personal_raw:personal:resume-v3",
          objectKind: "document",
          title: "이력서_v3 작업본",
          kind: "document",
          layer: "personal_raw",
          path: "/documents/personal_raw%3Apersonal%3Aresume-v3",
        },
      ],
    },
    {
      sectionId: "personal_wiki",
      label: "personal/wiki",
      items: [
        {
          objectId: "personal_wiki:personal:backend-application-strategy",
          objectKind: "document",
          title: "Backend 지원 전략 노트",
          kind: "document",
          layer: "personal_wiki",
          path: "/documents/personal_wiki%3Apersonal%3Abackend-application-strategy",
        },
      ],
    },
  ],
  activeProjection: {
    projection: "report",
    objectId: "report:baseline",
  },
  sync: {
    visibility: "applied",
    version: "mock-v1",
    visibleAt: "2026-04-18T09:00:00.000Z",
  },
}
