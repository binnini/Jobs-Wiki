---
status: draft
---

# MVP API Baseline

## Purpose

이 문서는 현재 Jobs-Wiki 웹 구현에서 바로 사용할 API 기준선을 한 장으로 고정합니다.

기존 문서들이 다음 내용을 각각 넓게 설명하고 있다면,
이 문서는 현재 wireframe과 prototype을 실제 코드로 옮길 때 참고할 최소 범위를 좁게 정리합니다.

- 어떤 화면을 먼저 API로 붙일지
- 어떤 endpoint를 이번 slice에 포함할지
- 어떤 field를 지금 단계에서 required로 볼지
- 무엇을 이번 단계에서 의도적으로 미룰지

## Scope

이 baseline은 아래 화면 흐름을 우선 지원합니다.

- `기본 리포트`
- `Ask Workspace`
- `Opportunity Detail`
- `Calendar`

이번 문서가 의도적으로 뒤로 미루는 것:

- full workspace tree explorer
- graph projection
- generic command family
- ingestion 운영 API 전체
- auth/session 세부

## Current Product Decision

현재 첫 구현의 홈은 `workspace summary` 일반형보다, `기본 리포트형 홈`으로 둡니다.

즉, 이번 MVP에서는 아래 원칙을 사용합니다.

- 첫 API-backed 홈 화면은 `기본 리포트`입니다.
- `추천 공고`가 메인 블록입니다.
- `Ask`는 리포트를 확장하는 follow-up surface입니다.
- `Opportunity Detail`은 지원 판단용 detail shell입니다.
- `Calendar`는 마감 일정 확인용 read surface입니다.
- `Opportunity Detail`에는 안정적인 read 분석 데이터가 포함될 수 있습니다.
  - 예: 적합도 점수, 강점 요약, 리스크 요약
- 생성형 면접 시나리오나 확장 분석은 별도 detail endpoint보다 `Ask` 진입으로 우선 처리합니다.

## Endpoint Set

이번 MVP 구현 기준선 endpoint는 아래 다섯 개의 사용자-facing projection route를 중심으로 둡니다.

1. `GET /api/workspace/summary`
2. `POST /api/workspace/ask`
3. `GET /api/opportunities`
4. `GET /api/opportunities/{opportunityId}`
5. `GET /api/calendar`

운영/동기화 보조 endpoint는 별도로 아래를 둡니다.

- `GET /api/workspace/sync`
- `POST /api/admin/ingestions/worknet/{sourceId}`

이번 단계에서 문서로는 남겨두되 구현 우선순위에서 뒤로 미루는 endpoint:

- `GET /api/documents/{documentId}`

## Shared Rules

### 1. Frontend Boundary

- frontend는 WAS만 호출합니다.
- frontend는 StrataWiki나 third-party source를 직접 호출하지 않습니다.
- frontend는 raw canonical schema를 직접 다루지 않습니다.

### 2. Projection Language

- frontend-facing language는 `opportunity`, `summary`, `calendar`, `ask` projection을 사용합니다.
- canonical entity 이름은 API 내부 구현 근거로만 사용합니다.
- 사용자 화면에서는 `job_posting`보다 `opportunity` 언어를 우선합니다.

### 3. Sync Vocabulary

현재 단계에서는 top-level `sync`를 optional field로 유지합니다.

유력 vocabulary:

- `applied`
- `pending`
- `partial`
- `unknown`
- `stale`

유력 최소 shape:

```ts
type ProjectionSyncState = {
  projection:
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

object identity anchor는 object ref를 우선 사용합니다.

```ts
type KnowledgeObjectRef = {
  objectId: string;
  objectKind: string;
  title?: string;
};
```

## Fixed Shapes

### 1. `GET /api/workspace/summary`

역할:

- 기본 리포트 첫 화면 aggregate
- 개인 요약, 추천 공고, 시장 브리핑, 액션 큐를 한 번에 제공

현재 구현 기준 shape:

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

메모:

- 기존 `workspace_summary` candidate보다 현재 baseline report 화면 요구사항에 맞춰 더 직접적인 block을 우선합니다.

### 2. `POST /api/workspace/ask`

역할:

- 질문 -> structured answer -> evidence -> related opportunities

request:

```ts
type AskWorkspaceRequest = {
  question: string;
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

현재 baseline 규칙:

- `opportunityId`가 있으면 해당 공고 중심 질문으로 처리합니다.
- 없으면 전체 profile/workspace context 기반 질문으로 처리합니다.
- Ask 화면은 최소한 `answer`, `evidence`, `relatedOpportunities`를 보여줄 수 있어야 합니다.
- `save`는 현재 MVP에서 reserved field로 둡니다.
  - backend는 무시하거나 no-op로 처리할 수 있습니다.
  - persisted answer read contract는 이번 slice 범위 밖입니다.

### 3. `GET /api/opportunities`

역할:

- 추천 공고 리스트
- Ask 결과 내 연관 공고 비교
- 별도 opportunity list 화면의 기반

query:

- `cursor`
- `limit`
- `status`
- `closingWithinDays`

response:

```ts
type OpportunityListResponse = {
  projection: "opportunity_list";
  sync?: ProjectionSyncState;
  items: OpportunityListItem[];
  nextCursor?: string;
};
```

### 4. `GET /api/opportunities/{opportunityId}`

역할:

- 단일 공고 상세
- 회사 맥락, 직무 요약, 자격 요건, evidence anchor 제공

response:

```ts
type OpportunityDetailResponse = {
  projection: "opportunity_detail";
  sync?: ProjectionSyncState;
  item: OpportunityDetail;
};
```

### 5. `GET /api/calendar`

역할:

- 공고 마감 일정 확인
- list/grid calendar 양쪽에서 공통 사용

query:

- `from`
- `to`

response:

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

메모:

- `objectRef.objectKind === "opportunity"` 인 calendar item은
  `objectRef.opportunityId`를 함께 제공하는 것을 현재 MVP 기준선으로 둡니다.
- 목적은 calendar item만으로 opportunity detail route를 바로 여는 것입니다.

## Opportunity Projection Baseline

현재 구현에서 사용하는 `opportunity` 최소 shape는 아래처럼 둡니다.

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

현재 화면과 endpoint 매핑은 아래처럼 고정합니다.

- `기본 리포트`
  - `GET /api/workspace/summary`
- `Ask Workspace`
  - `POST /api/workspace/ask`
- `추천 공고 / 연관 공고`
  - `GET /api/opportunities`
- `Opportunity Detail`
  - `GET /api/opportunities/{opportunityId}`
- `Calendar`
  - `GET /api/calendar`

현재 frontend route baseline 참고:

- `/report`
- `/opportunities/:opportunityId`
- `/ask?opportunityId=...`
- `/calendar`

## Implementation Order

현재 구현 순서는 아래가 가장 안전합니다.

1. `GET /api/workspace/summary`
2. `GET /api/opportunities`
3. `GET /api/opportunities/{opportunityId}`
4. `POST /api/workspace/ask`
5. `GET /api/calendar`

이 순서를 쓰는 이유:

- 현재 wireframe과 prototype의 메인 홈이 `기본 리포트`이기 때문입니다.
- report -> detail -> ask -> calendar 흐름을 가장 빨리 검증할 수 있습니다.

## Out of Scope for This Slice

이번 구현 slice에서 고정하지 않는 것:

- final public versioning
- graph/tree/search endpoint
- full document detail flow
- command status endpoint
- ingest trigger 운영 flow
- broad public resource API family

## Relationship to Other Docs

이 문서는 기존 문서를 대체하지 않습니다.
대신 아래 문서에서 현재 구현에 필요한 것만 좁게 고정합니다.

- `docs/api/was-mvp-contract.md`
- `docs/api/opportunity-projection.md`
- `docs/api/workspace-mvp-read-contract.md`
- `docs/product/baseline-report-wireframe.md`

현재 구현을 시작할 때는 이 문서를 먼저 보고,
세부 field rationale이나 장기 방향이 필요할 때만 상위 문서로 돌아가는 것을 권장합니다.
