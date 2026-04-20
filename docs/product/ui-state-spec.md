---
status: draft
---

# UI State Spec

## Purpose

이 문서는 Jobs-Wiki UI가 각 화면에서 어떤 상태를 가져야 하는지 정의합니다.

현재 기준은 workspace-first MVP입니다.
따라서 state 처리도 단순 조회 실패가 아니라 아래 경계를 드러내야 합니다.

- `shared`와 `personal`의 차이
- read-only와 writable의 차이
- personal command success와 상위 layer 변경이 다르다는 점
- LLM generation 결과가 personal에만 저장된다는 점

## Scope

현재 MVP 우선 화면 기준으로 아래를 다룹니다.

- `Onboarding`
- `Extraction Review`
- `Workspace Shell`
- `Document Detail`
- `Report Projection`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

## State Vocabulary

### 1. Loading

정의:

- 요청이 시작되었고, 아직 초기 표시 가능한 데이터가 준비되지 않은 상태

원칙:

- 첫 진입 loading과 부분 refresh loading을 구분합니다.
- 이미 표시 중인 데이터가 있으면 전체 skeleton보다 `마지막 확인 데이터 + 갱신 중 표시`를 우선합니다.

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
- retry가 가능하면 `다시 시도` CTA를 둡니다.

### 4. Partial

정의:

- 화면 일부는 준비되었지만 일부 블록은 아직 준비되지 않은 상태

원칙:

- 전체 화면을 막지 않습니다.
- 준비된 블록은 먼저 보여줍니다.

### 5. Stale

정의:

- 마지막으로 확인된 데이터를 표시 중이지만 최신 반영 여부를 보장할 수 없는 상태

원칙:

- stale은 숨기지 않고 표시합니다.

### 6. No Selection

정의:

- 특정 화면이 기대하는 active context가 아직 없는 상태

원칙:

- error로 처리하지 않습니다.
- 상위 탐색 화면이나 generic fallback context로 유도합니다.

### 7. Command Pending

정의:

- create/update/delete/generation 같은 personal command가 진행 중인 상태

원칙:

- read view 전체를 막지 않습니다.
- 대상 문서 또는 액션 단위 progress를 우선합니다.

### 8. Command Applied

정의:

- personal command는 성공했지만, 상위 layer가 바뀌었다고 주장하지 않는 상태

원칙:

- 사용자에게 `personal에 저장됨`을 명시합니다.
- `shared가 업데이트됨` 같은 표현을 사용하지 않습니다.

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

### Read/Write Boundary Rule

- `shared` 화면에서는 편집 가능 상태를 열지 않습니다.
- `personal/raw`, `personal/wiki`에서만 create/update/delete state를 가집니다.
- shared 문서에서 generation action을 실행해도 결과 state는 personal artifact 생성으로만 표시합니다.

### No Upward Propagation Rule

- personal command success는 상위 `Fact` 또는 `Interpretation` layer 변경을 의미하지 않습니다.
- UI copy는 `개인 워크스페이스에 저장되었습니다`처럼 표현해야 합니다.

### Retry Rule

아래 요청은 retry CTA를 가져야 합니다.

- `GET /api/workspace`
- `GET /api/documents/{documentId}`
- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/calendar`

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

- 파일이 없어도 최소 텍스트 입력은 가능해야 합니다.
- `submitting`에서는 CTA를 disabled 처리합니다.

## 2. Extraction Review

### Required States

- `initial-loading`
- `ready`
- `partial`
- `error`

### State Rules

- 핵심 profile field가 준비되지 않으면 `ready`로 취급하지 않습니다.
- 기술/강점 일부 누락은 `partial`로 처리할 수 있습니다.

## 3. Workspace Shell

### Required States

- `initial-loading`
- `ready`
- `empty-personal`
- `partial`
- `stale`
- `error`

### Ready Condition

- 적어도 `shared`, `personal/raw`, `personal/wiki` section label이 보이고
- 하나 이상의 navigation item 또는 empty explanation이 있어야 합니다.

### Empty Personal

- shared 문서는 있지만 personal 문서가 하나도 없는 상태
- `새 노트 만들기`와 `PDF 업로드` CTA를 제공합니다.

### Partial Rules

- shared navigation은 준비됐지만 personal이 비어 있어도 shell은 열 수 있습니다.
- active projection pane만 늦게 도착하면 navigation은 먼저 보여줍니다.

## 4. Document Detail

### Required States

- `loading`
- `ready`
- `no-selection`
- `not-found`
- `stale`
- `error`
- `saving`
- `deleting`
- `generating-wiki`

### Layer Rules

- `shared`
  - `ready-readonly`
  - 편집 입력 상태 없음
- `personal/raw`
  - `editing`
  - `saving`
  - `deleting`
  - `generating-wiki`
- `personal/wiki`
  - `editing`
  - `saving`
  - `deleting`

### Generation Rule

- shared 또는 raw 문서에서 generation을 실행하면 `generating-wiki` 상태를 사용합니다.
- 완료 메시지는 `personal/wiki에 저장됨`이어야 합니다.

## 5. Report Projection

### Required States

- `initial-loading`
- `ready`
- `partial`
- `empty-recommendations`
- `stale`
- `error`

### Minimum Ready Condition

- `profileSnapshot`
- `recommendedOpportunities` 최소 1건 또는 empty explanation

## 6. Opportunity Detail

### Required States

- `loading`
- `ready`
- `no-selection`
- `not-found`
- `stale`
- `error`

### State Rules

- 선택된 공고 없이 진입하면 `no-selection`
- `opportunityId`는 있으나 데이터가 없으면 `not-found`

## 7. Ask Workspace

### Required States

- `empty-context`
- `welcome`
- `submitting`
- `answer-ready`
- `no-evidence`
- `switching-context`
- `stale`
- `error`
- `saving-to-personal`

### Context Rules

- 선택 문서 없이 진입하면 `empty-context` 또는 workspace-level welcome
- `documentId` 또는 `opportunityId`가 있으면 active context indicator를 보여야 합니다.

### Saving Rule

- Ask 결과를 저장할 때는 `saving-to-personal` 상태를 사용합니다.
- 저장 완료 copy는 `personal/wiki에 저장됨` 또는 `personal/raw에 초안으로 저장됨`처럼 personal target을 명시합니다.

## 8. Calendar

### Required States

- `loading`
- `ready`
- `empty`
- `stale`
- `error`

### Empty Rules

- 기간 내 일정이 없으면 `empty`
- 다른 기간 보기 CTA를 제공합니다.

## State Matrix

| Screen | loading | empty | partial | stale | error | no-selection | command |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Onboarding | limited | n/a | n/a | n/a | validation only | n/a | submit |
| Extraction Review | yes | n/a | yes | no | yes | n/a | no |
| Workspace Shell | yes | yes | yes | yes | yes | n/a | no |
| Document Detail | yes | yes | limited | yes | yes | yes | yes |
| Report Projection | yes | yes | yes | yes | yes | n/a | no |
| Opportunity Detail | yes | n/a | limited | yes | yes | yes | no |
| Ask Workspace | yes | yes | yes | yes | yes | yes | save |
| Calendar | yes | yes | limited | yes | yes | n/a | no |

## Copy Direction

- technical error 원인을 그대로 노출하지 않습니다.
- `shared`에는 편집할 수 없음을 짧고 명확하게 알립니다.
- personal command 성공 메시지는 항상 personal 저장임을 드러냅니다.
- 상위 레이어 변경을 암시하는 표현은 피합니다.

피하는 표현:

- `공유 지식이 업데이트되었습니다`
- `해석 레이어에 반영되었습니다`
- 내부 provider/raw dependency 이름 직접 노출
