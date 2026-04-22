# Architecture Overview

## Goal

이 시스템은 채용, 직업, 기업, 학과, 훈련 정보를 사용자별 markdown-native workspace로 재구성해 제공하는 웹 서비스를 목표로 합니다.

핵심 방향은 아래와 같습니다.

- 제품의 중심은 personal wiki/workspace 입니다.
- shared layer는 무거운 완결형 knowledge graph가 아니라 lightweight shared substrate 입니다.
- `Jobs-Wiki`는 recruiting domain semantics 와 workspace UX 를 소유합니다.
- `StrataWiki`는 shared `Fact`/`Interpretation` runtime 과 governance 를 소유합니다.

## Components

- Frontend
- WAS
- Ingestion
- Third-party integrations
- Read authority
- MCP facade
- External consumers

## High-Level Flow

사용자 read 요청 -> frontend -> WAS -> read authority / local adapters

사용자 command 요청 -> frontend -> WAS -> MCP facade

외부 소비자 요청 -> WAS public API

수집/정규화 -> Ingestion -> integrations -> third-party APIs

canonical write 반영 -> external backend ownership 범위

## Workspace Model Direction

- Jobs-Wiki의 핵심 읽기 모델은 file list만이 아니라 workspace projection입니다.
- tree, document, graph, calendar, search, workspace summary는 같은 knowledge space의 서로 다른 projection으로 취급합니다.
- projection은 canonical object/relation에서 파생된 user-visible read shape이며, command 결과보다 늦게 반영될 수 있습니다.
- workspace의 실제 작업 표면은 personal markdown 문서입니다.
- shared `Fact`/`Interpretation`은 workspace를 보조하는 retrieval substrate로 사용됩니다.

현재 draft 기준선:

- `tag`는 우선 canonical object보다 metadata/filter/search label 언어로 설명합니다.
- `calendar event`는 우선 canonical scheduled object보다 temporal projection item으로 설명합니다.
- document-surface field는 우선 `title`, `bodyMarkdown`, 제한적 summary 중심으로 좁게 유지합니다.

## Boundaries

- frontend는 WAS 공개 API만 사용합니다.
- WAS는 serving 책임만 갖습니다.
- WAS는 read path와 command path를 분리합니다.
- WAS는 ingestion을 직접 수행하지 않습니다.
- Ingestion은 수집/적재 책임만 갖습니다.
- integrations는 외부 서비스 규칙을 캡슐화하며 WAS와 Ingestion이 함께 사용할 수 있습니다.
- read authority는 user-visible knowledge state의 external read-serving authority입니다.
- MCP facade는 user intent를 external command로 위임하는 경계입니다.
- `Jobs-Wiki`는 domain routing, domain pack authoring, source normalization, personal workspace UX 를 소유합니다.
- `StrataWiki` 같은 external backend 는 canonical shared storage, shared interpretation lifecycle, snapshot, governance 를 소유합니다.
- canonical storage가 별도 backend에 있다면 그 ownership은 해당 backend에 있습니다.
- 외부 소비자는 이 레포의 내부 코드를 직접 의존하지 않습니다.

## StrataWiki Boundary

현재 기준에서 `Jobs-Wiki` 와 `StrataWiki` 의 분리는 아래처럼 이해하는 것이 맞습니다.

- `Jobs-Wiki`
  - recruiting domain 의미 정의
  - source ingest 와 normalization
  - domain pack 제안
  - proposal 생성
  - personal workspace 와 editor UX
- `StrataWiki`
  - canonical `Fact` 저장
  - shared `Interpretation` 저장
  - pack validation / activation / enforcement
  - snapshot / stale / provenance / retrieval substrate

즉 `Jobs-Wiki` 가 의미를 정의하고 제품 경험을 소유하며,
`StrataWiki` 는 shared runtime 을 안전하게 운영합니다.

## Sync and Visibility Direction

- command execution success와 read visibility는 같은 의미가 아닙니다.
- WAS와 frontend는 projection-local sync state를 전제로 동작해야 합니다.
- external boundary가 authoritative하지 않다면 `applied` 대신 `pending`, `partial`, `unknown`, `stale` 같은 상태를 유지하는 편이 맞습니다.

## Long-Term Expansion Conditions

- `tag`
  - taxonomy hierarchy, alias/merge, stable `tagId`, tag detail read가 반복 요구될 때 canonical 승격을 재검토합니다.
- `calendar event`
  - recurrence, reminder, 참석 상태, event-specific edit flow가 필요해질 때 별도 scheduled object 도입을 재검토합니다.
- document-surface field
  - subtitle, cover, icon 같은 presentational field가 여러 projection에서 반복 요구될 때 확장을 재검토합니다.

## Non-Goals

- 이 레포에서 MCP 서버 구현을 포함하지 않습니다.
- 이 레포에서 DB schema/migration ownership을 포함하지 않습니다.
- WAS request path 안에 ingestion orchestration을 넣지 않습니다.
