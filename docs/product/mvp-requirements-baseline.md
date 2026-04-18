---
status: draft
---

# MVP Requirements Baseline

## Purpose

이 문서는 Jobs-Wiki의 현재 MVP 요구사항 기준선을 한 장으로 고정합니다.

기존 문서들은 장기 제품 방향, 화면 구조, API 계약, 아키텍처 경계를 각각 잘 설명하고 있습니다.
하지만 실제 구현을 시작하려면 아래 질문에 대한 단일 답이 필요합니다.

- 이번 MVP에서 반드시 구현해야 하는 것은 무엇인가
- 지금은 의도적으로 미루는 것은 무엇인가
- 첫 사용자 여정은 무엇인가
- 어떤 화면과 endpoint를 MVP 성공 기준으로 볼 것인가

이 문서는 그 기준을 좁게 정리합니다.

## Scope

현재 baseline은 첫 web MVP를 기준으로 합니다.

현재 이 문서가 고정하는 대상:

- 사용자 첫 진입 경험
- 핵심 화면
- 핵심 기능
- 첫 구현 slice의 must/should/won't

현재 이 문서가 고정하지 않는 대상:

- 장기 PKM 전체 기능
- graph/tree full explorer
- auth/session 최종 정책
- multi-user product rollout
- broad public API family

## Baseline Decision

현재 첫 구현의 중심은 `generic PKM explorer`가 아니라 아래 흐름으로 둡니다.

- `Onboarding`
- `Extraction Review`
- `Baseline Report`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

즉, 현재 MVP는 아래 원칙을 따릅니다.

- 첫 홈은 `기본 리포트`입니다.
- `추천 공고`가 메인 콘텐츠입니다.
- `Ask`는 리포트를 확장하는 심층 분석 surface입니다.
- `Opportunity Detail`은 지원 판단용 detail shell입니다.
- `Calendar`는 마감 일정 확인용 read surface입니다.
- `Workspace`는 유지하지만 1차 구현 우선순위는 낮습니다.

## Product Goal

현재 MVP의 목적은 아래를 가능한 짧은 흐름으로 증명하는 것입니다.

- 사용자가 자신의 프로필을 입력하거나 업로드할 수 있다
- 시스템이 그 프로필을 구조화해 보여줄 수 있다
- 사용자는 자신과 관련 있는 공고를 빠르게 이해할 수 있다
- 사용자는 공고를 단순 열람하는 것이 아니라, 왜 관련 있는지와 무엇을 해야 하는지까지 알 수 있다
- 사용자는 질문을 던지고, 근거와 함께 follow-up 분석을 받을 수 있다
- 사용자는 마감 일정을 확인하고 다음 행동으로 이어갈 수 있다

## Current User Baseline

현재 MVP의 기본 사용자 가정은 아래와 같습니다.

- 1차 사용자: 구직자
- 현재 baseline: single-user-first 또는 mock-user-first
- auth/session은 최종 확정 대상이 아니라 deferred concern

즉, 현재 구현은 multi-user SaaS 완성보다 `사용자 1명이 실제로 가치 있는 흐름을 밟을 수 있는가`를 먼저 검증합니다.

## Primary User Journey

현재 MVP에서 가장 중요한 사용자 여정은 아래와 같습니다.

1. 사용자가 프로필과 이력서를 입력한다
2. 시스템이 추출 결과를 보여준다
3. 사용자는 기본 리포트에서 추천 공고와 액션을 본다
4. 사용자는 공고 상세로 들어가 지원 판단에 필요한 정보를 확인한다
5. 사용자는 Ask에서 자신의 경험과 공고의 연결 방식을 더 깊게 질문한다
6. 사용자는 Calendar에서 마감 일정을 확인한다

## Routing Baseline

현재 MVP route baseline은 아래처럼 둡니다.

- `/onboarding`
- `/review`
- `/report`
- `/opportunities/:opportunityId`
- `/ask`
- `/calendar`

현재 규칙:

- `Ask`는 별도 route를 쪼개지 않고 optional query context를 사용합니다.
- 선택 공고가 있는 Ask 진입은 `/ask?opportunityId=...` 형태를 사용합니다.
- `Workspace`, `tree`, `graph`, `document detail` route는 현재 필수 route set에 포함하지 않습니다.

## Must / Should / Won't

## Must Have

### M1. Onboarding and Extraction

- 사용자는 목표 직무, 경력 수준, 학력, 선호 지역, 관심 도메인, 추가 설명을 입력할 수 있어야 합니다.
- 사용자는 이력서 또는 포트폴리오 파일을 첨부할 수 있어야 합니다.
- 시스템은 extraction review 단계에서 핵심 profile snapshot을 보여줘야 합니다.

### M2. Baseline Report

- 사용자는 onboarding 직후 기본 리포트를 보아야 합니다.
- 기본 리포트는 아래 블록을 포함해야 합니다.
  - personal snapshot
  - recommended opportunities
  - action queue
  - market brief
  - skills gap
  - ask follow-ups
- 추천 공고는 항상 메인 콘텐츠여야 합니다.

### M3. Opportunity Detail

- 사용자는 추천 공고에서 상세 화면으로 이동할 수 있어야 합니다.
- 상세 화면은 아래 정보를 포함해야 합니다.
  - 제목
  - 회사 맥락
  - 직무 요약
  - 핵심 자격 요건
  - 지원 판단용 요약
- 상세 화면의 안정적인 분석 데이터는 read payload로 제공하는 것을 우선합니다.
  - 예: 적합도 점수, 강점 요약, 리스크 요약
- 생성형 follow-up 분석은 Opportunity Detail의 필수 책임으로 두지 않고 Ask 진입으로 넘깁니다.

### M4. Ask Workspace

- 사용자는 리포트 또는 공고 상세에서 Ask로 진입할 수 있어야 합니다.
- Ask는 아래를 함께 제공해야 합니다.
  - structured answer
  - evidence panel
  - related opportunities
  - active context
- Ask는 선택 공고 없이도 동작할 수 있어야 합니다.
- Ask는 선택 공고가 있으면 그 공고 중심으로 답변할 수 있어야 합니다.
- 현재 route baseline에서는 Ask 공고 컨텍스트를 optional query parameter로 전달합니다.
- `save`는 현재 MVP의 사용자-facing 필수 요구사항이 아닙니다.
  - request field로는 남길 수 있지만, 실제 저장 보장은 이번 slice 범위 밖입니다.

### M5. Calendar

- 사용자는 일정 화면에서 마감일을 list와 grid 양쪽으로 볼 수 있어야 합니다.
- 일정 항목에서 공고 상세로 이동할 수 있어야 합니다.

### M6. API-backed Frontend

- frontend는 mock service가 아니라 WAS HTTP API를 통해 데이터를 받아야 합니다.
- frontend는 third-party API나 external backend를 직접 호출하지 않아야 합니다.

### M7. WAS MVP Endpoint Set

현재 MVP 필수 endpoint는 아래 다섯 개입니다.

- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/calendar`

## Should Have

- 리포트 저장 CTA
- 연관 공고 비교 entry
- 공고 상세에서 Ask로 이어지는 CTA
- Ask 내 후속 분석 제안
- partial/stale 상태 노출

## Won't Have in This Slice

- full tree explorer
- full graph explorer
- advanced search
- document detail full flow
- user-authored planning object
- broad command family
- durable ingestion orchestration
- collaboration / notification / recommendation automation

## Functional Requirements

## FR-1 Profile Interpretation

- 시스템은 사용자의 입력과 업로드 파일에서 profile snapshot을 구성할 수 있어야 합니다.
- 사용자는 extraction review에서 시스템 해석 결과를 확인할 수 있어야 합니다.

## FR-2 Report-first Entry

- onboarding 이후 첫 메인 화면은 기본 리포트여야 합니다.
- 리포트는 추천 공고와 다음 액션을 중심으로 구성되어야 합니다.

## FR-3 Opportunity Understanding

- 사용자는 추천 공고의 상세 정보를 읽고 지원 판단을 할 수 있어야 합니다.
- 사용자는 공고와 회사 맥락을 분리하지 않고 함께 이해할 수 있어야 합니다.

## FR-4 Grounded Ask

- Ask answer는 최소한 근거와 연관 공고를 함께 제공해야 합니다.
- Ask는 단순 채팅창이 아니라 report-connected analysis view로 동작해야 합니다.

## FR-5 Deadline Awareness

- 사용자는 마감 일정을 독립적인 view에서 확인할 수 있어야 합니다.
- 일정은 실제 행동 우선순위에 영향을 줄 수 있어야 합니다.

## FR-6 Honest Sync UX

- command success와 read visibility는 같은 의미가 아니어야 합니다.
- stale/partial/unknown 같은 상태는 숨기지 않고 정직하게 노출할 수 있어야 합니다.

## Backend/System Requirements

## BR-1 WAS-only Boundary

- frontend는 WAS만 호출합니다.
- WAS는 external dependency의 raw shape를 직접 노출하지 않습니다.

## BR-2 Read-first MVP

- 현재 MVP는 read path 우선입니다.
- edit/command flow는 skeleton 또는 deferred로 유지할 수 있습니다.

## BR-3 Adapter-based Integration

- WAS는 mock mode와 real mode를 adapter layer로 전환할 수 있어야 합니다.
- route/service는 concrete provider를 직접 알지 않아야 합니다.

## BR-4 Projection-first API

- API는 canonical entity naming보다 사용자-facing projection naming을 우선합니다.
- `opportunity`, `workspace_summary`, `ask`, `calendar` 같은 projection contract를 사용합니다.

## Acceptance Criteria

현재 MVP는 아래 질문에 "예"라고 답할 수 있으면 기준을 충족합니다.

1. 사용자가 프로필을 입력하고 기본 리포트까지 자연스럽게 도달하는가
2. 기본 리포트만으로 추천 공고와 다음 행동이 이해되는가
3. 공고 상세에서 지원 판단에 필요한 정보가 충분히 보이는가
4. Ask가 단순 채팅이 아니라 근거 기반 분석처럼 느껴지는가
5. Calendar가 실제 행동 우선순위를 바꾸는 정보로 작동하는가
6. frontend가 실제 WAS endpoint를 사용하도록 연결될 수 있는가

## Out of Scope Clarification

아래는 제품 방향상 중요하지만 현재 MVP 완료의 기준으로 삼지 않습니다.

- PKM full explorer
- graph UX
- general workspace command UX
- multi-user auth 완성
- 운영 자동화 및 ingestion scheduling

## Relationship to Other Docs

이 문서는 아래 문서 위에서 현재 MVP 요구사항만 좁게 고정합니다.

- `docs/product/vision.md`
- `docs/product/scope.md`
- `docs/product/ui-screen-spec.md`
- `docs/product/ui-state-spec.md`
- `docs/api/mvp-api-baseline.md`
- `docs/architecture/web-service-requirements-analysis.md`

현재 구현과 리뷰에서는 이 문서를 우선 baseline으로 삼고,
장기 방향이나 세부 rationale이 필요할 때만 상위 문서로 이동하는 것을 권장합니다.
