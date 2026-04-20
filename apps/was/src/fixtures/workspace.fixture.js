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
      items: [],
    },
    {
      sectionId: "personal_wiki",
      label: "personal/wiki",
      items: [],
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
