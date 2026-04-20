---
status: draft
---

# Web Service Requirements Analysis

## Purpose

이 문서는 Jobs-Wiki 웹 서비스를 구현하기 전에, 아래 네 가지를 한 문서에서 정리하기 위한 기준 문서입니다.

- 웹 서비스를 위해 실제로 필요한 것
- 현재 이미 구현되어 있는 것
- 아직 구현되지 않았거나 보완이 필요한 것
- 지금 단계에서 먼저 고정해야 할 요구사항과 결정사항

이 문서는 세부 endpoint catalog를 확정하지 않습니다.
대신 현재 `StrataWiki`와 `Jobs-Wiki`가 어디까지 준비되었는지, 그리고 웹 서비스 구현의 실제 시작점을 어디에 둘지 정리합니다.

## Current Position

현재 상태를 한 줄로 요약하면 아래와 같습니다.

- `StrataWiki`
  - domain pack, proposal ingestion, canonical fact/relation write, schema governance까지 준비된 external knowledge backend
- `Jobs-Wiki`
  - product docs, WorkNet integration, recruiting domain pack, proposal mapper, fixture/test 자산 위에
    `apps/was`, `apps/frontend`, `apps/ingestion` baseline runtime 이 올라온 web-service-centered repo
- 아직 더 좁혀야 하는 부분
  - MVP contract hardening
  - production-grade scheduling / backfill policy
  - `Jobs-Wiki apps/*`의 StrataWiki transport 규칙 고정

즉, 현재는 "설계와 integration foundation만 있는 상태"는 아니고,
"baseline runtime 은 올라왔지만 contract 와 운영 규칙을 계속 고정해야 하는 상태"로 보는 편이 맞습니다.

## Project Requirement Analysis

### 1. Product Requirement

Jobs-Wiki는 단순 채용 공고 검색 화면이 아니라, 사용자별 취업 지식 워크스페이스를 제공해야 합니다.

현재 제품 문서에서 반복적으로 보이는 핵심 요구사항은 아래와 같습니다.

- 분산된 취업 정보를 사용자별 knowledge space로 재구성할 것
- 같은 knowledge space를 여러 projection으로 탐색할 수 있을 것
- 단순 listing이 아니라 document, calendar, graph, search, summary 같은 다양한 읽기 surface를 가질 것
- command success와 read visibility를 분리해 eventual consistency를 정직하게 드러낼 것
- external backend ownership을 이 레포로 끌어오지 않을 것

이 요구사항은 아래 문서와 일치합니다.

- `docs/product/vision.md`
- `docs/product/scope.md`
- `docs/architecture/overview.md`

### 2. Architecture Requirement

웹 서비스를 구현하기 위해서는 최소한 아래 배치가 필요합니다.

- `frontend`
  - 사용자 경험과 화면 상태
- `WAS`
  - frontend-facing HTTP contract
  - auth, error normalization, caching, sync-state translation
- `ingestion`
  - third-party fetch, retry, backfill, scheduling
- external backend
  - 현재 기준으로 `StrataWiki`

이 구조에서 중요한 고정 원칙은 아래입니다.

- frontend는 external API나 StrataWiki를 직접 호출하지 않음
- WAS는 read path와 command path를 분리함
- WAS는 ingestion orchestration을 직접 품지 않음
- integration 패키지는 source protocol 책임만 가짐

이 원칙은 아래 문서와 일치합니다.

- `docs/architecture/overview.md`
- `docs/architecture/was.md`
- `docs/architecture/ingestion.md`
- `docs/api/was-external-boundaries.md`

### 3. Domain Requirement

현재 제품의 첫 vertical slice는 `recruiting` domain입니다.

그 의미는 다음과 같습니다.

- WorkNet source를 읽어서
- `Jobs-Wiki`가 domain-aware proposal을 만들고
- `StrataWiki`가 이를 canonical fact/relation으로 승인하고 저장하며
- 웹 서비스는 그 결과를 workspace projection으로 보여줘야 합니다.

중요한 점은, Jobs-Wiki가 source normalization과 domain semantics를 소유하지만,
canonical write authority는 계속 `StrataWiki`에 있다는 점입니다.

### 4. UX Requirement

현재 문서 전반에는 두 가지 UX 방향이 함께 존재합니다.

- PKM형 workspace
  - `tree`, `document`, `graph`, `calendar`, `search`, `workspace_summary`
- StrataWiki 강점 기반 vertical slice
  - `Ask Workspace`, `Opportunity Detail`, `Document Detail`, `Calendar`

이 둘은 충돌이라기보다, "장기 제품 형태"와 "초기 구현 우선순위"의 차이로 보는 편이 맞습니다.

정리하면:

- 장기 제품 정체성은 PKM형 workspace가 맞음
- 초기 구현 우선순위는 `StrataWiki`의 현재 강점에 더 맞춘 slice가 유리함

## What Is Already Implemented

### A. StrataWiki Side

이미 준비된 것:

- external domain pack registration / activation
- proposal ingestion validation and dry-run
- canonical fact / relation write
- schema governance and review audit
- recruiting pack을 실제 runtime에 로드하고 proposal batch를 ingest할 수 있는 상태

즉, `Jobs-Wiki`가 recruiting proposal을 만들면, `StrataWiki`가 그것을 받아 canonical knowledge로 반영하는 foundation은 완료된 상태입니다.

### B. Jobs-Wiki Domain and Integration Assets

이미 구현된 자산:

- WorkNet integration package
  - `packages/integrations/worknet`
- recruiting domain pack
  - `packages/domain-packs/recruiting/v1.json`
- WorkNet normalized payload -> DomainProposalBatch mapper
  - `packages/domain-packs/recruiting/mapper.ts`
- governance / mapper / fixture tests
  - `tests/domain-packs/*`
  - `packages/integrations/worknet/test/*`

즉, source adapter와 domain semantics는 이미 패키지 레벨에서 상당히 준비되어 있습니다.

### C. Documentation Base

이미 잘 정리된 문서:

- 제품 방향
  - `docs/product/vision.md`
  - `docs/product/scope.md`
- 아키텍처 경계
  - `docs/architecture/overview.md`
  - `docs/architecture/was.md`
  - `docs/architecture/ingestion.md`
  - `docs/architecture/frontend.md`
- API / boundary 후보
  - `docs/api/frontend-was.md`
  - `docs/api/workspace-mvp-read-contract.md`
  - `docs/api/was-external-boundaries.md`
- StrataWiki integration / governance
  - `docs/architecture/stratawiki-web-integration.md`
  - `docs/architecture/stratawiki-domain-pack.md`
  - `docs/architecture/stratawiki-schema-governance.md`
  - `docs/domain/recruiting-domain-pack.md`

즉, 현재 부족한 것은 "설계 문서 부재"가 아니라 "문서가 여러 장으로 분산되어 있고, 실제 구현 시작용 체크리스트가 한 장에 모여 있지 않다"는 점에 가깝습니다.

## What Is Not Implemented Yet

### 1. WAS Runtime

현재 `apps/was`에는 README만 있고 실제 runtime 코드는 없습니다.

구현이 필요한 항목:

- HTTP server framework 선택
- route layout
- request/response schema
- auth/session boundary
- StrataWiki read adapter
- StrataWiki command adapter
- sync-state translation
- cache/error normalization

### 2. Frontend Runtime

현재 `apps/frontend`에도 README만 있고 실제 화면 구현은 없습니다.

구현이 필요한 항목:

- routing
- data fetching strategy
- workspace shell
- list/detail layout
- ask flow
- document detail flow
- calendar flow
- sync state UX

### 3. Ingestion App

현재 `apps/ingestion`은 실행 가능한 runtime baseline 을 가집니다.

이미 구현된 baseline:

- 수동 실행 CLI entrypoint
- env loader / logger / run summary persistence
- dry-run / apply / scheduled / backfill 실행 모드
- WorkNet source -> recruiting proposal -> StrataWiki validate/ingest orchestration

추가로 더 고도화가 필요한 항목:

- production scheduling / backfill 운영 정책
- 장기 실행 daemon 또는 queue 연동
- failure triage 와 observability 확장

### 4. WAS <-> StrataWiki Transport Contract

현재 구조상 가장 중요한 남은 backend 작업은 `Jobs-Wiki` WAS가 `StrataWiki`를 어떤 transport로 호출할지를 고정하는 일입니다.

아직 고정되지 않은 항목:

- HTTP로 감쌀지
- MCP tool surface를 직접 사용할지
- 내부 SDK/adapter를 둘지
- read authority와 command facade를 하나의 transport로 둘지, 논리적으로만 분리할지

### 5. Frontend MVP Slice Lock

문서는 현재 두 방향을 모두 지지하고 있습니다.

- generic workspace MVP
  - `tree`, `document`, `calendar`
- StrataWiki-aligned MVP
  - `ask`, `opportunity detail`, `document detail`, `calendar`

이 둘 중 어떤 것을 "첫 구현 slice"로 고정할지는 아직 결정이 필요합니다.

## What Needs Supplementation

### 1. MVP Prioritization Must Be Sharpened

현재 문서에는 장기 제품 방향은 잘 보이지만, 첫 구현 우선순위는 조금 넓게 퍼져 있습니다.

특히 아래 질문을 먼저 정해야 합니다.

- 첫 메인 진입점이 `Ask Workspace`인지
- 첫 메인 진입점이 `tree/document explorer`인지
- opportunity list/detail을 1차에 넣을지
- graph를 정말 MVP에 포함할지

권장 판단:

- 1차 구현은 `Ask + Opportunity Detail + Document Detail + Calendar`
- `tree`와 `graph`는 candidate contract를 유지하되 구현 우선순위는 낮춤

이유:

- `StrataWiki`의 현재 강점이 personal query / evidence / fact detail에 더 가깝기 때문
- jobs domain 제품에서 opportunity detail이 실제 사용자 가치가 더 즉각적이기 때문
- generic PKM explorer는 read model과 UX scope가 훨씬 넓기 때문

### 2. WAS Contract Must Move from Candidate to Buildable

현재 API 문서는 매우 유용하지만 아직 `candidate` 성격이 강합니다.

웹 서비스를 실제 구현하려면 아래를 고정해야 합니다.

- 첫 구현 endpoint set
- response envelope
- error normalization shape
- projection sync shape
- object ref / document ref / command status shape

즉, 지금부터는 "좋은 방향 문서"에서 한 단계 더 내려와 "바로 라우터를 만들 수 있는 계약"이 필요합니다.

### 3. Opportunity-Centric Read Model Needs Explicit Definition

현재 문서군은 `document`, `tree`, `calendar`, `graph`에는 강하지만,
실제 jobs product에서 중요한 `opportunity list/detail` projection은 상대적으로 약합니다.

보완이 필요한 것:

- opportunity list item shape
- opportunity detail shape
- company summary block
- role block
- evidence / provenance block
- personal answer에서 opportunity deep-link 방식

즉, domain resource와 workspace projection 사이를 이어주는 제품 언어가 조금 더 필요합니다.

### 4. Operational Requirements Need More Concrete Rules

운영 문서는 방향은 잡혀 있지만, 구현 착수용으로는 아직 얇습니다.

보완이 필요한 항목:

- auth strategy
- tenancy / user isolation
- audit scope
- request tracing between frontend, WAS, StrataWiki, ingestion
- retry / timeout / fallback policy
- caching policy for read projections

## Recommended MVP Frame

현재 상황에서 가장 현실적인 첫 웹 서비스 프레임은 아래와 같습니다.

### Primary User Journey

- 사용자가 WorkNet 기반 지식 공간을 연다
- 질문을 던진다
- personalized answer와 evidence를 본다
- 관련 opportunity 또는 company detail로 이동한다
- closing date를 calendar에서 확인한다

### First Read Surfaces

- `workspace summary`
- `ask workspace`
- `opportunity list`
- `opportunity detail`
- `document detail`
- `calendar`

### Deferred Surfaces

- full tree explorer
- full graph explorer
- broad public resource API
- advanced search

이렇게 하면 장기 제품 방향을 훼손하지 않으면서도, 현재 준비된 backend와 domain 자산을 가장 빠르게 살릴 수 있습니다.

## Build Readiness Summary

현재 readiness를 정리하면 아래와 같습니다.

| Area | Status | Notes |
| --- | --- | --- |
| Product direction | Ready | PKM형 workspace + recruiting domain 방향은 충분히 정리됨 |
| StrataWiki integration foundation | Ready | domain pack / proposal ingestion / governance 완료 |
| WorkNet source integration | Ready | normalized provider와 tests 존재 |
| Recruiting domain semantics | Ready | pack + mapper + fixture 존재 |
| WAS runtime | Baseline ready | `apps/was` app, route, test baseline 존재 |
| Frontend runtime | Baseline ready | `apps/frontend` Vite app baseline 존재 |
| Ingestion runtime | Baseline ready | `apps/ingestion` 실행 엔트리와 orchestration 코드 존재 |
| MVP endpoint contract | Partial | candidate 문서는 충분하나 buildable contract는 아직 |
| Opportunity-centric projection | Partial | 필요성은 높지만 명시 contract는 아직 약함 |
| Auth / ops / caching | Partial | 방향 문서는 있으나 실행 규칙은 아직 얇음 |

## Decisions to Lock Before Implementation

웹 서비스 구현 전에 아래 결정을 먼저 고정하는 편이 좋습니다.

1. 첫 MVP 중심 화면
   - `Ask Workspace` 중심인지
   - `tree/document` 중심인지

2. 첫 구현 read contract
   - `ask + opportunity detail + calendar`인지
   - `tree + document + calendar`인지

3. WAS와 StrataWiki transport
   - thin HTTP adapter
   - MCP tool adapter
   - 다른 internal bridge

4. ingestion trigger 방식
   - WAS에서 manual trigger만 둘지
   - ingestion app 독립 실행만 전제할지

5. auth / tenancy baseline
   - single-user MVP인지
   - multi-user isolation을 지금부터 넣을지

## Recommended Next Documentation Work

다음 문서 작업은 아래 순서가 가장 좋습니다.

1. `WAS MVP contract` 문서 추가
   - 실제 구현할 첫 endpoint와 response shape 고정

2. `Opportunity projection` 문서 추가
   - opportunity list/detail, company block, evidence block 정의

3. `Frontend IA for MVP` 문서 추가
   - 첫 화면, 라우팅, 패널 구조, refresh/sync UX 정의

4. `WAS-StrataWiki transport` 문서 추가
   - adapter interface와 호출 방식 고정

## Conclusion

현재 Jobs-Wiki와 StrataWiki는 "웹 서비스를 만들 수 있는 기반"까지는 도달했습니다.
하지만 아직 웹 서비스를 "구현하기 시작할 정도로 contract가 좁혀진 상태"는 아닙니다.

가장 중요한 다음 단계는 새 기능을 많이 추가하는 것이 아니라, 아래 세 가지를 좁히는 것입니다.

- 첫 MVP 사용자 여정
- 첫 WAS read/command contract
- opportunity 중심 projection 언어

이 세 가지가 고정되면, 그 다음부터는 `apps/was`, `apps/frontend`, `apps/ingestion` 구현으로 자연스럽게 넘어갈 수 있습니다.
