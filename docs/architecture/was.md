---
status: draft
working_notes:
  - dev-wiki/architecture/2026-04-15-ingestion-layer-placement.md
  - dev-wiki/decisions/2026-04-16-jobs-wiki-external-mcp-command-contract.md
---

# WAS Architecture

## Responsibilities

- 공개 HTTP API 제공
- frontend 및 외부 소비자 요청 처리
- 이 레포 내부 서비스 호출
- 외부 backend 의존성 호출
- 인증, 에러, 캐시, 로깅 정책 적용
- 필요 시 ingestion job 요청
- 사용자별 지식 공간 조회 API 제공
- 캘린더 및 그래프 조회 API 제공
- 문서 수정/질의 요청을 외부 MCP 경계로 전달

## Explicit Non-Goals

- durable ingestion orchestration
- crawling
- retry/backfill/scheduling
- source payload collection 파이프라인 운영
- source fetch loop 직접 실행

## Internal Layers

- HTTP/API layer
- application service layer
- domain model layer
- optional ingestion-trigger layer
- external adapter layer for read authority / MCP facade

## Relationship to Ingestion

- WAS는 ingestion을 직접 수행하지 않습니다.
- WAS는 ingestion 내부 로직에 의존하지 않습니다.
- WAS가 할 수 있는 것은 좁은 경계로 ingestion job을 요청하는 것뿐입니다.
- WAS request path 안에 durable ingestion 책임을 넣지 않습니다.

## Dependency Rule

- WAS는 `packages/integrations/*`를 직접 사용할 수는 있습니다.
- 그러나 지속적 수집, backfill, retry, crawling orchestration은 ingestion 계층에 둡니다.
- WAS는 외부 API 규칙을 직접 퍼뜨리지 않습니다.

## Read and Command Boundary

- 읽기 경로와 command 경로는 분리합니다.
- 읽기 경로에서는 WAS가 external read authority를 통해 사용자 문서, 메타데이터, 링크 관계, 일정 정보를 조회합니다.
- command 경로에서는 WAS가 변경을 직접 확정하지 않고, external MCP facade로 사용자 요청을 위임합니다.
- WAS는 external dependency의 raw shape를 frontend에 그대로 노출하지 않고 workspace projection으로 변환할 수 있습니다.
- draft 단계에서는 이 계약을 final endpoint로 고정하지 않고 candidate contract로 유지합니다.

## External Read Authority

### Definition

read authority는 Jobs-Wiki WAS가 user-visible knowledge state 조회 시 authoritative하다고 간주하는 external read-serving dependency입니다.

이 용어는 아래를 고정하지 않습니다.

- MCP와 동일한 배포 surface인지 여부
- DB/storage ownership의 위치
- projection materialization이 read authority에서 끝나는지, WAS 조합이 일부 필요한지 여부

### Responsibility

- tree/document/graph/calendar/search/workspace summary에 필요한 read surface 제공
- canonical object, relation, lifecycle, temporal semantics를 읽기 가능한 형태로 제공
- 필요 시 projection-local freshness 또는 version token 제공

## External MCP Facade

### Definition

MCP facade는 Jobs-Wiki WAS가 user command를 external boundary로 위임할 때 사용하는 command-oriented dependency입니다.

### Responsibility

- command submission
- command status 조회
- affected object/relation ref 제공
- authoritative한 경우에만 projection visibility 상태 제공

### Non-Goal

- normal read-serving surface를 대신하는 것
- frontend와 직접 연결되는 것
- WAS 내부에서 edit session semantics를 강제하는 것

## Projection and Sync Discipline

- tree, document, graph, calendar, search, workspace summary는 같은 knowledge space의 서로 다른 projection으로 취급합니다.
- command execution success와 projection visibility는 분리합니다.
- `applied`는 external authority가 해당 projection의 read visibility를 확인할 수 있을 때만 사용합니다.
- `partial` 또는 `unknown` 상태를 정직하게 유지하는 것이, WAS가 completion을 추론하는 것보다 낫습니다.

### Default WAS Behavior

- `applied`
  - 해당 projection을 즉시 refresh하고 syncing 표시를 해제합니다.
- `pending`
  - 마지막으로 확인된 데이터를 유지하고 syncing 상태를 표시합니다.
- `partial`
  - applied projection만 refresh하고 나머지는 stale/syncing 표시로 유지합니다.
- `unknown`
  - freshness를 주장하지 않고 마지막으로 확인된 데이터를 유지합니다.
- `stale`
  - 사용 가능한 마지막 데이터를 보여주되 stale 표시를 유지합니다.

## Document and Metadata Boundary

- `knowledge.document.update`는 authored document surface를 대상으로 합니다.
- `knowledge.metadata.patch`는 canonical structured metadata를 대상으로 합니다.
- frontmatter-like field는 syntax 위치가 아니라 field 의미로 분류합니다.
- explicit relation command와 body-derived relation은 provenance로 구분해야 합니다.

현재 WAS 기준선:

- `tag`
  - 우선 canonical object command family를 만들지 않습니다.
  - `knowledge.metadata.patch`와 search/filter read shape에서 다루는 편이 맞습니다.
- `calendar event`
  - 우선 event-specific command family를 만들지 않습니다.
  - calendar는 object field 또는 temporal relation에서 파생된 projection으로 설명합니다.
- document-surface field
  - `knowledge.document.update`는 `title`, `bodyMarkdown`, 제한적 summary 중심으로 좁게 유지합니다.
  - `tags`, `status`, `dueAt`, source metadata, structured annotation은 `knowledge.metadata.patch` 경계에 둡니다.

장기 확장 검토 조건:

- `tag`
  - stable `tagId`, taxonomy lifecycle, tag detail read가 실제로 필요해질 때
- `calendar event`
  - event identity, recurrence, reminder, event lifecycle 같은 별도 command semantics가 필요해질 때
- document-surface field
  - presentational field가 반복적으로 command 대상이 되며 metadata와 분리된 ownership을 가져야 할 때

## Open Questions

- folder를 projection-only로 유지할지 여부
- 장기적으로 `tag`를 taxonomy object family로 승격할지 여부
- 장기적으로 user-authored schedule object를 별도 canonical object로 둘지 여부
- 제한적 summary 외 document-surface presentational field를 어디까지 확장할지
