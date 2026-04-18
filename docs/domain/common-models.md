---
status: draft
---

# Common Models

## Status

Draft

이 문서는 Jobs-Wiki의 workspace 읽기 모델과 external boundary 설계에서 반복되는 공통 개념을 정리합니다.

현재 모델은 candidate 단계이며, canonical storage 구현이나 DB schema를 고정하지 않습니다.

## Purpose

- 파일 탐색, 문서 보기, 그래프, 캘린더, 검색을 하나의 공통 모델 위에서 설명합니다.
- frontend-facing read projection과 external command boundary가 공유해야 하는 최소 개념을 정리합니다.
- knowledge backend, MCP, ingestion의 구현 세부를 common model에 직접 새기지 않습니다.

## Core Concepts

### Knowledge Object

사용자 지식 공간에서 stable identity를 가지며 직접 조회 또는 lifecycle 대상이 될 수 있는 단위입니다.

candidate object kind:

- `document`
- `recruitment`
- `company`
- `training`
- `skill`
- `strategy_note`
- `activity`

원칙:

- canonical object는 stable identifier를 가집니다.
- canonical object는 metadata, source, lifecycle, sync 상태를 가질 수 있습니다.
- canonical object는 projection과 구분됩니다.

현재 workspace 기준선에서 자주 등장하는 object family:

- `document`
  - 사용자 authored knowledge surface의 기본 단위입니다.
  - tree/document/search/graph projection의 중심 anchor가 됩니다.
- `recruitment`
  - 채용 공고 또는 채용 기회 단위입니다.
  - calendar, graph, search에서 반복적으로 보이는 source-backed object 후보입니다.
- `company`
  - 채용 주체 또는 기업 profile 단위입니다.
  - [companies.md](./companies.md)와 연결됩니다.
- `training`
  - 훈련 과정 또는 훈련 기회 단위입니다.
  - [training.md](./training.md)와 연결됩니다.
- `job`
  - 직업/직무 설명 단위입니다.
  - [jobs.md](./jobs.md)와 연결됩니다.
- `department`
  - 전공/학과 설명 단위입니다.
  - [departments.md](./departments.md)와 연결됩니다.
- `activity`
  - 사용자 준비 활동, 지원 기록, 체크포인트 같은 user-scoped object 후보입니다.
  - 현재는 최소 candidate로만 두며 세부 모델은 아직 draft입니다.
- `strategy_note`
  - 사용자의 계획, 회고, 비교 메모 같은 user-authored note 계열 후보입니다.
  - 현재는 `document`와 분리할지 통합할지 아직 draft입니다.
- `skill`
  - 역량/기술/준비 항목을 표현하는 candidate object kind입니다.
  - 현재는 graph/search/calendar decoration 수요를 위한 최소 후보이며 독립 public resource로 고정하지 않습니다.

현재 고정 가능한 원칙:

- `document`, `recruitment`, `company`, `training`은 workspace projection에서 반복 등장하는 핵심 object family 후보입니다.
- `job`, `department`는 domain 설명과 탐색 연결에 중요하지만, workspace MVP에서 항상 1급 authored object일 필요는 없습니다.
- `activity`, `strategy_note`, `skill`은 user-scoped workspace richness를 설명하는 후보군이지만, storage shape나 separate API family는 아직 고정하지 않습니다.

### Object Family Responsibilities

workspace 관점의 최소 책임:

- `document`
  - authored body와 selected metadata를 담는 기본 surface
  - relation provenance가 가장 잘 드러나는 object
- `recruitment`
  - 마감일, 회사, 직무, 준비 문서와 연결되는 action-oriented object
- `company`
  - recruitment와 묶여 읽히는 contextual object
- `training`
  - 기간, 제공기관, 취업 준비 action과 연결되는 temporal/source-backed object
- `job`
  - recruitment나 training을 해석할 때 쓰이는 reference object
- `department`
  - 진로 맥락과 연결되는 reference object
- `activity`
  - 사용자의 진행 상태와 calendar/workspace summary에 기여하는 object 후보
- `strategy_note`
  - 사용자의 해석과 계획을 남기는 authored object 후보
- `skill`
  - graph와 search에서 연결 설명에 쓰이는 semantic anchor 후보

### Relation

knowledge object 사이의 canonical 연결입니다.

예시 relation type:

- `contains`
- `references`
- `related_to`
- `requires`
- `scheduled_for`
- `derived_from`

원칙:

- relation은 update/remove 시 authoritative identity로 사용할 stable `relationId`를 가집니다.
- `(relationType, fromId, toId)`는 create 시 convenience input 또는 lookup hint일 수 있지만, update/remove의 authoritative identity는 아닙니다.
- relation은 provenance, version, attribute를 가질 수 있습니다.

현재 workspace 기준선에서 유력한 relation candidate:

- `contains`
  - tree/navigation 또는 document grouping을 설명하는 containment candidate입니다.
- `references`
  - 문서가 다른 object를 언급하거나 연결할 때 쓰는 일반 참조 relation입니다.
- `related_to`
  - 약한 의미 연결이나 연관 탐색용 fallback relation입니다.
- `applies_to`
  - strategy/activity/document가 recruitment 또는 company에 직접 연결될 때의 후보 relation입니다.
- `offered_by`
  - recruitment나 training이 company/provider에 연결될 때의 후보 relation입니다.
- `targets_job`
  - document/activity/training이 특정 job을 목표로 할 때의 후보 relation입니다.
- `targets_department`
  - document/activity가 특정 department 또는 전공 맥락과 연결될 때의 후보 relation입니다.
- `requires`
  - recruitment/job/training이 skill, certificate, prerequisite object를 요구할 때의 후보 relation입니다.
- `scheduled_for`
  - activity/document/recruitment/training이 시간 의미와 연결될 때의 temporal relation 후보입니다.
- `derived_from`
  - source-backed object나 generated artifact의 provenance를 설명할 때 쓰는 relation입니다.

relation 선택 원칙:

- relation type은 source raw field를 그대로 반영하기보다 user-visible explanation에 맞는 semantic 이름을 우선합니다.
- MVP 단계에서는 범용 relation을 너무 많이 늘리기보다 `references`, `related_to`, `scheduled_for` 같은 최소 집합으로 시작하는 편이 안전합니다.
- source별 특수 relation은 integration/domain mapping에서 흡수하고, common model에는 반복적으로 드러나는 것만 올립니다.

### Relation Responsibility by Projection

- `tree`
  - 주로 `contains` 또는 동등한 navigation relation에 의존합니다.
- `document`
  - `references`, `related_to`, `scheduled_for`와 provenance decoration이 중요합니다.
- `graph`
  - relation type과 provenance가 가장 직접적으로 드러나는 projection입니다.
- `calendar`
  - `scheduled_for` 또는 object temporal field가 핵심입니다.
- `search`
  - relation은 ranking/context hint로 기여할 수 있지만 기본 응답 단위를 relation으로 고정하지는 않습니다.
- `workspace_summary`
  - relation detail보다 aggregate count와 due/linked 상태 요약이 중요합니다.

### Projection

projection은 canonical knowledge object 및 relation에서 파생된 user-visible read shape입니다.

projection은 canonical object와 동일하지 않으며, command execution보다 늦게 반영될 수 있습니다.

현재 1급 projection family 후보:

- `tree`
- `document`
- `graph`
- `calendar`
- `search`
- `workspace_summary`

projection family 설명:

- `tree`
  - navigation 목적의 read shape
  - object field, containment 성격의 relation, lifecycle state에 의존할 수 있습니다.
- `document`
  - 특정 문서의 읽기용 surface
  - canonical document object와 일부 relation decoration을 포함할 수 있습니다.
- `graph`
  - object와 relation의 neighborhood를 시각화하기 위한 read shape
  - relation-derived 성격이 강합니다.
- `calendar`
  - 시간 의미를 가진 object/relation에서 파생되는 read shape
  - temporal-derived 성격이 강합니다.
- `search`
  - object, relation, text surface, indexing transform을 포함하는 탐색용 read shape입니다.
- `workspace_summary`
  - count, highlight, status를 묶는 aggregate-derived read shape입니다.

### Projection State

projection state는 특정 projection이 최신 read-visible 상태인지 표현하는 candidate 모델입니다.

유력 상태:

- `applied`
- `pending`
- `partial`
- `unknown`
- `stale`

원칙:

- command execution success와 projection state는 별개입니다.
- `applied`는 external authority가 해당 projection의 read visibility를 authoritative하게 확인할 수 있을 때만 사용합니다.
- `partial`은 projection마다 반영 정도가 다를 수 있음을 의미합니다.

유력 공통 shape:

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

설명:

- `lastKnownVersion`은 projection-local freshness 힌트입니다.
- `lastVisibleAt`은 마지막으로 사용자에게 read-visible했다고 확인된 시각입니다.
- `refreshRecommended`는 frontend가 polling 또는 targeted refresh를 결정할 때 쓰는 hint입니다.

### Lifecycle State

object lifecycle은 hard delete가 아닌 logical state transition 중심으로 표현합니다.

현재 유력 상태:

- `active`
- `archived`

원칙:

- archive는 object-class-specific capability입니다.
- user-authored object는 일반적으로 archive/restore를 지원합니다.
- imported/source-backed object는 local suppression 의미로 archive를 가질 수 있지만, upstream deletion semantics를 뜻하지 않습니다.
- system-derived object는 archive보다 regenerate/invalidate 정책이 더 적합할 수 있습니다.

### Relation Provenance

relation provenance는 edge가 어떤 방식으로 생겼는지 설명합니다.

현재 고정 후보 필드:

- `provenanceClass`
  - `explicit_command`
  - `derived_from_document`
- `sourceObjectId`
- `sourceVersion` 또는 `derivedFromVersion`(authoritative할 때만)

원칙:

- explicit relation과 document body에서 유도된 relation은 구분되어야 합니다.
- provenance는 graph/document detail projection에서 우선 노출합니다.
- list/search payload에는 기본적으로 강제하지 않습니다.

## Canonical vs Projection-only

구분 규칙:

- stable identity를 가지고 직접 command/lifecycle 대상이 되면 canonical object입니다.
- presentation, traversal, ranking, aggregation을 위해서만 존재하면 projection-only structure입니다.

현재 분류 후보:

- `folder`
  - 현재 draft 방향에서는 projection-only로 취급합니다.
  - user-managed folder object를 명시적으로 도입하기 전까지 canonical object로 고정하지 않습니다.
- `calendar event`
  - 현재 draft 방향에서는 projection-only로 취급합니다.
  - 별도 scheduled object를 도입하는 경우에 canonical object 도입을 다시 검토할 수 있습니다.
- `search hit`
  - projection-only
- `graph node`
  - projection-only wrapper around canonical object ref
- `graph edge`
  - projection-only wrapper around canonical relation ref
- `tag`
  - domain별로 canonical object 또는 projection label이 될 수 있으므로 현재는 draft로 둡니다.
- `workspace summary card`
  - projection-only

### Current Draft Direction

- `tag`
  - 현재 draft 방향에서는 canonical object로 고정하지 않습니다.
  - 우선 structured metadata 또는 projection label로 해석합니다.
  - tag 자체가 stable identity, lifecycle, detail surface를 가져야 하는 요구가 강해질 때 canonical object 도입을 다시 검토합니다.
- `calendar event`
  - 현재 draft 방향에서는 projection-only structure로 해석합니다.
  - calendar는 canonical object의 temporal field 또는 relation에서 파생되는 read shape로 우선 설명합니다.
  - user-authored scheduled object가 필요해질 경우 별도 canonical object 도입을 다시 검토합니다.

## Candidate Shared Structures

### Workspace Object Snapshot

유력 최소 shape:

```ts
type KnowledgeObjectSnapshot = {
  objectId: string;
  objectKind:
    | "document"
    | "recruitment"
    | "company"
    | "training"
    | "job"
    | "department"
    | "activity"
    | "strategy_note"
    | "skill";
  title?: string;
  lifecycleState?: "active" | "archived";
  source?: {
    provider?: string;
    sourceId?: string;
  };
};
```

설명:

- 이 shape는 public stable schema가 아니라 projection 간 공통 언어를 맞추기 위한 candidate입니다.
- object kind 목록은 현재 workspace/core domain 논의를 위한 최소 후보군이며 final resource catalog가 아닙니다.

### Object Ref

projection payload에서 canonical object를 가리키는 최소 reference shape 후보입니다.

유력 최소 shape:

```ts
type KnowledgeObjectRef = {
  objectId: string;
  objectKind:
    | "document"
    | "recruitment"
    | "company"
    | "training"
    | "job"
    | "department"
    | "activity"
    | "strategy_note"
    | "skill";
  title?: string;
};
```

원칙:

- `objectId`와 `objectKind`는 ref의 최소 required field 후보입니다.
- `title` 같은 display hint는 optional이며 authoritative object detail을 대체하지 않습니다.
- projection wrapper는 full object payload 대신 object ref를 가질 수 있습니다.

### Relation Ref

projection payload 또는 refresh hint에서 canonical relation을 가리키는 최소 reference shape 후보입니다.

유력 최소 shape:

```ts
type KnowledgeRelationRef = {
  relationId: string;
  relationType?: string;
  fromObjectRef?: KnowledgeObjectRef;
  toObjectRef?: KnowledgeObjectRef;
};
```

원칙:

- update/remove authority는 `relationId` 기준입니다.
- `relationType`, endpoint object ref는 display/navigation hint로 함께 올 수 있지만 authoritative identity를 대체하지 않습니다.
- graph/document/calendar payload에서 relation ref는 full relation detail 대신 lightweight pointer로 사용될 수 있습니다.

### Projection Decoration

projection decoration은 canonical object field 자체가 아니라 projection에서만 필요한 보조 정보입니다.

대표 예시:

- tree depth, path, expanded hint, child count
- document relation preview, relation provenance badge, excerpt
- calendar temporal source label, day bucket, urgency badge

원칙:

- decoration field는 object metadata와 구분해 설명합니다.
- decoration field는 projection family에 종속되며 canonical object contract를 직접 확장하지 않습니다.
- 같은 object라도 projection마다 다른 decoration을 가질 수 있습니다.

### Identifier Strategy

- object, relation, command는 stable external identifier를 가질 수 있어야 합니다.
- WAS는 read authority와 MCP facade의 raw internal key format을 직접 가정하지 않습니다.

### Source Metadata

유력 필드:

- `provider`
- `sourceId`
- `fetchedAt`
- `sourceCategory`

설명:

- source-backed object의 provenance와 freshness 설명에 사용합니다.

### Version Token

유력 필드:

- `objectVersion`
- `relationVersion`
- projection-local `version`

원칙:

- optimistic concurrency는 object/relation update command에서 사용합니다.
- projection-local version은 모든 projection에 강제하지 않습니다.
- 현재 draft 방향에서는 `document`, `graph`, `calendar`, `search`에 version carrying 필요성이 큽니다.

### Document Surface Field

document surface field는 사람이 읽는 문서 표면을 구성하는 authored field입니다.

현재 draft 방향:

- `title`
- `bodyMarkdown`
- 필요 시 제한적인 presentational summary

반면 아래는 기본적으로 structured metadata로 해석합니다.

- `tags`
- `status`
- `dueAt`
- `source metadata`
- structured annotation

원칙:

- syntax 위치가 아니라 semantic meaning으로 분류합니다.
- frontmatter에 적혀 있다는 사실만으로 document surface field가 되지는 않습니다.
- document surface field 목록은 현재 좁게 유지하고, 확장 필요가 누적될 때 다시 검토합니다.

유력 최소 shape:

```ts
type DocumentSurface = {
  title: string;
  bodyMarkdown: string;
  summary?: {
    text: string;
    kind: "plain_text" | "markdown_excerpt";
  };
};
```

제한:

- `summary`는 body의 대체 canonical field라기보다 제한적 presentational surface입니다.
- cover image, icon, hero field 같은 presentational field는 반복 요구가 누적되기 전까지 공식 common model에 넣지 않습니다.

## Structured Draft Decisions

### `tag`

현재 비교안:

- option A
  - `tag`를 canonical object로 둡니다.
  - stable `tagId`, tag detail surface, lifecycle, relation target을 전제로 합니다.
- option B
  - `tag`를 metadata value 또는 projection label로 둡니다.
  - filter, search facet, document decoration 중심으로 다룹니다.
- option C
  - mixed model로 둡니다.
  - 대부분은 metadata label로 두고, 일부 curated taxonomy만 canonical object로 승격합니다.

채택 조건:

- option A
  - tag detail page, alias/merge, hierarchy, ownership, ACL 같은 요구가 반복적으로 필요합니다.
- option B
  - tag의 주역할이 분류, 검색, 필터, lightweight annotation에 머뭅니다.
- option C
  - free-form label과 curated taxonomy를 동시에 다뤄야 하고 둘을 하나의 모델로 설명하기 어렵습니다.

반대 신호:

- option A
  - 단순 label을 위해 stable identity와 lifecycle을 너무 일찍 고정하게 됩니다.
- option B
  - tag relation, canonical taxonomy, tag-level detail UX가 제품 핵심으로 커지기 시작합니다.
- option C
  - 같은 `tag` 용어 아래 서로 다른 identity discipline이 섞여 contract 설명이 어려워집니다.

contract impact:

- option A
  - object kind, relation target, tag detail read, tag lifecycle command 후보가 늘어납니다.
- option B
  - `knowledge.metadata.patch`와 search/filter payload만으로 대부분 설명 가능합니다.
- option C
  - metadata label과 canonical taxonomy ref를 구분하는 dual-field contract가 필요합니다.

현재 추천 방향:

- 공식 문서에서는 option B를 current draft direction으로 둡니다.
- option C는 장기 확장 후보로만 남깁니다.
- option A는 실제 taxonomy ownership 요구가 강해질 때 다시 검토합니다.

지금 고정 가능한 것:

- `tag`를 현재 canonical object로 확정하지 않습니다.
- `tag`는 metadata/filter/search label 언어로 우선 설명합니다.

아직 draft로 남길 것:

- curated taxonomy를 별도 object family로 둘지
- tag alias, hierarchy, merge semantics를 지원할지

### `calendar event`

현재 비교안:

- option A
  - `calendar event`를 canonical object로 둡니다.
  - stable event identity, lifecycle, edit command를 전제로 합니다.
- option B
  - `calendar event`를 projection-only structure로 둡니다.
  - object field와 temporal relation에서 파생된 read shape로 해석합니다.
- option C
  - hybrid model로 둡니다.
  - 기본은 projection-only이되, user-authored schedule만 canonical object로 둡니다.

채택 조건:

- option A
  - 일정 단위 수정, 참석 상태, reminder, recurrence, event-specific ACL이 필요합니다.
- option B
  - 캘린더가 마감일, due date, scheduled relation의 읽기 projection 역할에 머뭅니다.
- option C
  - source-derived timeline과 user-authored planning object를 함께 다뤄야 합니다.

반대 신호:

- option A
  - 대부분의 일정이 기존 object의 날짜 필드에서 충분히 파생됩니다.
- option B
  - 사용자가 일정 자체를 생성, 수정, archive해야 하는 요구가 누적됩니다.
- option C
  - event 종류별 semantics가 달라져 API와 UX가 과도하게 갈라집니다.

contract impact:

- option A
  - calendar event object kind, event command family, event detail shape가 필요합니다.
- option B
  - `calendar` projection response에서 source object ref와 temporal semantics만 잘 표현하면 됩니다.
- option C
  - projection item 안에 derived event와 authored event를 구분하는 discriminator가 필요합니다.

현재 추천 방향:

- 공식 문서에서는 option B를 current draft direction으로 둡니다.
- option C는 user-authored planning object 요구가 확인될 때 검토합니다.

지금 고정 가능한 것:

- `calendar`는 우선 temporal projection 언어로 설명합니다.
- projection item은 canonical object ref를 포함하되 event 자체를 canonical identity로 단정하지 않습니다.

아직 draft로 남길 것:

- recurrence, reminder, 참석/상태 같은 일정 고유 semantics 필요 여부
- user-authored schedule object를 별도 도입할지

### Document-Surface Field

현재 비교안:

- option A
  - document surface를 넓게 둡니다.
  - title, body, summary, icon, cover, subtitle, callout metadata 등을 포함합니다.
- option B
  - document surface를 좁게 둡니다.
  - `title`, `bodyMarkdown`, 제한적 summary만 포함합니다.
- option C
  - core surface와 extension bucket을 분리합니다.
  - 공식 core는 좁게 두고 일부 presentational field는 optional extension으로 둡니다.

채택 조건:

- option A
  - 문서 화면이 rich publishing surface로 발전하고 field-level UX가 반복됩니다.
- option B
  - 제품 핵심이 authored knowledge body와 metadata separation에 있습니다.
- option C
  - 확장 수요는 있으나 지금 공식 공통 모델에 전부 고정하기는 이릅니다.

반대 신호:

- option A
  - metadata와 presentational surface의 경계가 빠르게 흐려집니다.
- option B
  - 여러 화면에서 subtitle, excerpt, badge text 같은 표면 필드가 반복적으로 필요합니다.
- option C
  - extension bucket이 사실상 임의 필드 저장소처럼 사용됩니다.

contract impact:

- option A
  - `knowledge.document.update` payload가 빠르게 커지고 frontend/WAS contract 결합도가 높아집니다.
- option B
  - `knowledge.document.update`와 `knowledge.metadata.patch`의 역할 분리가 유지됩니다.
- option C
  - core field와 optional presentation field의 ownership rule을 추가로 명시해야 합니다.

현재 추천 방향:

- 공식 문서에서는 option B를 current draft direction으로 둡니다.
- option C는 반복 요구가 확인되면 제한된 extension으로 검토합니다.

지금 고정 가능한 것:

- `title`, `bodyMarkdown`, 제한적 summary만 document-surface field 후보로 둡니다.
- `tags`, `status`, `dueAt`, `source metadata`, structured annotation은 metadata 언어로 유지합니다.

아직 draft로 남길 것:

- summary를 authored field로 볼지 derived field로 볼지
- subtitle, icon, cover 같은 presentational field 필요 여부

### Error Response

유력 필드:

- `code`
- `message`
- `details`
- `retryable`

원칙:

- external dependency 원문 에러를 그대로 public contract에 노출하지 않습니다.
- conflict, ACL, temporary failure는 안정적인 external code로 정규화합니다.

## Rules

- common model은 storage shape보다 semantic boundary를 우선합니다.
- 문서 표현의 syntax 위치보다 field 의미를 우선합니다.
- `document.update`와 `metadata.patch`는 겹치지 않도록 의미를 분리합니다.
- projection-only structure를 canonical object처럼 과대모델링하지 않습니다.

## Open Questions

- `tag`에 stable identity와 lifecycle이 실제로 필요한지
- `calendar event`를 별도 canonical scheduled object로 도입할 필요가 있는지
- document-surface presentational field를 summary 외 어디까지 넓힐지
