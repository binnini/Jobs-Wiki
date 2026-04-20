---
status: draft
---

# MVP Requirements Baseline

## Purpose

이 문서는 Jobs-Wiki의 현재 MVP 요구사항 기준선을 한 장으로 고정합니다.

현재 MVP의 중심은 더 이상 `report-first recruiting app`이 아닙니다.
현재 제품 의도는 `PKM knowledge workspace`를 MVP의 주 목표로 두는 쪽에 가깝습니다.

이 문서는 아래 질문에 대해 workspace-first 기준으로 답합니다.

- 이번 MVP에서 반드시 구현해야 하는 것은 무엇인가
- workspace 관점에서 우선 보여야 하는 것은 무엇인가
- LLM은 workspace 안에서 무엇을 해야 하는가
- recruiting vertical은 workspace 안에서 어떤 역할을 하는가

## Scope

현재 baseline은 첫 web MVP를 기준으로 합니다.

현재 이 문서가 고정하는 대상:

- workspace shell
- personal/shared directory split
- personal document CRUD
- core projections
- LLM이 개입하는 주요 사용자 흐름
- recruiting vertical의 역할

현재 이 문서가 고정하지 않는 대상:

- broad multi-user rollout
- final auth/session policy
- enterprise permission model
- long-term automation and collaboration family

## Baseline Decision

현재 첫 구현의 중심은 아래의 `workspace-first knowledge UX`입니다.

- `Workspace Shell`
- `Shared Read-only View`
- `Personal Raw Workspace`
- `Personal Wiki Workspace`
- `Document / Object Detail`
- `Report Projection`
- `Ask Workspace`
- `Calendar Projection`

현재 MVP 원칙:

- 첫 홈은 `workspace shell`
- `shared`는 interpretation layer의 문서형 read-only view
- `personal/raw`는 사용자 원문 작업 공간
- `personal/wiki`는 LLM 재가공 결과 공간
- `report`는 workspace 안의 핵심 projection 중 하나
- `opportunity`는 workspace 안의 핵심 object family
- `Ask`는 workspace context를 증폭하는 LLM surface
- personal 작업은 절대로 상위 layer로 전파되지 않음

## Product Goal

현재 MVP의 목적은 아래를 가능한 짧은 흐름으로 증명하는 것입니다.

- 사용자는 자신의 취업 지식 공간을 하나의 workspace로 탐색할 수 있다
- 사용자는 `shared`와 `personal`을 명확히 구분해 이해할 수 있다
- 사용자는 personal workspace에서 문서를 직접 생성, 수정, 삭제할 수 있다
- 사용자는 raw 문서를 LLM으로 재가공해 personal wiki 문서를 만들 수 있다
- 사용자는 shared 지식을 reference로 삼아 personal knowledge를 축적할 수 있다
- 사용자는 현재 보고 있는 knowledge object와 다음 action을 자연스럽게 이어갈 수 있다

## Primary User Journey

1. 사용자가 프로필과 이력서를 입력한다
2. 시스템이 추출 결과를 보여준다
3. 사용자는 workspace shell로 진입한다
4. 사용자는 `shared`, `personal/raw`, `personal/wiki`를 구분해 본다
5. 사용자는 personal/raw에 문서를 만들거나 업로드한다
6. 사용자는 report, documents, opportunities, calendar 중 하나를 현재 맥락으로 읽는다
7. 사용자는 Ask 또는 explicit LLM action으로 raw 문서를 personal/wiki로 재가공한다
8. 사용자는 이후 결과를 다시 workspace 안에서 이어서 읽고 편집한다

## Routing Baseline

- `/onboarding`
- `/review`
- `/workspace`
- `/documents/:documentId`
- `/opportunities/:opportunityId`
- `/report`
- `/ask`
- `/calendar`

현재 규칙:

- `workspace`는 첫 진입 shell route입니다.
- workspace shell은 최소한 `shared`, `personal/raw`, `personal/wiki`를 구분해 보여줄 수 있어야 합니다.
- `report`, `calendar`, `opportunity detail`, `document detail`은 workspace projection 또는 object detail로 이해합니다.
- `Ask`는 optional query context를 사용합니다.

## Must Have

### M1. Onboarding and Extraction

- 사용자는 목표 직무, 경력 수준, 학력, 선호 지역, 관심 도메인, 추가 설명을 입력할 수 있어야 합니다.
- 사용자는 이력서 또는 포트폴리오 파일을 첨부할 수 있어야 합니다.
- 시스템은 extraction review 단계에서 핵심 profile snapshot을 보여줘야 합니다.

### M2. Workspace Shell

- 사용자는 onboarding 이후 하나의 workspace shell로 진입해야 합니다.
- workspace shell은 현재 보고 있는 projection과 active context를 이해할 수 있게 해야 합니다.
- workspace shell은 최소한 아래 directory 구분을 보여줄 수 있어야 합니다.
  - `shared`
  - `personal/raw`
  - `personal/wiki`

### M3. Workspace Navigation and Reading

- 사용자는 workspace 안의 문서 또는 object 목록을 탐색할 수 있어야 합니다.
- 사용자는 적어도 하나의 navigation model을 통해 현재 지식 공간을 이동할 수 있어야 합니다.
- 사용자는 선택한 문서나 object의 상세 view로 들어갈 수 있어야 합니다.
- 사용자는 현재 보고 있는 문서가 `shared`인지 `personal`인지 구분할 수 있어야 합니다.
- `shared` 문서는 read-only여야 합니다.

### M4. Personal Document CRUD

- 사용자는 personal workspace에서 markdown 문서를 생성할 수 있어야 합니다.
- 사용자는 personal workspace에 PDF를 업로드할 수 있어야 합니다.
- 사용자는 personal workspace 문서를 수정할 수 있어야 합니다.
- 사용자는 personal workspace 문서를 삭제할 수 있어야 합니다.
- 이 CRUD는 `personal`에서만 허용되어야 합니다.
- personal의 변경은 절대로 상위 `Fact`나 `Interpretation` layer를 직접 수정해서는 안 됩니다.

### M5. Report Projection

- 사용자는 onboarding 이후 report projection을 볼 수 있어야 합니다.
- report projection은 아래 블록을 포함해야 합니다.
  - personal snapshot
  - recommended opportunities
  - action queue
  - market brief
  - skills gap
  - ask follow-ups
- 추천 공고는 report projection 안에서 메인 콘텐츠여야 합니다.

### M6. Opportunity Detail

- 사용자는 추천 공고에서 상세 화면으로 이동할 수 있어야 합니다.
- 사용자는 workspace navigation이나 calendar에서도 공고 상세로 이동할 수 있어야 합니다.
- 상세 화면은 제목, 회사 맥락, 직무 요약, 핵심 자격 요건, 지원 판단용 요약을 포함해야 합니다.

### M7. Ask Workspace

- 사용자는 report, document detail, opportunity detail, workspace context에서 Ask로 진입할 수 있어야 합니다.
- Ask는 아래를 함께 제공해야 합니다.
  - structured answer
  - evidence panel
  - related opportunities
  - related documents
  - active context
- Ask는 단순 채팅이 아니라 workspace-connected analysis surface여야 합니다.

### M8. Personal Wiki Generation

- 사용자는 personal/raw 문서를 선택해 LLM 재가공 action을 실행할 수 있어야 합니다.
- LLM은 사용자가 원할 때 아래 작업을 수행할 수 있어야 합니다.
  - 요약
  - 재작성
  - 구조화
  - 링크/관계 부착
  - shared reference를 고려한 wiki 문서화
- 이 결과는 `personal/wiki`에 저장되어야 합니다.
- 이 결과는 상위 `shared` 또는 interpretation layer를 직접 수정하지 않아야 합니다.

### M9. Calendar

- 사용자는 일정 화면을 workspace projection으로 볼 수 있어야 합니다.
- 사용자는 마감일을 list와 grid 양쪽으로 볼 수 있어야 합니다.
- 일정 항목에서 공고 상세로 이동할 수 있어야 합니다.

### M10. LLM Grounding and Personalization

- 시스템은 사용자 입력과 업로드 자료를 profile snapshot 후보로 해석할 수 있어야 합니다.
- Ask answer는 evidence와 함께 제공되어야 합니다.
- Ask answer는 profile-aware 또는 workspace-aware context를 반영할 수 있어야 합니다.
- LLM은 canonical Fact를 직접 publish하지 않아야 합니다.
- LLM은 shared 문서를 reference로 사용할 수 있지만, 결과 기록은 personal layer에만 해야 합니다.

### M11. API-backed Frontend

- frontend는 mock service가 아니라 WAS HTTP API를 통해 데이터를 받아야 합니다.
- frontend는 third-party API나 external backend를 직접 호출하지 않아야 합니다.

### M12. WAS MVP Endpoint Set

- `GET /api/workspace`
- `GET /api/documents/{documentId}`
- `POST /api/documents`
- `PATCH /api/documents/{documentId}`
- `DELETE /api/documents/{documentId}`
- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `POST /api/documents/{documentId}/summarize`
- `POST /api/documents/{documentId}/rewrite`
- `POST /api/documents/{documentId}/link`
- `GET /api/opportunities`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/calendar`

## Functional Requirements

### FR-1 Profile Interpretation

- 시스템은 사용자의 입력과 업로드 파일에서 profile snapshot을 구성할 수 있어야 합니다.

### FR-2 Workspace-first Entry

- onboarding 이후 첫 메인 화면은 workspace shell이어야 합니다.

### FR-3 Shared vs Personal Boundary

- 사용자는 `shared`, `personal/raw`, `personal/wiki`를 directory 수준에서 구분해 이해할 수 있어야 합니다.
- shared는 읽기 전용이어야 합니다.
- personal만 편집 가능해야 합니다.

### FR-4 Personal Authoring

- 사용자는 personal/raw에서 raw 문서를 작성/업로드/수정/삭제할 수 있어야 합니다.
- 사용자는 personal/wiki에서 LLM이 재가공한 문서를 읽고 다시 다듬을 수 있어야 합니다.

### FR-5 Grounded Ask

- Ask answer는 최소한 근거와 연관 공고/문서를 함께 제공해야 합니다.
- Ask는 workspace-connected analysis view로 동작해야 합니다.

### FR-6 Personal Wiki Construction

- raw 문서는 personal/wiki 문서로 재가공될 수 있어야 합니다.
- relation/link가 부착된 personal knowledge note를 만들 수 있어야 합니다.

### FR-7 LLM Authority Boundary

- LLM은 canonical Fact를 직접 authoritative하게 수정하지 않아야 합니다.
- personal layer의 작업은 절대로 상위 layer로 역전파되면 안 됩니다.
- shared는 interpretation layer의 문서형 view로만 취급해야 합니다.

## Acceptance Criteria

1. 사용자가 프로필을 입력하고 workspace shell까지 자연스럽게 도달하는가
2. 사용자가 `shared`, `personal/raw`, `personal/wiki`를 구분해 이해할 수 있는가
3. 사용자가 personal에서 문서를 직접 생성/수정/삭제할 수 있는가
4. opportunity가 workspace 안의 유용한 object/projection으로 읽히는가
5. Ask가 단순 채팅이 아니라 workspace-grounded analysis처럼 느껴지는가
6. raw 문서를 personal/wiki 문서로 재가공할 수 있는가
7. personal 작업이 상위 layer로 전파되지 않는가
