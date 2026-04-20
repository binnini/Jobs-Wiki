---
status: draft
---

# UI Screen Spec

## Purpose

이 문서는 Jobs-Wiki의 현재 UI를 화면 단위로 명세합니다.

현재 기준은 `PKM workspace-first MVP`입니다.
따라서 각 화면은 recruiting report를 보여주는 데 그치지 않고,
사용자가 `shared`와 `personal`을 구분하며 자신의 knowledge workspace를 운영하는 흐름을 중심으로 설명합니다.

이 문서는 target MVP screen set을 우선 설명합니다.
현재 실제 구현은 이보다 좁고, `Report Projection`, `Opportunity Detail`, `Ask Workspace`, `Calendar` 중심의 recruiting vertical slice가 더 앞서 있습니다.
`Workspace Shell`과 `Document Detail`은 이번 기준선에서 MVP로 승격되었지만, 구현은 follow-up이 남아 있습니다.

이 문서는 아래를 고정합니다.

- 각 화면의 역할
- 사용자가 이 화면에서 해결해야 하는 질문
- 어떤 데이터가 필요한지
- 어떤 CTA가 필요한지
- 어떤 화면으로 이어지는지
- 어떤 레이어 경계를 사용자에게 드러내야 하는지

## Current Flow

현재 기준 화면 흐름은 아래와 같습니다.

1. `Onboarding`
2. `Extraction Review`
3. `Workspace Shell`
4. `Document Detail`
5. `Report Projection`
6. `Opportunity Detail`
7. `Ask Workspace`
8. `Calendar`

현재 우선 구현 slice는 아래 화면입니다.

- `Workspace Shell`
- `Document Detail`
- `Report Projection`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

아래 화면은 supporting flow로 유지합니다.

- `Onboarding`
- `Extraction Review`

## Screen Inventory

| Screen | Role | Priority |
| --- | --- | --- |
| Onboarding | 사용자 입력 수집 | Secondary |
| Extraction Review | 추출 결과 확인 | Secondary |
| Workspace Shell | main home / directory navigation | Primary |
| Document Detail | shared/personal 문서 읽기와 편집 | Primary |
| Report Projection | workspace 안의 report view | Primary |
| Opportunity Detail | workspace 안의 recruiting object detail | Primary |
| Ask Workspace | context-aware analysis and generation | Primary |
| Calendar | workspace projection for time-based navigation | Primary |

## Global UX Rules

- `shared`는 interpretation layer의 문서형 read-only view입니다.
- `personal/raw`는 사용자가 직접 작성하거나 업로드한 원문 공간입니다.
- `personal/wiki`는 LLM이 raw 문서를 재가공한 personal artifact 공간입니다.
- create/update/delete는 `personal/*`에서만 허용됩니다.
- shared 문서에서의 요약/재작성/link action은 personal artifact 생성 흐름이어야 합니다.
- personal 작업은 절대로 상위 `Fact` 또는 `Interpretation` layer로 전파되지 않습니다.

## 1. Onboarding

### Role

- 사용자의 기본 프로필과 입력 소스를 수집합니다.
- 이후 workspace를 구성하는 최소 입력을 확보합니다.

### User Questions

- 무엇을 입력해야 하는가
- 이 시스템은 입력된 정보를 가지고 무엇을 해주는가

### Entry

- 첫 진입
- 새 프로필 시작

### Required Input

- 목표 직무
- 경력 수준
- 최종 학력
- 선호 지역
- 관심 산업/도메인
- 이력서/포트폴리오 파일
- 추가 목표 / 고려 사항

### Main Blocks

- 서비스 소개 / 기대 결과 설명
- 업로드 영역
- 구조화 입력 폼
- 분석 시작 CTA

### Primary CTA

- `프로필 분석 시작하기`

### Exit

- `Extraction Review`

## 2. Extraction Review

### Role

- 문서와 입력값에서 추출된 profile snapshot을 확인합니다.
- workspace 진입 전에 시스템 해석을 검토합니다.

### User Questions

- 시스템이 나를 어떻게 해석했는가
- 이대로 workspace를 시작해도 되는가

### Entry

- `Onboarding` 완료 직후

### Required Data

- 목표 직무
- 경력 수준
- 식별된 기술
- 도출된 강점
- 분석 신뢰도

### Main Blocks

- 추출 결과 요약 헤더
- 핵심 프로필 필드
- 보유 기술 chip list
- 핵심 강점 목록
- 수정 CTA / 승인 CTA

### Primary CTA

- `확인 완료 및 워크스페이스 시작하기`

### Exit

- `Workspace Shell`

## 3. Workspace Shell

### Role

- 제품의 첫 메인 홈입니다.
- 사용자가 현재 knowledge space의 구조와 active context를 파악하게 합니다.
- `shared`, `personal/raw`, `personal/wiki`를 한 화면 안에서 탐색하게 합니다.

### User Questions

- 지금 이 워크스페이스에는 어떤 자료가 있는가
- 어떤 것이 shared reference이고, 어떤 것이 내 작업물인가
- 어디서 새 문서를 만들고, 어디서 기존 문서를 이어서 작업하는가

### Entry

- `Extraction Review` 완료 직후
- 사이드바 또는 상단 navigation 재진입

### Required Data

- `GET /api/workspace`
- 필요 시 현재 active projection용
  - `GET /api/workspace/summary`
  - `GET /api/documents/{documentId}`
  - `GET /api/opportunities/{opportunityId}`
  - `GET /api/calendar`

### Main Blocks

- workspace header
- current active context
- directory navigation
  - `shared`
  - `personal/raw`
  - `personal/wiki`
- active projection pane
- quick actions

### Primary CTA

- `새 노트 만들기`
- `PDF 업로드`
- `문서 열기`

### Secondary CTA

- `리포트 보기`
- `심층 분석 열기`
- `캘린더 보기`

### Exit

- `Document Detail`
- `Report Projection`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

## 4. Document Detail

### Role

- shared 또는 personal 문서를 읽는 기본 문서 화면입니다.
- 문서의 레이어, 편집 가능 여부, 연관 객체, LLM 액션을 드러냅니다.

### User Questions

- 이 문서는 shared reference인가, personal working note인가
- 지금 이 문서를 직접 수정할 수 있는가
- 이 문서를 Ask나 wiki generation으로 어떻게 이어갈 수 있는가

### Entry

- `Workspace Shell` navigation
- `Ask Workspace` related document
- `Opportunity Detail` related document

### Required Data

- `GET /api/documents/{documentId}`

### Main Blocks

- document header
- layer indicator
- body surface
- metadata block
- related objects
- document actions

### Action Rules By Layer

- `shared`
  - 읽기 전용
  - 허용 액션: `Ask로 열기`, `personal/raw로 복제`, `요약해서 personal/wiki 만들기`, `재작성해서 personal/wiki 만들기`, `링크 제안 받기`
- `personal/raw`
  - 편집 가능
  - 허용 액션: `수정`, `삭제`, `Ask로 열기`, `요약`, `재작성`, `wiki로 변환`
- `personal/wiki`
  - 편집 가능
  - 허용 액션: `수정`, `삭제`, `링크 보강`, `Ask로 열기`

### Primary CTA

- `편집하기` 또는 `요약해서 Wiki 만들기`

### Secondary CTA

- `심층 분석 열기`
- `연관 객체 보기`

### Exit

- `Workspace Shell`
- `Ask Workspace`
- `Opportunity Detail`

## 5. Report Projection

### Role

- workspace 안에서 현재 상황과 추천 행동을 한 번에 읽는 report view입니다.
- 더 이상 제품 전체의 단일 홈이 아니라, workspace 안의 핵심 projection입니다.

### User Questions

- 시스템이 내 프로필을 어떻게 이해했는가
- 지금 어떤 공고가 중요한가
- 내가 무엇부터 해야 하는가

### Entry

- `Workspace Shell`
- 사이드바에서 `리포트`

### Required Data

- `GET /api/workspace/summary`
- 필요 시 `GET /api/opportunities`

### Main Blocks

- hero summary
- personal snapshot
- recommended opportunities
- action queue
- market brief
- skills gap
- ask follow-up entry

### Main Content Rule

- 가장 큰 메인 블록은 `추천 공고`입니다.
- 이 화면은 shared와 personal context를 함께 읽지만, 직접 편집 surface는 아닙니다.

### Primary CTA

- 공고 카드의 `상세 보기`
- 액션 큐의 `심층 분석하기`

### Secondary CTA

- `워크스페이스로 돌아가기`
- `캘린더 보기`

### Exit

- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`
- `Workspace Shell`

## 6. Opportunity Detail

### Role

- 단일 공고를 workspace 안의 object detail로 읽는 화면입니다.
- 공고 내용, 회사 맥락, 적합도 분석, 연관 문서를 함께 제공합니다.

### User Questions

- 이 공고는 어떤 역할과 환경을 의미하는가
- 왜 나와 맞는가
- 어떤 personal 문서와 연결해서 생각해야 하는가

### Entry

- `Report Projection` 추천 공고 카드
- `Calendar` 일정 항목
- `Ask Workspace` 연관 공고
- `Workspace Shell` navigation

### Required Data

- `GET /api/opportunities/{opportunityId}`

### Main Blocks

- 공고 헤더
- 기업 및 도메인 컨텍스트
- 직무 요약
- 핵심 자격 요건
- 적합도 분석
- evidence
- related documents

### Primary CTA

- `이 공고로 심층 분석하기`
- `관련 문서 열기`

### Secondary CTA

- `워크스페이스에서 이어서 보기`
- `리포트로 돌아가기`

### Exit

- `Ask Workspace`
- `Document Detail`
- `Workspace Shell`

## 7. Ask Workspace

### Role

- workspace-connected analysis와 personal wiki generation의 진입점입니다.
- 질문, 답변, 근거, 연관 문서/공고, explicit save/generation action을 함께 다룹니다.

### User Questions

- 이 문서를 어떻게 정리하면 좋은가
- 내 경험을 어떻게 더 설득력 있게 연결할 수 있는가
- shared reference를 참고해 personal wiki를 어떻게 만들 수 있는가

### Entry

- `Report Projection`
- `Opportunity Detail`
- `Document Detail`
- `Workspace Shell`

### Required Data

- `POST /api/workspace/ask`
- optional context:
  - `documentId`
  - `opportunityId`

### Required Interaction Rule

- 컨텍스트 없이 들어올 수 있습니다.
- 문서 컨텍스트가 있으면 해당 문서 중심 분석을 우선합니다.
- 공고 컨텍스트가 있으면 해당 공고 중심 분석을 우선합니다.
- answer는 최소한 `answer`, `evidence`, `related documents`, `related opportunities`를 보여줄 수 있어야 합니다.
- 결과 저장은 personal layer로만 이어져야 합니다.

### Main Blocks

- active context header
- main answer panel
- evidence panel
- related documents
- related opportunities
- follow-up actions

### Primary CTA

- `질문 전송`
- `이 결과를 Personal Wiki로 저장`

### Secondary CTA

- `관련 문서 열기`
- `관련 공고 상세 보기`
- `문서 재작성`

### Exit

- `Document Detail`
- `Opportunity Detail`
- `Workspace Shell`

## 8. Calendar

### Role

- 공고 마감 일정을 시간 순서로 확인하는 workspace projection입니다.

### User Questions

- 어떤 공고가 가장 먼저 마감되는가
- 어떤 일정이 지금 행동 우선순위를 바꾸는가

### Entry

- `Workspace Shell`
- `Report Projection`

### Required Data

- `GET /api/calendar`

### Main Blocks

- 화면 헤더
- view mode toggle
- timeline list
- monthly calendar grid

### Primary CTA

- 일정 항목 `상세 보기`

### Exit

- `Opportunity Detail`
- `Workspace Shell`

## Navigation Rules

현재 1차 navigation은 아래처럼 둡니다.

- `Workspace`
- `Report`
- `Ask`
- `Calendar`

규칙:

- `Workspace`가 기본 홈입니다.
- `Report`는 workspace projection입니다.
- `Ask`는 별도 화면이지만 항상 workspace context 안에서 동작해야 합니다.
- `shared`와 `personal`은 navigation 또는 breadcrumb 수준에서 명시적으로 보여야 합니다.

## CTA Discipline

각 화면의 CTA는 아래 규칙을 따릅니다.

- 한 화면의 primary CTA는 1~2개를 넘기지 않습니다.
- shared 화면에서 직접 편집 CTA를 노출하지 않습니다.
- shared에서의 생성형 CTA는 personal artifact 생성 문구를 사용합니다.
- `상세 보기`, `편집하기`, `요약해서 Wiki 만들기`, `심층 분석하기`처럼 행동이 분명한 문구를 우선합니다.

## Out of Scope for This Doc

- component 단위 설계
- 세부 스타일 규칙
- loading / empty / error / stale 상태 매트릭스
- field-level API mapping 표

## Recommended Next Docs

이 문서 다음으로 같이 봐야 하는 문서:

1. `ui-state-spec.md`
2. `frontend-view-model.md`
3. `api/mvp-api-baseline.md`
