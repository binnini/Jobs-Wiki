---
status: draft
---

# UI State Spec

## Purpose

이 문서는 Jobs-Wiki UI가 각 화면에서 어떤 상태를 가져야 하는지 정의합니다.

화면 명세 문서가 `무엇을 보여주는가`를 설명한다면,
이 문서는 `언제 무엇을 보여주지 말아야 하는가`, `어떤 fallback을 보여줘야 하는가`를 고정하는 것이 목적입니다.

이 문서는 특히 아래를 정리합니다.

- 공통 UI state vocabulary
- loading / empty / error / stale 기준
- 선택된 컨텍스트가 없을 때의 fallback
- 화면별 최소 상태 처리 규칙

## Scope

현재 MVP 우선 화면 기준으로 아래를 다룹니다.

- `Onboarding`
- `Extraction Review`
- `Baseline Report`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`
- `Workspace`

## State Vocabulary

### 1. Loading

정의:

- 요청이 시작되었고, 아직 초기 표시 가능한 데이터가 준비되지 않은 상태

원칙:

- 첫 진입 loading과 부분 refresh loading을 구분합니다.
- 전체 화면을 비우는 loading은 첫 진입에만 사용합니다.
- 이미 표시 중인 데이터가 있으면 skeleton보다 `마지막 확인 데이터 + 갱신 중 표시`를 우선합니다.

### 2. Empty

정의:

- 요청은 성공했지만 표시할 데이터가 없는 상태

원칙:

- empty는 error가 아닙니다.
- 사용자가 다음 행동을 선택할 수 있는 CTA를 함께 제공합니다.

### 3. Error

정의:

- 요청이 실패했거나, 현재 화면을 신뢰성 있게 구성할 수 없는 상태

원칙:

- technical error detail을 그대로 노출하지 않습니다.
- 사용자 메시지는 현재 할 수 있는 다음 행동을 포함해야 합니다.
- retry가 가능한 요청이면 `다시 시도` CTA를 둡니다.

### 4. Partial

정의:

- 화면을 구성하는 데이터 일부는 준비되었지만, 일부 블록은 아직 준비되지 않은 상태

원칙:

- 전체 화면을 막지 않습니다.
- 준비된 블록은 먼저 보여주고, 미완료 블록만 placeholder를 둡니다.

### 5. Stale

정의:

- 마지막으로 확인된 데이터를 표시 중이지만 최신 반영 여부를 보장할 수 없는 상태

원칙:

- stale은 숨기지 않고 정직하게 표시합니다.
- 사용자는 지금 보고 있는 데이터가 마지막 확인본이라는 점을 이해할 수 있어야 합니다.

### 6. No Selection

정의:

- 선택된 공고, 문서, 질문 컨텍스트처럼 특정 화면이 기대하는 active context가 아직 없는 상태

원칙:

- error로 처리하지 않습니다.
- 가능한 경우 상위 화면으로 유도하거나, generic fallback context를 제공합니다.

## Sync Visibility Mapping

현재 API 기준의 `sync.visibility`는 UI에서 아래처럼 해석합니다.

| sync value | UI meaning | 기본 처리 |
| --- | --- | --- |
| `applied` | 최신 상태로 간주 가능 | 정상 표시 |
| `pending` | 갱신 중 | 마지막 확인 데이터 유지 + syncing 표시 |
| `partial` | 일부만 최신 | 준비된 블록 우선 표시 |
| `unknown` | 최신성 단정 불가 | last-known data 유지 |
| `stale` | 오래되었을 수 있음 | stale badge/annotation 표시 |

## Global Rules

### Full Screen Blocking Rule

아래 상황에서만 전체 화면 blocking 상태를 허용합니다.

- Onboarding에서 첫 업로드/분석 실행 직후
- Extraction Review에서 첫 추출 결과를 아직 받지 못했을 때
- Baseline Report 첫 진입 시 summary가 전혀 없을 때

그 외에는 전체 blocking보다 partial 또는 stale fallback을 우선합니다.

### Retry Rule

아래 요청은 retry CTA를 가져야 합니다.

- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/calendar`

### Empty Rule

empty state는 항상 다음 둘 중 하나를 포함해야 합니다.

- 다시 탐색하도록 유도하는 CTA
- 입력/설정 수정 CTA

### Last Known Data Rule

이미 성공적으로 받아온 데이터가 있으면,
후속 refresh 실패 시 마지막 성공 데이터를 유지하는 편을 기본으로 합니다.

## Screen-by-Screen States

## 1. Onboarding

### Required States

- `default`
- `file-selected`
- `submitting`
- `validation-error`

### State Rules

- 파일이 아직 없더라도 목표 직무 등 최소 텍스트 입력은 가능해야 합니다.
- 파일 형식이 맞지 않거나 누락 필드가 있으면 submit 전 validation error를 표시합니다.
- `submitting`에서는 CTA를 disabled 처리합니다.

### Empty Interpretation

- onboarding은 empty screen을 두지 않습니다.
- 기본 상태 자체가 입력 대기 상태입니다.

## 2. Extraction Review

### Required States

- `initial-loading`
- `ready`
- `partial`
- `error`

### State Rules

- 핵심 profile field가 준비되지 않으면 `ready`로 취급하지 않습니다.
- 기술/강점 일부가 누락된 경우는 `partial`로 처리할 수 있습니다.
- `error`에서는 onboarding으로 돌아가거나 재시도할 수 있어야 합니다.

## 3. Baseline Report

### Required States

- `initial-loading`
- `ready`
- `partial`
- `empty-recommendations`
- `stale`
- `error`

### Minimum Ready Condition

아래가 있으면 `ready`로 간주할 수 있습니다.

- `profileSnapshot`
- `recommendedOpportunities` 최소 1건 또는 empty explanation

### Partial Conditions

아래는 부분 누락이어도 전체 화면을 열 수 있습니다.

- `marketBrief` 없음
- `skillsGap` 없음
- `actionQueue` 없음
- `askFollowUps` 없음

### Empty Rules

- 추천 공고가 0건이면 `empty-recommendations`입니다.
- 이 경우 프로필 수정 또는 조건 완화 CTA를 제공해야 합니다.

### Error Rules

- summary 전체를 받지 못하면 first load에서는 full error를 허용합니다.
- 이미 last-known summary가 있으면 stale 유지 + refresh failure 표시를 우선합니다.

## 4. Opportunity Detail

### Required States

- `loading`
- `ready`
- `no-selection`
- `not-found`
- `stale`
- `error`
- `scenario-generating`

### No Selection

- 선택된 공고 없이 진입하면 `no-selection` 상태입니다.
- 이 경우 에러 메시지보다 `기본 리포트로 돌아가기`를 우선 보여줍니다.

### Not Found

- `opportunityId`는 있으나 데이터가 없으면 `not-found`입니다.
- 사용자는 추천 공고 목록으로 돌아갈 수 있어야 합니다.

### Scenario Generating

- 면접 시나리오 생성 버튼 클릭 후에는 sidebar-local loading을 사용합니다.
- 상세 화면 전체를 block하지 않습니다.

## 5. Ask Workspace

### Required States

- `empty-context`
- `welcome`
- `submitting`
- `answer-ready`
- `no-evidence`
- `switching-context`
- `stale`
- `error`

### Empty Context

- 선택 공고 없이 진입하면 `empty-context`입니다.
- 이 경우 전체 profile 기반 분석 welcome state를 보여줍니다.

### Welcome

- 첫 model answer가 아직 자동 생성된 intro 상태
- 사용자는 질문 입력 또는 follow-up CTA를 선택할 수 있어야 합니다.

### Submitting

- 새 질문 전송 중
- 기존 대화는 유지
- 입력창과 send CTA만 제한

### No Evidence

- 답변은 생성됐지만 evidence가 비어 있는 경우
- error로 취급하지 않습니다.
- `현재 답변에 직접 연결된 근거가 없습니다` 같은 중립 메시지를 사용합니다.

### Switching Context

- 연관 공고 기준 분석 전환 시에는 기존 화면 전체를 막지 않습니다.
- 새 컨텍스트로 welcome answer를 재구성하거나, context-switched system note를 보여줄 수 있습니다.

### Error

- 첫 질문부터 실패하면 화면 내 error state + retry CTA를 표시합니다.
- 이후 질문 중 실패하면 기존 thread는 유지하고 failed turn만 안내합니다.

## 6. Calendar

### Required States

- `loading`
- `ready`
- `empty`
- `stale`
- `error`

### Empty Rules

- 기간 내 일정이 없으면 `empty`입니다.
- 캘린더 자체를 숨기지 않고, 빈 상태 설명과 다른 기간 보기 CTA를 둡니다.

### Partial Rules

- 월 view와 list view는 같은 source를 쓰므로 별도 partial 분리는 필수는 아닙니다.
- 다만 특정 item detail deep-link가 불가능하면 item 자체는 유지하고 CTA만 disabled 처리할 수 있습니다.

## 7. Workspace

### Required States

- `loading`
- `ready`
- `empty-tree`
- `empty-document`
- `error`

### Empty Tree

- 문서가 하나도 없을 때
- 새 문서 작성 또는 기본 리소스 생성 CTA를 제공합니다.

### Empty Document

- 트리에는 항목이 있지만 아직 선택된 문서가 없을 때
- placeholder pane을 사용합니다.

## State Matrix

| Screen | loading | empty | partial | stale | error | no-selection |
| --- | --- | --- | --- | --- | --- | --- |
| Onboarding | limited | n/a | n/a | n/a | validation only | n/a |
| Extraction Review | yes | n/a | yes | no | yes | n/a |
| Baseline Report | yes | yes | yes | yes | yes | n/a |
| Opportunity Detail | yes | n/a | limited | yes | yes | yes |
| Ask Workspace | yes | yes | yes | yes | yes | yes |
| Calendar | yes | yes | limited | yes | yes | n/a |
| Workspace | yes | yes | limited | n/a | yes | yes |

## Copy Direction

state copy는 아래 원칙을 따릅니다.

- technical error 원인을 그대로 노출하지 않습니다.
- 사용자가 다음에 할 행동을 함께 제시합니다.
- `데이터가 없습니다`, `불러오지 못했습니다`, `마지막으로 확인된 내용을 보여주고 있습니다`처럼 짧고 명확한 표현을 사용합니다.

피하는 표현:

- 내부 시스템 용어 그대로 노출
- stack trace
- provider/raw dependency 이름 직접 노출

## Recommended Next Doc

이 문서 다음으로 가장 필요한 문서는 `frontend-view-model.md`입니다.

이유:

- 지금은 화면과 상태가 정리됐고,
- 다음에는 API field가 각 UI block에 어떻게 매핑되는지 고정해야 하기 때문입니다.
