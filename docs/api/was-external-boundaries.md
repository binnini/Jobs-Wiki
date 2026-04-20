---
status: draft
---

# WAS External Boundaries

## Purpose

이 문서는 Jobs-Wiki WAS가 외부 의존성과 연결될 때 지켜야 할 read path와 command path 경계를 정리합니다.

이 문서는 external system의 구현 방식을 확정하지 않습니다. 대신 WAS가 의존할 최소 semantic contract를 정리합니다.

## Boundary Summary

- read path와 command path는 분리합니다.
- normal read serving은 MCP facade에 직접 의존한다고 가정하지 않습니다.
- MCP는 command-oriented external facade로 취급합니다.
- DB ownership, schema, migration은 이 문서 범위 밖입니다.

## Read Authority

### Definition

read authority는 Jobs-Wiki WAS가 user-visible knowledge state를 조회할 때 authoritative하다고 간주하는 external read-serving dependency입니다.

이 용어는 아래를 의도적으로 피합니다.

- MCP와 동일한 배포 surface라는 가정
- Jobs-Wiki가 DB/storage ownership을 가진다는 가정
- 하나의 저장 엔진 형태를 강제하는 가정

### Read Path Rule

기본 read path는 아래처럼 둡니다.

- frontend -> WAS
- WAS -> read authority

WAS는 read authority 응답을 frontend projection contract로 변환할 수 있습니다.

### Read Authority Minimum Concerns

read authority는 최소한 아래 종류의 read shape를 지원할 수 있어야 합니다.

- tree/navigation read
- document/object detail read
- graph neighborhood read
- calendar/time-based read
- search read
- workspace summary read

단, 이 문서는 read authority가 projection을 직접 materialize하는지, WAS가 일부 조합하는지까지 고정하지 않습니다.

## MCP Command Facade

### Definition

MCP facade는 Jobs-Wiki WAS가 user intent를 external command로 위임할 때 사용하는 command-oriented dependency입니다.

기본 command path는 아래처럼 둡니다.

- frontend -> WAS
- WAS -> MCP facade

### Command Rule

- MCP facade는 normal read-serving surface라고 가정하지 않습니다.
- MCP facade는 command submission과 command status 조회의 안정적 경계를 제공해야 합니다.
- read visibility 상태를 함께 제공할 수는 있지만, authoritative한 경우에만 `applied`를 선언할 수 있습니다.

추가 semantic rule:

- command acceptance와 domain mutation visibility는 별개입니다.
- facade는 retry-safe submission을 위한 idempotency 수단을 제공할 수 있어야 합니다.
- facade는 optimistic concurrency conflict를 explicit하게 반환할 수 있어야 합니다.
- facade는 command 전체 실패와 partial acceptance를 구분할 수 있는 편이 바람직합니다.

### Minimum Fixed Command Family

현재 고정 후보:

- `knowledge.object.upsert`
- `knowledge.object.archive`
- `knowledge.object.restore`
- `knowledge.relation.upsert`
- `knowledge.relation.remove`
- `knowledge.document.update`
- `knowledge.metadata.patch`
- `knowledge.command.get`

현재 기준선에서 별도 canonical command family로 고정하지 않는 항목:

- `tag`
  - 우선 `knowledge.metadata.patch`와 read-side filter/facet 언어로 다룹니다.
- `calendar event`
  - 우선 event-specific command family를 두지 않습니다.
- richer document presentation field
  - 우선 `knowledge.document.update`를 `title`, `bodyMarkdown`, 제한적 summary 중심으로 유지합니다.

현재 제외:

- `knowledge.query.run`

제외 이유:

- read path와 command path를 너무 이르게 섞을 위험이 큽니다.
- artifact generation이나 semantic analysis가 필요하면 이후 명시적 command family로 다시 정의하는 편이 안전합니다.

### Submission and Idempotency

- WAS는 command submission 시 request-level idempotency key를 전달할 수 있어야 합니다.
- 동일한 idempotency key와 동등 intent에 대해서 facade는 duplicate side effect를 피해야 합니다.
- idempotency는 object identity를 대체하지 않으며, retry safety를 위한 transport/application boundary 규칙입니다.
- route 또는 thin client는 `Idempotency-Key` header를 `requestId`로 정규화해 facade submission envelope에 넣을 수 있습니다.

유력 처리 방향:

- first submit
  - 새 `commandId`를 발급하고 `accepted` 또는 동등 상태를 반환
- duplicate retry
  - 기존 `commandId` 재사용 또는 동등 결과 반환
- mismatched duplicate
  - 같은 idempotency key에 다른 payload가 오면 validation/conflict failure 후보

### Concurrency and Conflict

- facade는 `baseVersion` 또는 동등한 precondition token을 처리할 수 있어야 합니다.
- stale base를 전제로 한 update는 명시적 conflict로 반환하는 편이 맞습니다.
- WAS는 facade가 돌려준 conflict를 성공처럼 승격하지 않습니다.

대표 conflict 후보:

- `knowledge.document.update`
  - stale document version
- `knowledge.metadata.patch`
  - stale object version
  - immutable field patch
- `knowledge.relation.upsert`
  - relation endpoint object 부재
  - stale relation version
  - duplicate semantic relation
- `knowledge.object.archive`
  - unsupported lifecycle transition

### Partial Acceptance and Degradation

- facade는 command가 accepted 되었더라도 모든 downstream effect가 동시에 visible하다고 주장하지 않아야 합니다.
- 일부 side effect만 확정 가능하면 projection state를 `partial` 또는 `pending`으로 보고하는 편이 맞습니다.
- facade가 완전한 visibility를 모르면 `unknown` 또는 `stale`로 degrade해야 합니다.

예시:

- document body update는 accepted 되었지만 graph/search recompute는 아직 pending
- metadata patch는 accepted 되었지만 calendar projection visibility는 unknown
- relation remove는 succeeded 했지만 tree visibility는 stale

## Read Visibility and Projection Status

### Core Rule

command execution state와 read visibility state는 별개입니다.

예시:

- command status: `accepted`, `validating`, `queued`, `running`, `succeeded`, `failed`, `cancelled`
- projection state: `applied`, `pending`, `partial`, `unknown`, `stale`

### Authority Rule

- MCP facade는 해당 projection의 read visibility를 authoritative하게 관측할 수 있을 때만 `applied`를 선언할 수 있습니다.
- 그렇지 않으면 `pending`, `partial`, `unknown`, `stale` 중 하나로 degrade해야 합니다.
- WAS는 MCP 내부 구현을 추론해 visibility를 승격하지 않습니다.

### Projection-local Reporting

projection visibility는 global flag보다 projection-local 상태를 우선합니다.

예시 projection family:

- `tree`
- `document`
- `graph`
- `calendar`
- `search`
- `workspace_summary`

현재 MVP read contract 기준선:

- `tree`, `document`, `calendar` read response는 top-level projection payload에 `sync`를 두는 방향이 유력합니다.
- per-item sync state는 기본 required field로 두지 않고, command status의 `projectionStates`와 targeted refresh hint를 우선 사용합니다.

## Refresh Hint Rule

command result는 최소한 아래 수준의 refresh hint를 줄 수 있어야 합니다.

- affected object refs
- affected relation refs
- recommended refresh scopes

유력 refresh scope:

- `tree`
- `document`
- `graph_neighborhood`
- `calendar`
- `search`
- `workspace_summary`

WAS는 MCP 내부 semantics를 추론해서 over-refresh하지 않고, provider가 제공한 refresh hint를 우선 사용합니다.

추가 원칙:

- refresh hint는 projection-local granularity를 가질수록 좋습니다.
- `affected object refs`와 `refresh scopes`는 함께 제공되는 편이 바람직합니다.
- facade가 refresh scope를 모르면 broad `workspace_summary` 또는 object-detail refresh만 권고할 수 있습니다.
- WAS는 hint가 좁게 주어졌을 때 unnecessary full-workspace refresh를 피합니다.

## Minimum Thin Client Envelope

현재 WAS thin client는 아래 command submission/status envelope를 normalization target으로 둡니다.

```ts
type CommandSubmissionEnvelope = {
  requestId?: string;
  command: {
    name: string;
    payload: Record<string, unknown>;
  };
};

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

type CommandStatusResponse = {
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
  }>;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
};
```

원칙:

- thin client는 raw provider payload를 그대로 WAS service에 노출하지 않습니다.
- submit response와 status response는 같은 projection visibility vocabulary를 공유합니다.
- WorkNet trigger 같은 command family-specific route도 내부적으로는 generic submission envelope 위에 올라가는 편이 맞습니다.

## Concurrency and Identity

### Object and Document

- object/document update는 optimistic concurrency token을 받을 수 있어야 합니다.
- WAS는 기존 상태 편집 시 `baseVersion` 또는 동등한 token을 전달할 수 있어야 합니다.
- create-like upsert와 edit-like update는 idempotency와 concurrency semantics를 분리해서 생각하는 편이 맞습니다.
- user-authored document 편집은 특히 stale base conflict가 정상적이라는 전제를 둡니다.

### Relation

- relation create 시 `relationId`는 optional일 수 있습니다.
- relation update/remove 시 `relationId`는 authoritative identity로 required입니다.
- `(relationType, fromId, toId)`는 lookup hint일 수 있으나, authoritative identity는 아닙니다.
- semantic duplicate 방지 규칙은 relation identity와 별도로 존재할 수 있습니다.
- relation create 결과가 기존 relation 재사용인지 새 relation 생성인지는 facade가 분명히 구분하는 편이 바람직합니다.

## Failure Normalization Direction

- WAS는 facade raw error를 그대로 외부 계약으로 노출하지 않습니다.
- 최소한 아래 failure class는 안정적으로 구분하는 편이 맞습니다.

유력 failure class:

- `validation_failed`
- `conflict`
- `not_found`
- `forbidden`
- `temporarily_unavailable`
- `unknown_failure`

원칙:

- `conflict`는 stale base나 lifecycle precondition failure를 포함할 수 있습니다.
- `temporarily_unavailable`는 retryable signal을 가질 수 있습니다.
- `validation_failed`와 `conflict`를 같은 범주로 합치지 않는 편이 frontend UX에 유리합니다.

## Archive Rule

- archive는 logical lifecycle state transition입니다.
- archive는 hard delete가 아니며 ACL mutation도 아닙니다.
- restore/unarchive는 minimum lifecycle candidate에 포함합니다.
- archive applicability는 object-class-specific capability입니다.

## Open Questions

- read authority가 어떤 projection을 직접 materialize하고, 어떤 projection을 WAS가 조합할지
- 장기적으로 `tag` taxonomy object family가 실제로 필요한지
- 장기적으로 user-authored schedule object가 실제로 필요한지
- 제한적 summary 외 document-surface presentational field 확장이 실제로 필요한지
