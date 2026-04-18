---
status: draft
---

# WAS MVP Contract

## Purpose

이 문서는 Jobs-Wiki 웹 서비스의 첫 구현에 사용할 `WAS` 계약을 좁게 고정합니다.

기존 문서들이 `candidate direction`을 넓게 설명했다면,
이 문서는 실제로 `apps/was` 라우터와 adapter를 만들기 위한 첫 buildable slice를 정리하는 것이 목적입니다.

이 문서는 아래를 다룹니다.

- 첫 구현 화면에 필요한 최소 endpoint set
- request / response envelope 방향
- sync / error / ref vocabulary
- `StrataWiki` dependency를 WAS가 어떻게 절단할지

이 문서는 장기 전체 API catalog를 확정하지 않습니다.

## Scope

이번 MVP contract는 아래 화면 흐름을 우선 지원합니다.

- Workspace Home
- Ask Workspace
- Opportunity List
- Opportunity Detail
- Document Detail
- Calendar

이번 문서가 의도적으로 뒤로 미루는 것:

- full tree explorer
- full graph explorer
- broad public resource API
- generic workspace command family 전체

## MVP Decision

현재 기준 첫 구현 slice는 아래처럼 둡니다.

- read-first MVP
- recruiting domain 중심
- WorkNet -> recruiting -> StrataWiki 흐름을 실제 사용자 화면까지 연결

즉, 이번 MVP의 핵심 목적은 아래입니다.

- 사용자가 질문을 던질 수 있다
- answer와 evidence를 읽을 수 있다
- related opportunity를 탐색할 수 있다
- opportunity detail과 document detail을 열 수 있다
- 마감 일정(calendar)을 확인할 수 있다

## Dependency Rule

- frontend는 WAS만 호출합니다.
- WAS는 `StrataWiki`의 raw schema를 그대로 노출하지 않습니다.
- WAS는 read authority와 command facade를 논리적으로 분리합니다.
- MVP에서는 read path를 우선 구현합니다.
- command path는 전체 edit family보다 narrow admin/refresh trigger부터 시작할 수 있습니다.

## Endpoint Set

이번 MVP에서 우선 구현할 endpoint 후보는 아래와 같습니다.

### Read Endpoints

- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/documents/{documentId}`
- `GET /api/calendar`
- `GET /api/workspace/sync`

### Optional Early Command Endpoint

- `POST /api/admin/ingestions/worknet/{sourceId}`

이 endpoint는 일반 사용자 command family가 아니라,
운영/개발 단계에서 source ingest를 수동 트리거하는 좁은 경계로 취급합니다.

## Why This Set

- `POST /api/workspace/ask`
  - 현재 `StrataWiki`의 가장 강한 기능을 가장 직접적으로 드러냅니다.
- `GET /api/opportunities`, `GET /api/opportunities/{opportunityId}`
  - jobs product의 기본 탐색 surface입니다.
- `GET /api/documents/{documentId}`
  - evidence deep-link와 shared detail shell에 필요합니다.
- `GET /api/calendar`
  - recruiting domain의 temporal value를 가장 빨리 보여줍니다.
- `GET /api/workspace/summary`
  - 홈 화면과 refresh anchor로 유용합니다.
- `GET /api/workspace/sync`
  - eventual consistency를 정직하게 드러내는 최소 관측 surface입니다.

## Shared Vocabulary

### Object Ref

```ts
type KnowledgeObjectRef = {
  objectId: string;
  objectKind: string;
  title?: string;
};
```

### Projection Sync State

```ts
type ProjectionName =
  | "workspace_summary"
  | "ask"
  | "opportunity_list"
  | "opportunity_detail"
  | "document"
  | "calendar";

type ProjectionSyncState = {
  projection: ProjectionName;
  visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
  lastKnownVersion?: string;
  lastVisibleAt?: string;
  refreshRecommended?: boolean;
};
```

### Error Shape

```ts
type WasErrorResponse = {
  error: {
    code:
      | "validation_failed"
      | "conflict"
      | "not_found"
      | "forbidden"
      | "temporarily_unavailable"
      | "unknown_failure";
    message: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
  };
};
```

### Response Envelope Rule

MVP에서는 모든 endpoint에 동일한 envelope를 강제하지 않습니다.
대신 아래 원칙을 맞추는 편이 좋습니다.

- top-level payload는 화면 단위 semantic 이름을 가집니다.
- projection freshness는 top-level `sync`로 설명합니다.
- canonical object identity는 full object 대신 `ref`를 우선 사용합니다.
- decoration field는 object field와 분리합니다.

## Endpoint Contracts

### 1. `GET /api/workspace/summary`

역할:

- 첫 화면 진입용 aggregate
- 마지막 질문, 마감 임박 opportunity, 최근 document, sync summary 제공

후보 shape:

```ts
type WorkspaceSummaryResponse = {
  projection: "workspace_summary";
  sync?: ProjectionSyncState;
  blocks: {
    recentAnswers?: Array<{
      answerId: string;
      title: string;
      createdAt: string;
      documentRef?: KnowledgeObjectRef;
    }>;
    closingSoon?: OpportunityListItem[];
    recentDocuments?: Array<{
      documentRef: KnowledgeObjectRef;
      updatedAt?: string;
    }>;
  };
};
```

### 2. `POST /api/workspace/ask`

역할:

- question -> personalized answer -> evidence navigation

request shape:

```ts
type AskWorkspaceRequest = {
  question: string;
  save?: boolean;
};
```

response shape:

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
  relatedDocuments: Array<{
    documentRef: KnowledgeObjectRef;
    role?: "personal" | "interpretation" | "fact";
  }>;
  provenance: {
    factSnapshot: string;
    interpretationSnapshot?: string;
    profileVersion?: string;
    modelProfile?: string;
  };
};
```

### 3. `GET /api/opportunities`

역할:

- recruiting opportunity list
- home, search-like navigation, ask evidence landing에서 공통 사용

query 후보:

- `cursor`
- `limit`
- `status`
- `closingWithinDays`

response shape:

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

- 단일 opportunity 상세
- company / role / evidence / related documents를 포함하는 공통 detail shell

response shape:

```ts
type OpportunityDetailResponse = {
  projection: "opportunity_detail";
  sync?: ProjectionSyncState;
  item: OpportunityDetail;
};
```

### 5. `GET /api/documents/{documentId}`

역할:

- evidence에서 deep-link되는 shared document detail

response shape:

- 기존 `workspace-mvp-read-contract.md`의 `document` projection을 재사용
- 단, MVP에서는 `relations`보다 `surface`, `metadata.source`, `summary`를 우선 구현

### 6. `GET /api/calendar`

역할:

- opportunity closing/opening timeline 노출

query 후보:

- `from`
- `to`

response shape:

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
    objectRef: KnowledgeObjectRef;
    decoration?: {
      urgencyLabel?: string;
      companyName?: string;
    };
  }>;
};
```

### 7. `GET /api/workspace/sync`

역할:

- 화면 전체 sync status 관측
- polling anchor 또는 top-level stale indicator

response shape:

```ts
type WorkspaceSyncResponse = {
  projections: ProjectionSyncState[];
};
```

## StrataWiki Mapping Direction

WAS는 `StrataWiki`를 아래 두 adapter로 바라보는 방향이 가장 자연스럽습니다.

### Read Authority

최소 필요 concern:

- personal query
- fact record detail
- interpretation record detail
- snapshot status
- opportunity list/detail에 필요한 canonical fact read

### Command Facade

MVP 최소 concern:

- optional ingest trigger
- 이후 command status / refresh hint 확장

현재 MVP에서는 full editing command family보다, read integration이 먼저입니다.

## Implementation Order

실제 구현은 아래 순서가 가장 안전합니다.

1. `POST /api/workspace/ask`
2. `GET /api/opportunities/{opportunityId}`
3. `GET /api/opportunities`
4. `GET /api/calendar`
5. `GET /api/workspace/summary`
6. `GET /api/documents/{documentId}`
7. `GET /api/workspace/sync`

이 순서가 좋은 이유:

- ask flow가 StrataWiki value를 가장 직접적으로 보여줌
- opportunity detail이 jobs product의 핵심 detail surface임
- list/calendar/summary는 그 위에 자연스럽게 쌓임

## Out of Scope

이번 MVP contract에서 확정하지 않는 것:

- final public API versioning
- graph endpoint
- tree endpoint
- generic search endpoint
- generic document mutation family
- broad public resource API

## Decision Summary

현재 기준 첫 WAS 구현은 `generic workspace API 전체`가 아니라,
`ask + opportunity + document + calendar + summary + sync`의 좁은 제품 slice로 시작하는 편이 맞습니다.

이렇게 해야:

- 현재 `StrataWiki` 강점과 잘 맞고
- WorkNet recruiting vertical을 실제 사용자 가치로 빨리 연결할 수 있으며
- 이후 tree/graph/search를 더 안정적으로 붙일 수 있습니다.
