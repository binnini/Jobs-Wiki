---
status: draft
---

# Frontend Routing Baseline

## Purpose

이 문서는 Jobs-Wiki frontend의 현재 MVP 라우팅 기준선을
workspace-first 기준으로 고정합니다.

현재 목적:

- workspace-first MVP 흐름에 맞는 최소 route set을 명확히 정리
- 화면 진입 경로와 URL anchor를 구현 전에 합의
- target MVP route와 current implemented slice를 혼동하지 않도록 함

## Scope

현재 baseline은 첫 web MVP를 기준으로 합니다.

현재 문서가 고정하는 것:

- primary route set
- path parameter와 query parameter 사용 규칙
- Ask의 optional context 규칙

현재 문서가 고정하지 않는 것:

- auth-aware route guard
- nested workspace routing
- graph full routing
- final public URL versioning

## Current Routing Principle

현재 MVP는 `workspace-first` 흐름을 기준으로 합니다.

즉:

- 첫 진입 흐름은 onboarding/review/workspace로 이어집니다.
- 메인 제품 홈은 `workspace`입니다.
- `report`, `document`, `opportunity`, `calendar`는 workspace 안의 projection 또는 object detail입니다.
- `Ask`는 별도 화면이지만, 선택 컨텍스트를 optional query로 받을 수 있습니다.

## Route Set

현재 MVP route baseline은 아래처럼 둡니다.

- `/onboarding`
- `/review`
- `/workspace`
- `/documents/:documentId`
- `/report`
- `/opportunities/:opportunityId`
- `/ask`
- `/calendar`

## Route Semantics

### `/onboarding`

- 역할: 프로필 입력과 파일 업로드
- 종료: `/review`

### `/review`

- 역할: extraction review
- 종료: `/workspace`

### `/workspace`

- 역할: workspace shell
- 메인 콘텐츠: 현재 active projection과 navigation
- 최소 navigation 구분:
  - `shared`
  - `personal/raw`
  - `personal/wiki`
- 규칙:
  - `shared`는 read-only
  - `personal/*`만 편집 가능
  - personal 편집 결과는 상위 layer로 전파되지 않음

### `/documents/:documentId`

- 역할: 문서 또는 generic knowledge object detail
- 진입:
  - workspace navigation
  - ask related document
- 규칙:
  - `shared` 문서 detail은 읽기 전용
  - `personal/raw`와 `personal/wiki` detail은 편집 가능할 수 있음
  - shared 문서에서의 LLM action은 personal 쪽 artifact 생성 흐름으로 연결하는 편이 맞음

### `/report`

- 역할: baseline report projection
- 진입: workspace 안의 report entry 또는 재진입

### `/opportunities/:opportunityId`

- 역할: 단일 공고 상세
- 진입:
  - report 추천 공고 카드
  - ask 연관 공고
  - calendar 일정 항목
  - workspace navigation

### `/ask`

- 역할: workspace-connected analysis workspace
- query parameter:
  - `opportunityId?`
  - `documentId?`

규칙:

- query가 없으면 전체 workspace/profile 기반 분석으로 엽니다.
- `opportunityId`가 있으면 해당 공고 중심 컨텍스트로 엽니다.
- `documentId`가 있으면 해당 문서 중심 컨텍스트로 엽니다.

예시:

- `/ask`
- `/ask?opportunityId=opp_toss_core_backend`
- `/ask?documentId=doc_strategy_note_1`

### `/calendar`

- 역할: 마감 일정 확인
- 진입: workspace 재진입 또는 report 후속 CTA

## Deferred Routes

현재 문서 기준으로 아래 route들은 공식 MVP route set에 포함하지 않습니다.

- `/tree`
- `/graph`
- `/search`

이 route들은 workspace-first MVP의 후속 확장 route로 남겨두는 편이 맞습니다.

## Relationship to Other Docs

- `docs/product/mvp-requirements-baseline.md`
- `docs/product/ui-screen-spec.md`
- `docs/architecture/frontend.md`

현재 frontend 구현에서는 이 문서를 route baseline으로 우선 사용하고,
세부 nested routing은 후속 IA 문서에서 확장하는 것을 권장합니다.
