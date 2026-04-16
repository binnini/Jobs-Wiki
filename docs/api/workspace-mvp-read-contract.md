---
status: draft
---

# Workspace MVP Read Contract

## Status

Draft

이 문서는 final endpoint catalog가 아니라 workspace MVP read contract의 candidate projection semantics를 정리합니다.

## Purpose

- workspace-facing API 중 MVP 우선 slice인 `tree`, `document`, `calendar`를 좁게 정리합니다.
- response shape, field ownership, sync visibility, ref usage를 공식 문서 수준에서 맞춥니다.
- resource contract와 projection contract를 섞지 않습니다.

## Scope

이 문서가 다루는 것:

- `tree`
- `document`
- `calendar`

이 문서가 고정하지 않는 것:

- final endpoint naming
- storage shape
- DB/schema ownership
- MCP implementation
- event-specific command family
- domain/public resource API shape

## Shared Rules

### Projection Discipline

- `tree`, `document`, `calendar`는 같은 knowledge space의 서로 다른 read projection입니다.
- projection은 canonical object와 동일하지 않을 수 있습니다.
- projection response는 command execution보다 늦게 갱신될 수 있습니다.

### Field Buckets

- object field
  - canonical object identity 또는 authored surface에 속하는 field입니다.
- metadata field
  - filter/search/status/source 설명에 가까운 structured field입니다.
- projection decoration
  - navigation, preview, urgency, grouping처럼 projection에서만 필요한 helper field입니다.

현재 MVP 기준선:

- `title`, `bodyMarkdown`, 제한적 summary는 document surface입니다.
- `tags`, `status`, `dueAt`, `source metadata`는 metadata field입니다.
- `path`, `depth`, `dayBucket`, `urgencyLabel`, relation excerpt는 projection decoration입니다.

### Sync Visibility

- command success와 read visibility는 분리합니다.
- projection sync state는 top-level response `sync`에 두는 방향이 유력합니다.
- item-level sync state는 MVP 기본 required field로 두지 않습니다.

유력 vocabulary:

- `applied`
- `pending`
- `partial`
- `unknown`
- `stale`

### Ref Usage

- object identity anchor는 object ref를 우선합니다.
- relation identity는 relation ref를 optional하게 사용합니다.
- projection item id는 canonical object id나 canonical event id를 자동으로 뜻하지 않습니다.

유력 최소 shape:

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

## Tree

### Role

- workspace navigation과 file-explorer traversal을 위한 projection입니다.
- canonical folder object를 전제하지 않고도 tree container를 표현할 수 있어야 합니다.

### Candidate Shape

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

### Required vs Optional

- required candidate
  - `projection`
  - `nodes`
  - `nodeId`
  - `nodeType`
  - `label`
- optional candidate
  - `version`
  - `sync`
  - `objectRef`
  - `metadata`
  - `decoration`

### Field Ownership

- object field
  - `objectRef`
- metadata field
  - `metadata.status`
  - `metadata.tags`
- projection decoration
  - `parentNodeId`
  - `path`
  - `depth`
  - `order`
  - `hasChildren`
  - `childCount`

### Sync Visibility Concern

- `tree` freshness는 response top-level `sync`에서 설명합니다.
- tree node별 sync state는 MVP 기본 shape에 넣지 않습니다.

### Object Ref / Relation Ref

- object node는 `objectRef`를 canonical anchor로 갖는 방향이 유력합니다.
- folder/container node는 projection-only로 남길 수 있습니다.
- containment relation ref는 현재 기본 response에서 required가 아닙니다.

### Projection-Specific Concern

- `folder`는 current draft에서 projection-only container입니다.
- `label`은 navigation label이며 canonical object title과 항상 같다고 가정하지 않습니다.
- tree payload는 document detail보다 lightweight해야 합니다.

## Document

### Role

- 특정 authored document의 읽기 surface를 제공하는 projection입니다.
- document surface, selected metadata, relation decoration을 함께 보여줄 수 있어야 합니다.

### Candidate Shape

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

### Required vs Optional

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

### Field Ownership

- object field / document surface
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

### Sync Visibility Concern

- document freshness는 response top-level `sync`로 표현합니다.
- `knowledge.document.update` acceptance 이후에도 `document`는 `pending` 또는 `stale`일 수 있습니다.
- body visibility와 relation decoration freshness는 항상 동시에 보장되지 않을 수 있습니다.

### Object Ref / Relation Ref

- `documentRef`는 document identity anchor입니다.
- `relations[].targetObjectRef`는 linked canonical object를 가리킵니다.
- `relations[].relationRef`는 explicit relation identity가 있을 때만 포함하면 됩니다.
- body-derived relation preview는 relation ref 없이도 표현할 수 있어야 합니다.

### Projection-Specific Concern

- document projection은 resource detail이 아니라 workspace reading surface입니다.
- frontmatter-like syntax는 ownership 분류 기준이 아닙니다.
- `tags`, `status`, `dueAt`를 document surface에 섞어 command boundary를 넓히지 않는 편이 맞습니다.

## Calendar

### Role

- 시간 의미를 가진 object field 또는 temporal relation을 일정형 read surface로 보여주는 projection입니다.
- `calendar event`를 current draft에서 canonical object로 고정하지 않습니다.

### Candidate Shape

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

### Required vs Optional

- required candidate
  - `projection`
  - `range.from`
  - `range.to`
  - `items`
  - `itemId`
  - `sourceObjectRef`
  - `temporalSource`
- optional candidate
  - `version`
  - `sync`
  - `startsAt`
  - `endsAt`
  - `allDay`
  - `relationRef`
  - `metadata`
  - `decoration`

### Field Ownership

- object field
  - `sourceObjectRef`
  - `startsAt`
  - `endsAt`
  - `temporalSource`
- metadata field
  - `metadata.status`
  - `metadata.tags`
- projection decoration
  - `decoration.timeLabel`
  - `decoration.dayBucket`
  - `decoration.urgencyLabel`

### Sync Visibility Concern

- calendar freshness는 response top-level `sync`로 설명합니다.
- item별 sync state는 MVP 기본 shape에 넣지 않습니다.
- command acceptance 이후 calendar visibility는 `unknown` 또는 `stale`로 남을 수 있습니다.

### Object Ref / Relation Ref

- 모든 calendar item은 source object ref를 가져야 하는 방향이 유력합니다.
- temporal meaning이 object field에서 오면 `relationRef`는 필요하지 않습니다.
- temporal meaning이 canonical relation에서 오면 `relationRef`를 함께 줄 수 있습니다.
- `itemId`는 projection item id이며 canonical event id를 뜻하지 않습니다.

### Projection-Specific Concern

- calendar item은 source object deep-link를 우선합니다.
- deadline, due date, session period를 하나의 canonical event object로 성급히 묶지 않습니다.
- `temporalSource`와 decoration을 통해 item의 시간 의미를 설명하는 편이 맞습니다.

## Current Recommendations

- `tree`는 object-ref-first navigation projection으로 유지합니다.
- `document`는 surface와 metadata ownership을 계속 분리합니다.
- `calendar`는 source-object-first temporal projection으로 유지합니다.
- sync state는 per-item보다 projection top-level에 두는 편이 현재 MVP 범위에 맞습니다.

## Open Questions

- `tree`에서 containment relation ref를 언제 공식 response에 포함할지
- `document.surface.summary`를 authored field로 볼지 decoration에 더 가까운 field로 볼지
- `calendar`에서 deadline-only item 표현을 더 별도화할지
- user-authored schedule object가 필요해져 `calendar event`를 canonical object로 승격할지
