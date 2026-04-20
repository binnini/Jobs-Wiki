export const documentDetailsFixture = {
  "shared:interp:market-trend-jp-backend": {
    documentId: "shared:interp:market-trend-jp-backend",
    title: "일본 백엔드 채용 트렌드",
    layer: "shared",
    writable: false,
    bodyMarkdown:
      "## 핵심 신호\n\n- 플랫폼/백엔드 수요 증가\n- 운영 경험과 API 설계 강조\n- shared 해석 문서는 직접 수정하지 않고 personal 쪽 작업으로 이어집니다.",
    summary: "현재 shared interpretation 기반으로 정리한 시장 해석 문서입니다.",
    metadata: {
      source: {
        provider: "stratawiki",
        sourceId: "interp:market-trend-jp-backend",
        fetchedAt: "2026-04-20T05:00:00.000Z",
      },
      updatedAt: "2026-04-20T05:00:00.000Z",
      tags: ["shared", "market", "backend"],
    },
    relatedObjects: [
      {
        objectId: "opportunity:backend_platform",
        objectKind: "opportunity",
        title: "Backend Platform Engineer",
      },
      {
        objectId: "company:fieldline_labs",
        objectKind: "company",
        title: "Fieldline Labs",
      },
    ],
    sync: {
      visibility: "applied",
      version: "mock-v1",
      visibleAt: "2026-04-20T05:00:00.000Z",
    },
  },
  "personal_raw:personal:resume-v3": {
    documentId: "personal_raw:personal:resume-v3",
    title: "이력서_v3 작업본",
    layer: "personal_raw",
    writable: true,
    bodyMarkdown:
      "## 경험 요약\n\n- Node.js API 최적화 경험\n- Docker 기반 배포 경험\n- 현재는 personal/raw 작업본으로 유지됩니다.",
    summary: "지원용 이력서를 다듬는 개인 raw 작업 문서입니다.",
    metadata: {
      source: {
        provider: "upload",
        sourceId: "resume-v3.pdf",
        fetchedAt: "2026-04-20T03:00:00.000Z",
      },
      updatedAt: "2026-04-20T03:30:00.000Z",
      tags: ["personal", "raw", "resume"],
    },
    relatedObjects: [
      {
        objectId: "opportunity:backend_platform",
        objectKind: "opportunity",
        title: "Backend Platform Engineer",
      },
    ],
    sync: {
      visibility: "applied",
      version: "mock-v1",
      visibleAt: "2026-04-20T03:30:00.000Z",
    },
  },
  "personal_wiki:personal:backend-application-strategy": {
    documentId: "personal_wiki:personal:backend-application-strategy",
    title: "Backend 지원 전략 노트",
    layer: "personal_wiki",
    writable: true,
    bodyMarkdown:
      "## 지원 전략\n\n- shared 채용 해석을 참고해 personal 관점으로 재구성했습니다.\n- 강조 포인트는 운영 안정성, API 설계, 장애 대응 경험입니다.",
    summary: "raw 노트를 바탕으로 재구성한 personal wiki 문서입니다.",
    metadata: {
      source: {
        provider: "jobs_wiki_generation",
        sourceId: "wiki:backend-application-strategy",
        fetchedAt: "2026-04-20T04:10:00.000Z",
      },
      updatedAt: "2026-04-20T04:10:00.000Z",
      tags: ["personal", "wiki", "strategy"],
    },
    relatedObjects: [
      {
        objectId: "opportunity:report_runtime",
        objectKind: "opportunity",
        title: "Report Runtime Engineer",
      },
      {
        objectId: "document:shared-market-trend",
        objectKind: "document",
        title: "일본 백엔드 채용 트렌드",
      },
    ],
    sync: {
      visibility: "applied",
      version: "mock-v1",
      visibleAt: "2026-04-20T04:10:00.000Z",
    },
  },
}
