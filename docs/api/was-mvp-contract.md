---
status: draft
---

# WAS MVP Contract

## Purpose

이 문서는 Jobs-Wiki 웹 서비스의 첫 구현에 사용할 `WAS` 계약을
workspace-first MVP 기준으로 좁게 고정합니다.

목표는 아래 두 가지를 동시에 만족하는 것입니다.

- PKM knowledge workspace를 메인 UX로 삼는다
- 현재 이미 구현된 recruiting vertical slice를 버리지 않는다

## Scope

이번 MVP contract는 아래 화면 흐름을 우선 지원합니다.

- Workspace Home
- Ask Workspace
- Opportunity List
- Opportunity Detail
- Document Detail
- Calendar

이번 문서가 의도적으로 뒤로 미루는 것:

- full graph explorer
- broad public resource API
- generic workspace command family 전체

## MVP Decision

현재 기준 첫 구현 slice는 아래처럼 둡니다.

- read-first MVP
- workspace-first product goal
- recruiting domain 중심 vertical
- WorkNet -> recruiting -> StrataWiki 흐름을 workspace 안의 object/projection으로 연결

즉, 이번 MVP의 핵심 목적은 아래입니다.

- 사용자가 workspace shell에 진입할 수 있다
- answer와 evidence를 workspace context 안에서 읽을 수 있다
- related opportunity와 related document를 탐색할 수 있다
- opportunity detail과 document detail을 열 수 있다
- 마감 일정(calendar)을 workspace projection으로 확인할 수 있다
- personal layer에서 문서를 생성, 수정, 삭제할 수 있다
- raw 문서를 LLM으로 재가공해 personal wiki를 만들 수 있다

## Dependency Rule

- frontend는 WAS만 호출합니다.
- WAS는 `StrataWiki`의 raw schema를 그대로 노출하지 않습니다.
- WAS는 read authority와 command facade를 논리적으로 분리합니다.
- MVP에서는 read path를 우선 구현합니다.
- command path는 전체 edit family보다 narrow admin/refresh trigger부터 시작할 수 있습니다.

## Endpoint Set

### Read Endpoints

- `GET /api/workspace`
- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/documents/{documentId}`
- `GET /api/calendar`
- `GET /api/workspace/sync`

### Personal Authoring Endpoints

- `POST /api/documents`
- `PATCH /api/documents/{documentId}`
- `DELETE /api/documents/{documentId}`
- `POST /api/assets`
- `POST /api/documents/{documentId}/summarize`
- `POST /api/documents/{documentId}/rewrite`
- `POST /api/documents/{documentId}/structure`
- `POST /api/documents/{documentId}/suggest-links`
- `POST /api/documents/{documentId}/attach-links`

### Optional Early Command Endpoint

- `POST /api/admin/ingestions/worknet/{sourceId}`

## Shared Vocabulary

### Object Ref

```ts
type KnowledgeObjectRef = {
  objectId: string;
  objectKind: string;
  title?: string;
};
```

현재 규칙:

- `workspace`는 최소한 `shared`, `personal/raw`, `personal/wiki`를 구분할 수 있어야 합니다.
- `shared`는 read-only입니다.
- `personal`만 writable입니다.
- WAS는 shared read와 personal write를 서로 다른 upstream responsibility로 다루는 편이 맞습니다.

### Projection Sync State

```ts
type ProjectionName =
  | "workspace"
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

현재 규칙:

- answer나 rewrite는 shared를 참고할 수 있지만, 결과 저장은 personal layer에만 허용됩니다.
- personal 작업은 상위 Fact/Interpretation layer로 역전파되지 않습니다.

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

## Endpoint Contracts

### 1. `GET /api/workspace`

역할:

- workspace shell first load
- 주요 navigation / active context 제공

```ts
type WorkspaceShellResponse = {
  projection: "workspace";
  sync?: ProjectionSyncState;
  navigation: {
    sections: Array<{
      sectionId: string;
      label: string;
      items: KnowledgeObjectRef[];
      tree?: Array<{
        nodeId: string;
        label: string;
        nodeType: "folder" | "object";
        objectRef?: KnowledgeObjectRef;
        workspacePath?: string;
        children?: unknown[];
      }>;
    }>;
  };
  activeProjection?: {
    projection: "report" | "document" | "opportunity" | "calendar" | "ask";
    objectRef?: KnowledgeObjectRef;
  };
};
```

### 2. `GET /api/workspace/summary`

역할:

- report projection aggregate

```ts
type WorkspaceSummaryResponse = {
  projection: "workspace_summary";
  sync?: ProjectionSyncState;
  blocks: {
    report?: {
      profileSnapshot?: Record<string, unknown>;
      recommendedOpportunities?: OpportunityListItem[];
      actionQueue?: Array<Record<string, unknown>>;
      marketBrief?: Record<string, unknown>;
      skillsGap?: Record<string, unknown>;
    };
  };
};
```

### 3. `POST /api/workspace/ask`

역할:

- question -> personalized answer -> evidence navigation

```ts
type AskWorkspaceRequest = {
  question: string;
  documentId?: string;
  opportunityId?: string;
  save?: boolean;
};

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
  relatedOpportunities?: OpportunityListItem[];
  provenance: {
    factSnapshot?: string;
    interpretationSnapshot?: string;
    profileVersion?: string;
    modelProfile?: string;
  };
};
```

### 4. `GET /api/opportunities`

역할:

- recruiting opportunity list
- workspace navigation과 ask evidence landing에서 공통 사용

```ts
type OpportunityListResponse = {
  projection: "opportunity_list";
  sync?: ProjectionSyncState;
  items: OpportunityListItem[];
  nextCursor?: string;
};
```

### 5. `GET /api/opportunities/{opportunityId}`

역할:

- 단일 opportunity 상세

```ts
type OpportunityDetailResponse = {
  projection: "opportunity_detail";
  sync?: ProjectionSyncState;
  item: OpportunityDetail;
};
```

### 6. `GET /api/documents/{documentId}`

역할:

- evidence에서 deep-link되는 shared or personal document detail

현재 방향:

- `document` projection을 재사용
- MVP에서는 relation full graph보다 `surface`, `summary`, `relatedObjects`를 우선 구현
- shared 문서는 read-only
- personal 문서는 writable
- shared document read는 StrataWiki shared rendered-page read를 감싼 결과로 이해합니다.
- personal document read/write는 StrataWiki personal document resource를 감싼 결과로 이해합니다.

### 6.5 `POST /api/documents`

- personal/raw 또는 personal/wiki 문서 생성
- markdown create 진입점
- PDF는 first-wave에서 `POST /api/assets`로 asset registration 후 document에 연결하는 편이 맞습니다.

### 6.6 `PATCH /api/documents/{documentId}`

- personal 문서 수정
- shared 문서는 수정 불가

### 6.7 `DELETE /api/documents/{documentId}`

- personal 문서 삭제
- shared 문서는 삭제 불가

### 6.75 `POST /api/assets`

- user-scoped binary asset 등록
- first-wave에서는 PDF upload transport 자체보다 asset registration을 우선합니다.
- 성공 시 `assetId`를 반환하고 이후 `POST /api/documents` 또는 `PATCH /api/documents/{documentId}`에서 연결합니다.

### 6.8 `POST /api/documents/{documentId}/summarize`

- personal/raw를 personal/wiki 요약 문서로 생성

### 6.9 `POST /api/documents/{documentId}/rewrite`

- 문서를 재작성해 personal/wiki artifact 생성

### 6.10 `POST /api/documents/{documentId}/link`

- 문서 관계, related object, link suggestion 생성 또는 부착

공통 규칙:

- 결과는 항상 personal layer에 기록
- shared와 상위 layer는 직접 수정하지 않음
- shared를 바탕으로 생성한 결과도 저장 target은 personal 뿐입니다.

### 7. `GET /api/calendar`

역할:

- opportunity closing/opening timeline 노출

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

### 8. `GET /api/workspace/sync`

역할:

- 화면 전체 sync status 관측
- polling anchor 또는 top-level stale indicator

```ts
type WorkspaceSyncResponse = {
  projections: ProjectionSyncState[];
  command?: {
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
    error?: {
      code: string;
      message: string;
      retryable?: boolean;
    };
  };
};
```

메모:

- `commandId` query가 있으면 WAS는 command status와 projection visibility를 함께 반환할 수 있습니다.
- `projectionStates`가 있으면 그 상태를 우선 사용하고, 없으면 `refreshScopes`를 fallback scope로 사용합니다.
- command failure는 top-level HTTP error로만 승격하지 않고, poll 대상 command 자체의 normalized error shape로 반환할 수 있습니다.

## StrataWiki Mapping Direction

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
- personal asset binary upload transport는 first-wave에서 WAS concern일 수 있으나,
  등록 이후의 authority는 StrataWiki personal asset/document contract를 따릅니다.

## Implementation Order

현재 구현 자산을 최대한 살리려면 아래 순서가 안전합니다.

1. `GET /api/workspace/summary`
2. `POST /api/workspace/ask`
3. `GET /api/opportunities/{opportunityId}`
4. `GET /api/opportunities`
5. `GET /api/calendar`
6. `GET /api/workspace`
7. `GET /api/documents/{documentId}`
8. `GET /api/workspace/sync`
9. `POST /api/documents`
10. `PATCH /api/documents/{documentId}`
11. `DELETE /api/documents/{documentId}`
12. `POST /api/documents/{documentId}/summarize`
13. `POST /api/documents/{documentId}/rewrite`
14. `POST /api/documents/{documentId}/link`

이 순서가 좋은 이유:

- 현재 구현 자산은 summary/opportunity/ask/calendar에 이미 집중되어 있습니다.
- workspace shell과 generic document detail은 그 자산을 감싸는 다음 단계로 올리는 편이 안전합니다.
- personal authoring과 wiki generation은 그 다음에 붙는 새로운 MVP 기능입니다.

## Out of Scope

- final public API versioning
- graph endpoint
- tree endpoint
- generic search endpoint
- generic document mutation family
- broad public resource API

## Decision Summary

현재 기준 첫 WAS 구현은 `workspace-first 목표`를 유지하되,
실제 구현은 `summary + ask + opportunity + calendar + sync` 슬라이스에서 시작하고
그 위에 `workspace`와 `document detail`을 덧붙이는 편이 맞습니다.
