---
status: draft
---

# WAS Adapter Contract

## Purpose

이 문서는 `apps/was` 가 현재 runtime 에서 실제로 사용하는 adapter contract 를 정리합니다.

핵심 목적:

- mock / real mode 가 같은 service contract 를 공유하도록 고정
- route / service 가 provider-specific shape 를 직접 모르도록 고정
- current implementation 과 future direction 을 같은 것으로 섞어 쓰지 않도록 정리

이 문서는 "언젠가 필요할 수 있는 full adapter family" 설계문이 아니라,
**지금 코드에 존재하는 adapter family** 기준 문서입니다.

## Current Scope

현재 구현 범위는 아래 네 family 입니다.

1. `ReadAuthorityAdapter`
2. `AskWorkspaceAdapter`
3. `CommandFacadeAdapter`
4. `PersonalDocumentAdapter`

factory 는 존재하지만, 별도 adapter family 로 설명할 대상은 아닙니다.

현재 문서 범위 밖:

- shared/personal wiki tree 전체
- binary asset upload transport 자체
- auth-aware multi-tenant session contract 완성형

이 항목들은 target direction 으로는 가능하지만 현재 route baseline 에는 들어와 있지 않습니다.

## Shared Rules

### 1. Service Depends on Interface Only

- service 는 concrete adapter 구현을 직접 import 하지 않습니다.
- service 는 factory 또는 dependency injection 으로 interface 만 받습니다.

### 2. Raw Provider Shape Must Not Escape

- adapter 는 raw StrataWiki response 또는 raw SQL row 를 route 로 그대로 넘기지 않습니다.
- adapter output 은 WAS 내부 normalized record 여야 합니다.

### 3. Adapter Error Must Be Normalized

- adapter failure 는 WAS internal error shape 로 정규화됩니다.
- route 는 upstream tool name 또는 SQL error shape 를 직접 알지 않아야 합니다.

### 4. Mock and Real Must Share the Same Route Contract

- mock adapter 는 fixture 기반이어도 real adapter 와 같은 route-level shape 를 반환해야 합니다.
- route / mapper / validator 는 data mode 에 따라 분기하지 않아야 합니다.

## Shared Internal Types

### Adapter Failure

```ts
type AdapterFailure = {
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
```

### User Context

현재 MVP 에서는 auth/session contract 가 고정되지 않았으므로 최소 shape 만 둡니다.

```ts
type UserContext = {
  tenantId?: string;
  userId?: string;
  workspaceId?: string;
  profileId?: string;
};
```

### Opportunity Query

```ts
type OpportunityListQuery = {
  cursor?: string;
  limit?: number;
  status?: "open" | "closing_soon" | "closed" | "unknown";
  closingWithinDays?: number;
};
```

### Calendar Query

```ts
type CalendarQuery = {
  from?: string;
  to?: string;
};
```

## 1. ReadAuthorityAdapter

### Responsibility

- workspace summary read
- opportunity list/detail read
- calendar read
- projection sync metadata 제공

현재 real implementation 은 StrataWiki canonical read DB 를 읽습니다.
즉 read adapter 는 HTTP provider wrapper 가 아니라 **read-backed projection adapter** 입니다.

### Interface

```ts
type ReadAuthorityAdapter = {
  getWorkspaceSummary(input?: {
    userContext?: UserContext;
  }): Promise<WorkspaceSummaryRecord>;

  listOpportunities(input?: {
    userContext?: UserContext;
    query?: OpportunityListQuery;
  }): Promise<{
    items: OpportunityRecord[];
    nextCursor?: string;
    sync?: ProjectionSync;
  }>;

  getOpportunityDetail(input: {
    userContext?: UserContext;
    opportunityId: string;
  }): Promise<OpportunityDetailRecord>;

  getCalendar(input?: {
    userContext?: UserContext;
    query?: CalendarQuery;
  }): Promise<{
    items: CalendarRecord[];
    sync?: ProjectionSync;
  }>;
};
```

### Notes

- current code 에는 `getWorkspace` 나 `getSharedDocument` family 가 없습니다.
- summary / opportunity / calendar projection 은 adapter 내부에서 canonical fact/relation state 를 조합합니다.
- direct DB read 는 현재 read authority 의 구현 방식이지, route 가 직접 SQL 을 아는 구조는 아닙니다.
- read authority 는 write path 를 포함하지 않습니다.

## 2. AskWorkspaceAdapter

### Responsibility

- question 과 optional opportunity context 를 받아 answer/evidence/related objects 를 생성
- read-backed baseline answer 를 구성
- 조건이 맞으면 personal-aware answer 로 upgrade

### Interface

```ts
type AskWorkspaceAdapter = {
  askWorkspace(input: {
    userContext?: UserContext;
    question: string;
    opportunityId?: string;
    save?: boolean;
  }): Promise<AskWorkspaceRecord>;
};
```

### Notes

- 현재 ask baseline 은 `ReadAuthorityAdapter` 를 먼저 사용합니다.
- profile context catalog 가 resolve 될 때만 StrataWiki personal path 를 시도합니다.
- personal path 는 success 시 answer 를 upgrade 하고, 실패 시 read-backed source-first answer 로 fallback 합니다.
- 현재 real-mode 구현은 full PKM structure 를 route contract 로 노출하지 않습니다.
- `save` 는 현재도 reserved no-op 로 유지합니다.

### Current Personal-Aware Upgrade Path

현재 code path 에서 실제로 쓰는 StrataWiki surface:

- `PUT /api/v1/profile-contexts/{tenant_id}/{user_id}`
- `POST /api/v1/personal-queries`
- `GET /api/v1/snapshot-status`
- generic `/api/v1/tool-calls`
  - `get_profile_context`
  - `get_personal_record`
  - `get_interpretation_record`
  - `get_fact_record`

중요한 해석:

- personal-aware ask 는 shipped optional upgrade 입니다.
- 하지만 ask 전체를 "이미 PKM-native flow 로 전환 완료" 라고 적으면 과장입니다.
- 현재 사용자에게 보이는 baseline 은 여전히 read-backed answer 입니다.

## 3. CommandFacadeAdapter

### Responsibility

- WorkNet ingestion trigger submit
- command status read
- workspace sync 에 command visibility 를 연결

### Interface

```ts
type CommandFacadeAdapter = {
  submitCommand(input: {
    requestId?: string;
    command: {
      name: string;
      payload: Record<string, unknown>;
    };
  }): Promise<{
    commandId: string;
    status: "accepted";
    acceptedAt: string;
    outcome?:
      | "accepted_only"
      | "partially_applied"
      | "fully_applied"
      | "failed";
    affectedObjectRefs?: string[];
    affectedRelationRefs?: string[];
    refreshScopes?: string[];
    projectionStates?: Array<{
      projection: string;
      visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
    }>;
    error?: {
      code: string;
      message: string;
      retryable?: boolean;
    };
  }>;

  triggerWorknetIngestion?(input: {
    sourceId: string;
    idempotencyKey?: string;
  }): Promise<{
    commandId: string;
    status: "accepted";
    acceptedAt: string;
    outcome?:
      | "accepted_only"
      | "partially_applied"
      | "fully_applied"
      | "failed";
    affectedObjectRefs?: string[];
    affectedRelationRefs?: string[];
    refreshScopes?: string[];
    projectionStates?: Array<{
      projection: string;
      visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
    }>;
    error?: {
      code: string;
      message: string;
      retryable?: boolean;
    };
  }>;

  getCommandStatus(input: {
    commandId: string;
  }): Promise<{
    commandId: string;
    status:
      | "accepted"
      | "validating"
      | "queued"
      | "running"
      | "succeeded"
      | "failed"
      | "cancelled";
    outcome?:
      | "accepted_only"
      | "partially_applied"
      | "fully_applied"
      | "failed";
    acceptedAt?: string;
    finishedAt?: string;
    affectedObjectRefs?: string[];
    affectedRelationRefs?: string[];
    refreshScopes?: string[];
    projectionStates?: Array<{
      projection: string;
      visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
      version?: string;
      visibleAt?: string;
    }>;
    error?: {
      code: string;
      message: string;
      retryable?: boolean;
    };
  }>;
};
```

### Notes

- current MVP read slice에서는 full command family 구현보다 thin client와 normalized envelope를 먼저 고정하는 편이 안전합니다.
- `triggerWorknetIngestion`은 route/service convenience wrapper이고, 실제 adapter 기준선은 `submitCommand` + `getCommandStatus` 조합입니다.
- request-level idempotency는 `requestId` 또는 route-level `Idempotency-Key`에서 시작하고, command payload identity와 혼동하지 않습니다.
- current real implementation 은 HTTP command contract 입니다.
- submit endpoint 는 `POST /api/v1/commands` 입니다.
- status endpoint 는 `GET /api/v1/commands/{command_id}` 입니다.
- `GET /api/workspace/sync` 는 `commandId` 가 없으면 read projections 만 보여주고,
  `commandId` 가 있으면 command facade 도 함께 사용합니다.
- `POST /api/admin/ingestions/worknet/:sourceId` 는 command facade submit entrypoint 입니다.

## 4. PersonalDocumentAdapter

### Responsibility

- personal document list/detail/create/update/delete
- personal asset registration
- raw-to-wiki generation
- wiki link suggestion / attachment

### Interface

```ts
type PersonalDocumentAdapter = {
  listDocuments(input: {
    userContext?: UserContext;
    domain: string;
    subspace?: string;
    kind?: string;
    status?: string;
    limit?: number;
  }): Promise<{ items: PersonalDocumentRecord[] }>;

  getDocument(input: {
    userContext?: UserContext;
    domain: string;
    documentId: string;
  }): Promise<PersonalDocumentRecord>;

  createDocument(input: Record<string, unknown>): Promise<{ document: PersonalDocumentRecord }>;
  updateDocument(input: Record<string, unknown>): Promise<{ document: PersonalDocumentRecord }>;
  deleteDocument(input: Record<string, unknown>): Promise<{ document: PersonalDocumentRecord }>;

  registerAsset(input: Record<string, unknown>): Promise<{ asset: PersonalAssetRecord }>;

  summarizeToWiki(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  rewriteToWiki(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  structureToWiki(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  suggestLinks(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  attachLinks(input: Record<string, unknown>): Promise<Record<string, unknown>>;
};
```

### Notes

- current real implementation uses dedicated StrataWiki HTTP endpoints for this family.
- current baseline is not the generic tool-call bridge for Personal CRUD/generation/link flows.
- shared read / personal write boundary remains unchanged.

## Adapter Factories

현재 factory layer 는 data mode 별 concrete adapter 를 선택합니다.

```ts
type DataMode = "mock" | "real";
```

현재 real mode 의미:

- `ReadAuthorityAdapter`
  - canonical read DB 기반
- `AskWorkspaceAdapter`
  - read-backed baseline + optional personal-aware upgrade
- `CommandFacadeAdapter`
  - HTTP command client
- `PersonalDocumentAdapter`
  - HTTP Personal document / asset / generation / link client

즉 current real mode 는 "read 는 DB projection, write/command 는 HTTP" 구조입니다.

```ts
type CommandAcceptedResponse = {
  commandId: string;
  status: "accepted";
  acceptedAt: string;
  outcome?:
    | "accepted_only"
    | "partially_applied"
    | "fully_applied"
    | "failed";
  affectedObjectRefs?: string[];
  affectedRelationRefs?: string[];
  refreshScopes?: string[];
  projectionStates?: Array<{
    projection: string;
    visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
  }>;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
};
```

## Route Mapping

현재 route 와 adapter 의 대응은 아래가 정확합니다.

- `GET /api/workspace/summary`
  - `ReadAuthorityAdapter.getWorkspaceSummary`
- `POST /api/workspace/ask`
  - `AskWorkspaceAdapter.askWorkspace`
- `GET /api/opportunities`
  - `ReadAuthorityAdapter.listOpportunities`
- `GET /api/opportunities/:opportunityId`
  - `ReadAuthorityAdapter.getOpportunityDetail`
- `GET /api/calendar`
  - `ReadAuthorityAdapter.getCalendar`
- `GET /api/workspace/sync`
  - read projections only
  - optional `commandId` 가 있으면 `CommandFacadeAdapter.getCommandStatus`
- `POST /api/admin/ingestions/worknet/:sourceId`
  - `CommandFacadeAdapter.triggerWorknetIngestion`

## Not Current Runtime

아래 항목은 현재 codebase 의 target direction 또는 prior design artifact 이며,
현재 shipped route contract 로 읽으면 안 됩니다.

- personal wiki graph/backlink surface
- binary asset upload transport 자체
- full PKM object tree 를 전제로 한 frontend contract

이 항목들을 다시 문서화할 수는 있지만,
현재 adapter contract 문서에서는 **future direction** 으로 분리해서 적는 편이 맞습니다.

## Future Direction

향후 확장 방향으로는 아래가 가능합니다.

- personal document adapter 추가
- richer interpretation build / job polling flow 노출
- ask save/history UX 추가

다만 이 문서의 기준선은 현재 runtime 입니다.
target direction 을 current reality 로 기술하지 않는 것이 가장 중요합니다.
