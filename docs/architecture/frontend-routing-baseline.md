---
status: draft
---

# Frontend Routing Baseline

## Purpose

이 문서는 Jobs-Wiki frontend의 현재 MVP 라우팅 기준선을 고정합니다.

현재 목적:

- report-first MVP 흐름에 맞는 최소 route set을 명확히 정리
- 화면 진입 경로와 URL anchor를 구현 전에 합의
- long-term workspace route와 current MVP route를 혼동하지 않도록 함

## Scope

현재 baseline은 첫 web MVP를 기준으로 합니다.

현재 문서가 고정하는 것:

- primary route set
- path parameter와 query parameter 사용 규칙
- Ask의 optional opportunity context 규칙

현재 문서가 고정하지 않는 것:

- auth-aware route guard
- nested workspace routing
- document/tree/graph full routing
- final public URL versioning

## Current Routing Principle

현재 MVP는 `report-first` 흐름을 기준으로 합니다.

즉:

- 첫 진입 흐름은 onboarding/review/report로 이어집니다.
- 메인 제품 홈은 `report`입니다.
- `Ask`는 별도 화면이지만, 선택 공고 컨텍스트를 optional query로 받습니다.
- `Opportunity Detail`은 path parameter를 사용하는 detail route입니다.
- `Calendar`는 독립 read surface입니다.

## Route Set

현재 MVP route baseline은 아래처럼 둡니다.

- `/onboarding`
- `/review`
- `/report`
- `/opportunities/:opportunityId`
- `/ask`
- `/calendar`

## Route Semantics

### `/onboarding`

- 역할: 프로필 입력과 파일 업로드
- 진입: 첫 진입 또는 새 세션 시작
- 종료: `/review`

### `/review`

- 역할: extraction review
- 진입: onboarding 완료 후
- 종료: `/report`

### `/report`

- 역할: baseline report 홈
- 진입: review 완료 후 또는 사이드바 재진입
- 메인 콘텐츠: recommended opportunities

### `/opportunities/:opportunityId`

- 역할: 단일 공고 상세
- path parameter:
  - `opportunityId`
- 진입:
  - report 추천 공고 카드
  - ask 연관 공고
  - calendar 일정 항목

### `/ask`

- 역할: report-connected analysis workspace
- query parameter:
  - `opportunityId?`

규칙:

- `opportunityId`가 없으면 전체 profile/workspace 기반 분석으로 엽니다.
- `opportunityId`가 있으면 해당 공고 중심 컨텍스트로 엽니다.
- `Ask`는 route를 새로 만들기보다 query로 컨텍스트를 바꾸는 편을 우선합니다.

예시:

- `/ask`
- `/ask?opportunityId=opp_toss_core_backend`

### `/calendar`

- 역할: 마감 일정 확인
- 진입: 사이드바 재진입 또는 report 후속 CTA

## Deferred Routes

현재 문서 기준으로 아래 route들은 공식 MVP route set에 포함하지 않습니다.

- `/workspace`
- `/documents/:documentId`
- `/tree`
- `/graph`
- `/search`

이 route들은 장기 PKM/workspace 방향 문서에는 남겨둘 수 있지만,
현재 첫 구현 slice의 필수 라우팅으로 보지 않습니다.

## Relationship to Other Docs

이 문서는 아래 문서와 함께 봅니다.

- `docs/product/mvp-requirements-baseline.md`
- `docs/product/ui-screen-spec.md`
- `docs/architecture/frontend.md`

현재 frontend 구현에서는 이 문서를 현재 route baseline으로 우선 사용하고,
장기 workspace routing은 상위 방향 문서에서 별도로 검토하는 것을 권장합니다.
