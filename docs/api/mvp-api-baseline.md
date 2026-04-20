---
status: draft
---

# MVP API Baseline

## Purpose

이 문서는 Jobs-Wiki 웹 구현에서 사용할 현재 MVP API 기준선을
workspace-first 제품 방향에 맞춰 다시 고정합니다.

이 문서는 두 가지를 동시에 명확히 합니다.

- `Target MVP`
  - PKM knowledge workspace를 메인 UX로 두는 제품 목표
- `Current Implemented Slice`
  - 현재 이미 동작 중인 report/opportunity/ask/calendar 중심 API 자산

즉, 이 문서는 "현재 구현된 것을 버리지 않고 workspace 안으로 재배치한다"는 관점의 기준선입니다.

## Scope

이 baseline은 아래 화면 흐름을 우선 지원합니다.

- `Workspace Shell`
- `Document / Object Detail`
- `Baseline Report`
- `Ask Workspace`
- `Opportunity Detail`
- `Calendar`

이번 문서가 의도적으로 뒤로 미루는 것:

- graph projection
- advanced search
- broad command family
- ingestion 운영 API 전체
- auth/session 세부

## Current Product Decision

현재 MVP의 메인 홈은 `report`가 아니라 `workspace shell`입니다.

현재 원칙:

- 첫 API-backed 홈 화면은 `workspace shell`입니다.
- `report`는 workspace 안의 핵심 projection 중 하나입니다.
- `document`와 `opportunity`는 workspace 안의 주요 object/detail surface입니다.
- `Ask`는 workspace context를 증폭하는 analysis surface입니다.
- `Calendar`는 workspace projection 중 하나입니다.
- `shared`는 interpretation layer의 문서형 read-only view입니다.
- `personal`은 writable workspace이며 `raw`와 `wiki`로 구분됩니다.

현재 구현 메모:

- 이미 구현된 read slice는 `workspace_summary + opportunity + ask + calendar`에 더 가깝습니다.
- 이 문서는 그 자산을 workspace-first MVP의 내부 projection으로 재배치합니다.

## Endpoint Set

이번 MVP 목표 기준선 endpoint는 아래 projection route를 중심으로 둡니다.

1. `GET /api/workspace`
2. `GET /api/documents/{documentId}`
3. `POST /api/documents`
4. `PATCH /api/documents/{documentId}`
5. `DELETE /api/documents/{documentId}`
6. `POST /api/assets`
7. `GET /api/workspace/summary`
8. `POST /api/workspace/ask`
9. `POST /api/documents/{documentId}/summarize`
10. `POST /api/documents/{documentId}/rewrite`
11. `POST /api/documents/{documentId}/link`
12. `GET /api/opportunities`
13. `GET /api/opportunities/{opportunityId}`
14. `GET /api/calendar`

운영/동기화 보조 endpoint:

- `GET /api/workspace/sync`
- `POST /api/admin/ingestions/worknet/{sourceId}`

현재 sync/status 기준선:

- `GET /api/workspace/sync`
  - read-side projection visibility를 조회합니다.
  - `commandId` query가 있으면 command status, retryable error shape, refresh scope를 함께 반환할 수 있습니다.
- `POST /api/admin/ingestions/worknet/{sourceId}`
  - ingestion trigger를 직접 수행하지 않고 external MCP facade로 위임합니다.
  - accepted response는 `commandId`와 projection visibility hint를 포함할 수 있습니다.

현재 구현된 endpoint slice:

- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/calendar`
- `GET /api/workspace/sync`
- `POST /api/admin/ingestions/worknet/{sourceId}`

즉 `GET /api/workspace`, `GET /api/documents/{documentId}`, personal CRUD,
asset registration, wiki generation endpoint는 새 workspace-first MVP 기준에서 추가로 맞춰가야 할 target endpoint입니다.

## Shared Rules

### 1. Frontend Boundary

- frontend는 WAS만 호출합니다.
- frontend는 StrataWiki나 third-party source를 직접 호출하지 않습니다.
- frontend는 raw canonical schema를 직접 다루지 않습니다.

### 2. Projection Language

- frontend-facing language는 `workspace`, `document`, `opportunity`, `summary`, `calendar`, `ask` projection을 사용합니다.
- canonical entity 이름은 API 내부 구현 근거로만 사용합니다.
- 사용자 화면에서는 `job_posting`보다 `opportunity` 언어를 우선합니다.

### 3. Sync Vocabulary

현재 단계에서는 top-level `sync`를 optional field로 유지합니다.

```ts
type ProjectionSyncState = {
  projection:
    | "workspace"
    | "document"
    | "workspace_summary"
    | "ask"
    | "opportunity_list"
    | "opportunity_detail"
    | "calendar";
  visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
  lastKnownVersion?: string;
  lastVisibleAt?: string;
  refreshRecommended?: boolean;
};
```

### 4. Ref Rule

```ts
type KnowledgeObjectRef = {
  objectId: string;
  objectKind: string;
  title?: string;
};
```

## Fixed Shapes

### 1. `GET /api/workspace`

역할:

- workspace shell first load
- navigation과 active context 제공

target shape:

```ts
type WorkspaceShellResponse = {
  projection: "workspace";
  sync?: ProjectionSyncState;
  navigation: {
    sections: Array<{
      sectionId: string;
      label: string;
      items: Array<{
        objectRef: KnowledgeObjectRef;
        kind: "document" | "opportunity" | "report" | "calendar";
        layer: "shared" | "personal_raw" | "personal_wiki";
        active?: boolean;
      }>;
    }>;
  };
  activeProjection?: {
    projection: "report" | "document" | "opportunity" | "calendar" | "ask";
    objectRef?: KnowledgeObjectRef;
  };
};
```

메모:

- 현재 구현에서는 `/api/workspace/summary`가 workspace shell의 일부 역할을 대신합니다.
- `shared`는 read-only입니다.
- `personal_raw`, `personal_wiki`는 writable personal directory입니다.
- upstream 관점에서는 shared read와 personal write를 다른 resource family로 보는 편이 맞습니다.

### 2. `GET /api/documents/{documentId}`

역할:

- generic document or knowledge object detail

target shape:

```ts
type DocumentDetailResponse = {
  projection: "document";
  sync?: ProjectionSyncState;
  item: {
    documentRef: KnowledgeObjectRef;
    layer: "shared" | "personal_raw" | "personal_wiki";
    writable: boolean;
    surface: {
      title: string;
      bodyMarkdown?: string;
      summary?: string;
    };
    metadata?: {
      source?: string;
      updatedAt?: string;
      tags?: string[];
    };
    relatedObjects?: KnowledgeObjectRef[];
  };
};
```

메모:

- 현재 구현은 generic document detail보다 opportunity detail에 더 가깝습니다.
- `shared` 문서는 항상 `writable: false`여야 합니다.
- `personal_raw`, `personal_wiki`는 `writable: true`일 수 있습니다.

### 3. `POST /api/documents`

역할:

- personal layer 문서 생성
- markdown 문서 생성 entry

현재 규칙:

- target layer는 `personal_raw` 또는 `personal_wiki`만 허용합니다.
- `shared`로의 직접 생성은 허용하지 않습니다.
- PDF는 first-wave에서 `POST /api/assets`로 등록한 뒤 문서에 연결하는 편이 안전합니다.

### 4. `PATCH /api/documents/{documentId}`

역할:

- personal layer 문서 수정

현재 규칙:

- `shared` 문서 수정은 허용하지 않습니다.
- personal 변경은 상위 layer로 자동 전파되지 않습니다.

### 5. `DELETE /api/documents/{documentId}`

역할:

- personal layer 문서 삭제

현재 규칙:

- `shared` 문서 삭제는 허용하지 않습니다.

### 6.5.5 `POST /api/assets`

역할:

- user-scoped binary asset registration
- PDF 같은 파일을 personal document에 연결하기 위한 선행 단계

현재 규칙:

- shared asset이라는 개념은 두지 않습니다.
- asset은 user scope로만 등록합니다.
- binary upload transport는 first-wave에서 WAS concern일 수 있지만,
  asset authority는 upstream personal asset contract를 따릅니다.

### 6. `GET /api/workspace/summary`

역할:

- report projection aggregate
- personal snapshot, recommended opportunities, market signals, action queue 제공

```ts
type WorkspaceSummaryResponse = {
  projection: "workspace_summary";
  sync?: ProjectionSyncState;
  profileSnapshot: {
    targetRole: string;
    experience: string;
    education?: string;
    location?: string;
    domain?: string;
    skills: string[];
    sourceSummary?: string[];
  };
  recommendedOpportunities: OpportunityListItem[];
  marketBrief?: {
    signals: string[];
    risingSkills?: string[];
    notableCompanies?: string[];
  };
  skillsGap?: {
    strong: string[];
    requested: string[];
    recommendedToStrengthen: string[];
  };
  actionQueue?: Array<{
    actionId: string;
    label: string;
    description?: string;
    relatedOpportunityRef?: OpportunityRef;
  }>;
  askFollowUps?: string[];
};
```

### 7. `POST /api/workspace/ask`

역할:

- question -> structured answer -> evidence -> related opportunities / documents
- workspace-connected analysis

request:

```ts
type AskWorkspaceRequest = {
  question: string;
  documentId?: string;
  opportunityId?: string;
  save?: boolean;
};
```

response:

```ts
type AskWorkspaceResponse = {
  projection: "ask";
  sync?: ProjectionSyncState;
  answer: {
    answerId?: string;
    markdown: string;
    generatedAt?: string;
  };
  evidence: OpportunityEvidenceItem[];
  relatedOpportunities?: OpportunityListItem[];
  relatedDocuments?: Array<{
    documentRef: KnowledgeObjectRef;
    role?: "personal" | "interpretation" | "fact" | "note";
    excerpt?: string;
  }>;
};
```

현재 규칙:

- `opportunityId`가 있으면 해당 공고 중심 질문으로 처리합니다.
- `documentId`가 있으면 해당 문서 중심 질문으로 처리합니다.
- 둘 다 없으면 전체 profile/workspace context 기반 질문으로 처리합니다.
- `save`는 현재 MVP에서 reserved field로 둡니다.
- `shared`를 참조한 결과도 기록은 personal에만 남겨야 합니다.

### 8. `POST /api/documents/{documentId}/summarize`

- personal/raw 또는 personal 문서를 요약해 personal/wiki artifact 생성

### 9. `POST /api/documents/{documentId}/rewrite`

- 문서를 재작성해 personal/wiki artifact 생성

### 10. `POST /api/documents/{documentId}/link`

- 문서 관계, related object, link suggestion 생성 또는 부착

공통 규칙:

- 이 세 action의 결과는 항상 personal layer에 기록됩니다.
- 이 action은 상위 Fact/Interpretation layer를 직접 수정하지 않습니다.
- shared 기반 generation도 저장 target은 personal 뿐입니다.

### 11. `GET /api/opportunities`

역할:

- 추천 공고 리스트
- Ask 결과 내 연관 공고 비교
- workspace 안의 opportunity navigation

```ts
type OpportunityListResponse = {
  projection: "opportunity_list";
  sync?: ProjectionSyncState;
  items: OpportunityListItem[];
  nextCursor?: string;
};
```

### 12. `GET /api/opportunities/{opportunityId}`

역할:

- 단일 공고 상세
- 회사 맥락, 직무 요약, 자격 요건, evidence anchor 제공

```ts
type OpportunityDetailResponse = {
  projection: "opportunity_detail";
  sync?: ProjectionSyncState;
  item: OpportunityDetail;
};
```

### 13. `GET /api/calendar`

역할:

- 공고 마감 일정 확인
- list/grid calendar 양쪽에서 공통 사용

```ts
type CalendarResponse = {
  projection: "calendar";
  sync?: ProjectionSyncState;
  items: Array<{
    calendarItemId: string;
    kind: "opportunity_deadline" | "opportunity_open";
    label: string;
    startsAt: string;
    endsAt?: string;
    objectRef: KnowledgeObjectRef & {
      opportunityId?: string;
    };
    decoration?: {
      urgencyLabel?: string;
      companyName?: string;
    };
  }>;
};
```

## Opportunity Projection Baseline

현재 구현에서 사용하는 `opportunity` 최소 shape는 유지합니다.

```ts
type OpportunityRef = {
  opportunityId: string;
  title?: string;
};

type OpportunityListItem = {
  opportunityRef: OpportunityRef;
  objectRef: {
    objectId: string;
    objectKind: "opportunity";
    title?: string;
  };
  surface: {
    title: string;
    companyName?: string;
    roleLabels?: string[];
    summary?: string;
  };
  metadata?: {
    employmentType?: string;
    opensAt?: string;
    closesAt?: string;
    status?: "open" | "closing_soon" | "closed" | "unknown";
  };
  decoration?: {
    urgencyLabel?: string;
    closingInDays?: number;
    whyMatched?: string;
    sourceLabel?: string;
  };
};

type OpportunityDetail = {
  opportunityRef: OpportunityRef;
  objectRef: {
    objectId: string;
    objectKind: "opportunity";
    title?: string;
  };
  surface: {
    title: string;
    summary?: string;
    descriptionMarkdown?: string;
  };
  metadata?: {
    employmentType?: string;
    opensAt?: string;
    closesAt?: string;
    status?: "open" | "closing_soon" | "closed" | "unknown";
    source?: {
      provider?: string;
      sourceId?: string;
      sourceUrl?: string;
      mobileSourceUrl?: string;
    };
  };
  company?: {
    companyRef?: KnowledgeObjectRef;
    name: string;
    summary?: string;
    homepageUrl?: string;
    mainBusiness?: string;
  };
  roles?: Array<{
    roleRef?: KnowledgeObjectRef;
    label: string;
  }>;
  qualification?: {
    locationText?: string;
    requirementsText?: string;
    selectionProcessText?: string;
  };
  analysis?: {
    fitScore?: number;
    strengthsSummary?: string;
    riskSummary?: string;
  };
  evidence?: OpportunityEvidenceItem[];
  relatedDocuments?: Array<{
    documentRef: KnowledgeObjectRef;
    role?: "personal" | "interpretation" | "fact" | "note";
    excerpt?: string;
  }>;
};

type OpportunityEvidenceItem = {
  evidenceId: string;
  kind: "fact" | "interpretation" | "personal";
  label: string;
  documentRef?: KnowledgeObjectRef;
  excerpt?: string;
  provenance?: {
    sourceVersion?: string;
    sourcePointer?: string;
  };
};
```

## Screen Mapping

- `Workspace Shell`
  - `GET /api/workspace`
- `Document Detail`
  - `GET /api/documents/{documentId}`
- `Personal Document Create/Update/Delete`
  - `POST /api/documents`
  - `PATCH /api/documents/{documentId}`
  - `DELETE /api/documents/{documentId}`
- `Personal Asset Registration`
  - `POST /api/assets`
- `기본 리포트`
  - `GET /api/workspace/summary`
- `Ask Workspace`
  - `POST /api/workspace/ask`
- `Personal Wiki Generation`
  - `POST /api/documents/{documentId}/summarize`
  - `POST /api/documents/{documentId}/rewrite`
  - `POST /api/documents/{documentId}/link`
- `추천 공고 / 연관 공고`
  - `GET /api/opportunities`
- `Opportunity Detail`
  - `GET /api/opportunities/{opportunityId}`
- `Calendar`
  - `GET /api/calendar`

현재 frontend route baseline 참고:

- `/workspace`
- `/documents/:documentId`
- `/report`
- `/opportunities/:opportunityId`
- `/ask?opportunityId=...`
- `/ask?documentId=...`
- `/calendar`

## Implementation Order

현재 구현 자산을 최대한 살리려면 아래 순서가 안전합니다.

1. `GET /api/workspace/summary`
2. `GET /api/opportunities`
3. `GET /api/opportunities/{opportunityId}`
4. `POST /api/workspace/ask`
5. `GET /api/calendar`
6. `GET /api/workspace`
7. `GET /api/documents/{documentId}`
8. `POST /api/assets`
9. `POST /api/documents`
10. `PATCH /api/documents/{documentId}`
11. `DELETE /api/documents/{documentId}`
12. `POST /api/documents/{documentId}/summarize`
13. `POST /api/documents/{documentId}/rewrite`
14. `POST /api/documents/{documentId}/link`

이 순서를 쓰는 이유:

- 현재 구현 자산이 report/opportunity/ask/calendar에 집중되어 있기 때문입니다.
- workspace-first MVP로 가더라도 기존 구현을 shell과 projection으로 재배치하는 편이 안전합니다.
- personal authoring과 wiki generation은 새로 추가된 MVP 기능이므로, 기존 read slice를 감싼 뒤 붙이는 편이 안전합니다.
- PDF 같은 binary asset은 first-wave에서 asset registration을 먼저 도입하는 편이 transport와 authority를 분리하기 쉽습니다.

## Out of Scope for This Slice

- final public versioning
- graph endpoint
- advanced search endpoint
- broad public resource API family
- full command family

## Relationship to Other Docs

- `docs/product/llm-requirements-baseline.md`
- `docs/product/mvp-requirements-baseline.md`
- `docs/api/was-mvp-contract.md`
- `docs/api/opportunity-projection.md`
- `docs/api/workspace-mvp-read-contract.md`

현재 구현을 진행할 때는 이 문서를 먼저 보고,
workspace-first MVP 목표와 current implemented slice를 함께 해석하는 것을 권장합니다.
