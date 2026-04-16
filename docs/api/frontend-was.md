---
status: draft
---

# Frontend to WAS API

## Purpose

frontend가 WAS와 통신할 때 사용하는 draft workspace contract를 정리합니다.

## Conventions

- base path
- auth
- pagination
- error shape

현재 단계의 계약은 final endpoint contract가 아니라, 화면 요구사항과 external boundary를 검증하기 위한 candidate API 수준으로 취급합니다.

## Candidate Read Model

frontend-facing read model은 아래 projection family를 기본 단위로 둡니다.

- `tree`
  - 파일 탐색 또는 navigation sidebar를 위한 projection
- `document`
  - 문서 본문, document-surface field, selected metadata, relation decoration을 위한 projection
- `graph`
  - object/relation neighborhood를 시각화하기 위한 projection
- `calendar`
  - 시간 의미를 가진 object/relation을 보여주기 위한 projection
- `search`
  - 탐색 결과와 ranking surface를 위한 projection
- `workspace_summary`
  - count, highlight, sync 요약을 위한 projection

projection은 canonical object와 동일하지 않을 수 있으며, command execution보다 늦게 갱신될 수 있습니다.

## Candidate Read Endpoints

- `GET /workspace/tree`
  - `tree` projection을 조회합니다.
- `GET /workspace/documents/{id}`
  - `document` projection을 조회합니다.
- `GET /workspace/calendar`
  - `calendar` projection을 조회합니다.
- `GET /workspace/graph`
  - `graph` projection을 조회합니다.
- `GET /workspace/search`
  - `search` projection을 조회합니다.
- `GET /workspace/summary`
  - `workspace_summary` projection을 조회합니다.
- `GET /workspace/personal-knowledge/query`
  - `present_query_personal_knowledge` envelope를 조회합니다.
  - personal context retrieval과 optional canonical evidence를 묶은 read endpoint 후보입니다.
- `POST /workspace/personal-knowledge/regenerations`
  - `persisted` Personal family regeneration을 위한 더 좁은 candidate endpoint입니다.

현재 draft 방향:

- `personal-knowledge/query`는 `search` projection과 동일한 것이 아닙니다.
- 이 endpoint는 query outcome summary와 generated Personal page summary를 돌려주는 read assembly surface입니다.
- command path처럼 acceptance/status를 노출하지 않습니다.
- GET 기준으로는 `ephemeral` generation만 허용하는 편이 맞습니다.
- `persisted` regeneration은 GET이 아니라 별도 POST candidate surface에 두는 편이 맞습니다.
- raw retrieval/bundle debug는 public query parameter로 열지 않습니다.
- frontend는 현재 단계에서 POST regeneration surface를 쓸 수 있는 기본 consumer로 봅니다.
- 다만 이 endpoint를 broad external consumer 기본 surface로 바로 확대하지는 않습니다.
- frontend 밖 consumer에 이 endpoint를 열려면 auth separation, narrow capability, quota control이 먼저 있어야 합니다.

## Candidate Command Endpoints

- `POST /workspace/commands`
  - 문서 수정, metadata patch, relation 갱신 같은 사용자 요청을 WAS에 전달합니다.
  - WAS는 이 요청을 external MCP facade로 위임합니다.
- `GET /workspace/commands/{id}`
  - 위임 요청의 command status와 projection visibility 상태를 조회합니다.

현재 minimum command family 후보:

- `knowledge.object.upsert`
- `knowledge.object.archive`
- `knowledge.object.restore`
- `knowledge.relation.upsert`
- `knowledge.relation.remove`
- `knowledge.document.update`
- `knowledge.metadata.patch`

## Command Semantics

### Submission Rule

- frontend는 command를 synchronous save completion으로 가정하지 않습니다.
- `POST /workspace/commands`의 1차 목적은 mutation 완료가 아니라 command acceptance를 받는 것입니다.
- accepted response 이후 사용자에게 보이는 최신 상태는 `GET /workspace/commands/{id}` 또는 projection refresh를 통해 확인합니다.

### Idempotency Direction

- command submission에는 idempotency key를 둘 수 있어야 합니다.
- 네트워크 재시도나 UI 중복 제출 상황에서 같은 intent가 중복 실행되지 않도록 하는 것이 목적입니다.
- idempotency key는 command payload 전체를 정의하는 영구 identity가 아니라, 동일한 submit attempt family를 식별하는 request-level key에 가깝습니다.

유력 candidate shape:

```ts
type WorkspaceCommandEnvelope = {
  requestId?: string;
  command: WorkspaceCommandRequest;
};
```

설명:

- `requestId`는 transport-level retry safety를 위한 candidate field입니다.
- 같은 `requestId`로 동일 intent를 다시 보내면 기존 command result 또는 동등 상태를 돌려주는 방향이 유력합니다.

### Concurrency Rule

- 기존 상태를 전제로 한 수정은 `baseVersion` 또는 동등한 concurrency token을 보내는 방향이 맞습니다.
- frontend는 stale editor state로 update를 시도할 수 있으므로 conflict를 정상 흐름으로 다뤄야 합니다.
- conflict는 transport error가 아니라 user-visible resolution flow의 일부가 될 수 있습니다.

유력 처리 방향:

- `knowledge.document.update`
  - `baseVersion` mismatch 시 conflict 응답 후보
- `knowledge.metadata.patch`
  - object-level version mismatch 또는 immutable field 수정 시 conflict/validation failure 후보
- `knowledge.relation.upsert`
  - duplicate semantic relation, missing endpoint object, stale relation version 상황을 구분할 수 있어야 합니다.

### Partial Acceptance Rule

- command submission은 전체 성공/실패만 있는 것으로 가정하지 않습니다.
- command가 일부 sub-operation만 수용하거나, command 자체는 `accepted` 되었지만 projection visibility는 부분적으로만 따라올 수 있습니다.
- frontend는 `command accepted + projection partial`을 정상 상태로 다룰 수 있어야 합니다.

예시:

- 문서 본문 수정은 수용됐지만 graph relation 재계산은 아직 `pending`
- metadata patch는 수용됐지만 search index 반영은 아직 `stale`
- relation upsert는 accepted 되었지만 calendar projection에는 영향이 없거나 아직 미반영

### Refresh Hint Consumption Rule

- frontend는 command status payload의 refresh hint를 우선 사용합니다.
- refresh는 global reload보다 affected projection 중심 targeted refresh를 우선합니다.
- refresh hint가 부족하면 최소한 affected object detail과 workspace summary부터 갱신하는 방향이 유력합니다.

## Sync and Visibility Rule

- command success와 read projection 반영 완료는 같은 의미가 아닙니다.
- frontend는 projection-local 상태를 전제로 동작해야 합니다.
- minimum projection state 후보:
  - `applied`
  - `pending`
  - `partial`
  - `unknown`
  - `stale`

기본 동작 원칙:

- `applied`
  - 해당 projection을 refresh합니다.
- `pending`
  - last-known data를 유지하고 syncing 상태를 표시합니다.
- `partial`
  - applied projection만 refresh하고 나머지는 stale/syncing으로 둡니다.
- `unknown`
  - freshness를 주장하지 않고 last-known data를 유지합니다.
- `stale`
  - 표시 가능한 last-known data를 유지하되 stale 상태를 노출합니다.

유력 표현 shape:

```ts
type ProjectionName =
  | "tree"
  | "document"
  | "graph"
  | "calendar"
  | "search"
  | "workspace_summary";

type ProjectionSyncState = {
  projection: ProjectionName;
  visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
  lastKnownVersion?: string;
  lastVisibleAt?: string;
  refreshRecommended?: boolean;
};
```

현재 draft 방향:

- sync state는 global boolean보다 projection-local array 또는 map으로 표현하는 편이 맞습니다.
- command status payload와 read response payload는 같은 sync vocabulary를 공유할 수 있습니다.
- `applied`는 WAS 추론이 아니라 external authority 확인이 있을 때만 사용합니다.

## Field Ownership Rule

- `knowledge.document.update`
  - title
  - body markdown
  - 제한적인 document-surface presentational field
- `knowledge.metadata.patch`
  - tags
  - status
  - dueAt
  - source metadata
  - structured user annotations

frontmatter-like field는 문서 안에 적혀 있다는 이유만으로 document update로 고정하지 않습니다. field 의미에 따라 document surface 또는 structured metadata로 나눕니다.

현재 draft 방향:

- `tag`는 우선 metadata/search/filter 성격으로 다룹니다.
- `calendar`는 canonical scheduled object를 전제하지 않고 temporal projection으로 설명합니다.
- document projection은 우선 `title`, `body markdown`, selected metadata, relation decoration 중심으로 유지합니다.

유력 최소 command shape:

```ts
type WorkspaceCommandRequest =
  | {
      commandType: "knowledge.document.update";
      documentId: string;
      baseVersion?: string;
      patch: {
        title?: string;
        bodyMarkdown?: string;
        summaryText?: string;
      };
    }
  | {
      commandType: "knowledge.metadata.patch";
      objectId: string;
      baseVersion?: string;
      patch: {
        tags?: string[];
        status?: string;
        dueAt?: string | null;
      };
    };
```

## Response Concerns

- `tree`, `document`, `calendar`는 current MVP read contract 우선 slice입니다.
- 문서 응답은 markdown 본문과 selected metadata를 함께 담을 수 있어야 합니다.
- graph 응답은 node/edge wrapper가 canonical object/relation ref를 가리킬 수 있어야 합니다.
- graph/document detail에서는 relation provenance를 노출할 수 있어야 합니다.
- calendar 응답은 날짜 범위와 관련 object ref를 포함할 수 있어야 합니다.
- command 응답은 비동기 위임과 eventual consistency를 우선 전제로 고려합니다.

### Shared Response Vocabulary

현재 MVP slice에서 우선 맞추려는 공통 원칙:

- projection response는 top-level `projection`과 `items` 또는 `surface` anchor를 가집니다.
- projection-local sync state는 top-level `sync`에 둡니다.
- projection-local version은 top-level `version`에 둘 수 있지만 모든 endpoint에서 required로 강제하지는 않습니다.
- canonical object identity가 필요한 위치에는 full object payload 대신 object ref를 우선 사용합니다.
- relation identity가 필요한 위치에는 relation ref를 optional하게 사용합니다.
- projection decoration은 object field나 metadata field와 분리된 별도 bucket에 둡니다.

유력 최소 shared shape:

```ts
type KnowledgeObjectRef = {
  objectId: string;
  objectKind: string;
  title?: string;
};

type KnowledgeRelationRef = {
  relationId: string;
  relationType?: string;
};
```

### Tree Projection

역할:

- workspace navigation과 file-explorer style traversal을 위한 projection입니다.
- canonical folder object를 전제하지 않고도 container node를 표현할 수 있어야 합니다.
- navigation concern을 담되 canonical storage shape나 folder lifecycle을 고정하지 않아야 합니다.

유력 최소 response shape:

```ts
type TreeProjectionResponse = {
  projection: "tree";
  version?: string;
  sync?: ProjectionSyncState;
  nodes: TreeProjectionNode[];
};

type TreeProjectionNode = {
  nodeId: string;
  nodeType: "object" | "folder";
  label: string;
  objectRef?: KnowledgeObjectRef;
  metadata?: {
    status?: string;
    tags?: string[];
  };
  decoration?: {
    parentNodeId?: string;
    path?: string[];
    depth?: number;
    order?: number;
    hasChildren?: boolean;
    childCount?: number;
  };
};
```

field ownership direction:

- required candidate
  - `nodeId`
  - `nodeType`
  - `label`
- object field
  - `objectRef`
  - object node에서는 required 후보
  - folder/container node에서는 absent 가능
- metadata field
  - `metadata.status`
  - `metadata.tags`
  - navigation badge/filter hint 수준으로만 좁게 유지
- projection decoration
  - `parentNodeId`
  - `path`
  - `depth`
  - `order`
  - `hasChildren`
  - `childCount`

sync visibility concern:

- `tree` sync state는 response top-level `sync`에 둡니다.
- node별 sync state는 MVP 기준으로 기본 포함 대상이 아닙니다.
- command status가 `tree`를 `pending` 또는 `stale`로 보고하면 frontend는 last-known tree를 유지하는 편이 맞습니다.

object ref / relation ref usage:

- tree node의 canonical anchor는 relation ref보다 object ref를 우선합니다.
- containment relation identity는 tree 기본 response에서 required가 아닙니다.
- tree reordering이나 explicit containment edit flow가 생기기 전까지 relation ref는 optional 확장으로 남깁니다.

projection-specific concern:

- tree의 `folder`는 현재 projection-only container 후보입니다.
- `label`은 navigation label이며 canonical object title과 항상 같다고 가정하지 않습니다.
- tree는 document detail 수준의 metadata richness를 가져오지 않는 lightweight payload가 유력합니다.

### Document Projection

역할:

- 특정 authored document의 읽기 surface를 제공하는 projection입니다.
- canonical document object와 selected metadata, relation decoration을 함께 보여줄 수 있어야 합니다.
- authored surface와 structured metadata ownership을 같은 payload 안에서도 분리해 설명해야 합니다.

유력 최소 response shape:

```ts
type DocumentProjectionResponse = {
  projection: "document";
  documentId: string;
  version?: string;
  sync?: ProjectionSyncState;
  documentRef: KnowledgeObjectRef;
  surface: {
    title: string;
    bodyMarkdown: string;
    summary?: {
      text: string;
      kind: "plain_text" | "markdown_excerpt";
    };
  };
  metadata?: {
    tags?: string[];
    status?: string;
    dueAt?: string | null;
    source?: {
      provider?: string;
      sourceId?: string;
      fetchedAt?: string;
    };
  };
  relations?: Array<{
    targetObjectRef: KnowledgeObjectRef;
    relationRef?: KnowledgeRelationRef;
    provenance?: {
      provenanceClass: "explicit_command" | "derived_from_document";
      sourceVersion?: string;
    };
    decoration?: {
      role?: string;
      excerpt?: string;
    };
  }>;
};
```

field ownership direction:

- required candidate
  - `projection`
  - `documentId`
  - `documentRef`
  - `surface.title`
  - `surface.bodyMarkdown`
- optional candidate
  - `version`
  - `sync`
  - `surface.summary`
  - `metadata`
  - `relations`
- object field / document-surface field
  - `surface.title`
  - `surface.bodyMarkdown`
  - `surface.summary`
- metadata field
  - `metadata.tags`
  - `metadata.status`
  - `metadata.dueAt`
  - `metadata.source`
- projection decoration
  - `relations[].decoration.role`
  - `relations[].decoration.excerpt`
  - relation preview badge, excerpt, display grouping 같은 document-only helper

sync visibility concern:

- document visibility는 response top-level `sync`로 표현하는 것이 현재 기준선입니다.
- `knowledge.document.update` acceptance 이후에도 document projection이 `pending` 또는 `stale`일 수 있습니다.
- relation recompute가 늦을 수 있으므로 document body visibility와 relation decoration freshness는 항상 동시에 보장되지 않을 수 있습니다.

object ref / relation ref usage:

- `documentRef`는 document object identity anchor입니다.
- `relations[].targetObjectRef`는 document가 가리키는 다른 canonical object를 설명합니다.
- `relations[].relationRef`는 explicit relation identity가 있을 때만 포함하면 됩니다.
- body-derived relation preview는 relation ref 없이도 표시할 수 있어야 합니다.

projection-specific concern:

- document projection은 canonical resource detail이 아니라 workspace reading surface입니다.
- frontmatter-like syntax는 ownership 판정 기준이 아닙니다.
- `tags`, `status`, `dueAt`를 body surface와 섞어 document command contract를 넓히지 않는 편이 맞습니다.

### Calendar Projection

역할:

- 시간 의미를 가진 object field 또는 temporal relation을 일정형 read surface로 보여주는 projection입니다.
- calendar event를 canonical object로 고정하지 않고도 timeline view를 제공할 수 있어야 합니다.
- source object deep-link와 temporal semantics 설명이 event detail richness보다 우선합니다.

유력 최소 response shape:

```ts
type CalendarProjectionItem = {
  itemId: string;
  sourceObjectRef: KnowledgeObjectRef;
  startsAt?: string;
  endsAt?: string;
  allDay?: boolean;
  relationRef?: KnowledgeRelationRef;
  metadata?: {
    status?: string;
    tags?: string[];
  };
  decoration?: {
    timeLabel?: string;
    dayBucket?: string;
    urgencyLabel?: string;
  };
  temporalSource:
    | { kind: "object_field"; field: string }
    | { kind: "relation"; relationType: string };
};

type CalendarProjectionResponse = {
  projection: "calendar";
  range: {
    from: string;
    to: string;
  };
  version?: string;
  sync?: ProjectionSyncState;
  items: CalendarProjectionItem[];
};
```

field ownership direction:

- required candidate
  - `projection`
  - `items`
  - `itemId`
  - `sourceObjectRef`
  - `temporalSource`
  - `range.from`
  - `range.to`
- optional candidate
  - `startsAt`
  - `endsAt`
  - `allDay`
  - `relationRef`
  - `metadata`
  - `decoration`
  - `version`
  - `sync`
- object field / metadata field
  - 시간 자체는 source object field 또는 relation에서 파생될 수 있습니다.
  - `startsAt` 또는 `endsAt` 중 하나 이상은 item별로 제공되는 편이 유력합니다.
  - `metadata.status`
  - `metadata.tags`
- projection decoration
  - `decoration.timeLabel`
  - `decoration.dayBucket`
  - `decoration.urgencyLabel`

sync visibility concern:

- calendar freshness는 response top-level `sync`에서 우선 표현합니다.
- item별 sync state는 MVP 기본 shape에 넣지 않는 편이 맞습니다.
- metadata patch가 accepted 되어도 calendar projection visibility는 `unknown` 또는 `stale`로 남을 수 있습니다.

object ref / relation ref usage:

- 모든 calendar item은 source object ref를 가져야 하는 방향이 유력합니다.
- temporal meaning이 object field에서 오면 `relationRef`는 불필요합니다.
- temporal meaning이 canonical relation에서 오면 `relationRef`를 함께 줄 수 있습니다.
- item 자체의 `itemId`는 projection item identity일 뿐 canonical event identity를 뜻하지 않습니다.

projection-specific concern:

- calendar item은 source object deep-link를 우선합니다.
- calendar item detail을 별도 canonical resource처럼 설명하지 않습니다.
- deadline, session period, due date가 모두 같은 shape에 억지로 정규화되기보다 `temporalSource`와 decoration을 통해 설명되는 편이 안전합니다.

### Command Status Response

유력 최소 response shape:

```ts

type WorkspaceCommandStatusResponse = {
  commandId: string;
  commandStatus:
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
  affectedObjectRefs?: string[];
  affectedRelationRefs?: string[];
  refreshScopes?: string[];
  projectionStates?: ProjectionSyncState[];
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
};
```

projection별 concern:

- `tree`
  - projection-only folder/container를 허용하되 canonical folder object를 성급히 고정하지 않는 편이 맞습니다.
- `document`
  - authored surface와 structured metadata를 함께 주되 ownership rule은 분리해야 합니다.
- `graph`
  - node/edge wrapper와 relation provenance, neighborhood 범위 제어가 중요합니다.
- `calendar`
  - event canonicalization보다 temporal source 설명과 source object deep-link가 중요합니다.
- `search`
  - hit type, ranking hint, matched surface 구분이 중요합니다.
- `workspace_summary`
  - aggregate count와 stale/sync 상태를 과도한 세부 없이 압축해 보여줘야 합니다.

command response concern:

- acceptance와 visibility를 분리해서 보여줘야 합니다.
- conflict, validation failure, temporary failure를 서로 다른 사용자 흐름으로 해석할 수 있어야 합니다.
- `projectionStates`와 `refreshScopes`가 함께 있을 때는 projection-local status를 더 우선합니다.
- `failed`여도 last-known read model은 유지될 수 있으므로 즉시 optimistic rollback을 강제하지 않습니다.
