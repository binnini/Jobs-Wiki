---
status: draft
---

# Workspace-first Implementation Backlog

## Purpose

이 문서는 새로 정리한 `workspace-first PKM MVP`를 실제 구현 순서로 내립니다.

핵심 전제는 아래와 같습니다.

- 현재 구현 자산은 버리지 않습니다.
- 현재 살아 있는 `recruiting vertical read slice`를 먼저 감싸고 확장합니다.
- `workspace shell -> document read -> personal authoring -> wiki generation` 순서로 넓히는 편이 안전합니다.

## Planning Rules

### 1. Current Reality First

현재 구현 현실:

- `report`
- `opportunity detail`
- `ask`
- `calendar`
- `ingestion`
- `StrataWiki HTTP + personal query`

즉 현재는 `recruiting vertical MVP`가 실체입니다.

### 2. Target MVP Next

이번 backlog의 목표는 아래를 추가로 닫는 것입니다.

- `workspace shell`
- `shared / personal/raw / personal/wiki` navigation
- generic `document detail`
- `personal` document CRUD
- `personal/raw -> personal/wiki` LLM action

### 3. Preserve The Boundary

- Jobs-Wiki는 UI, WAS projection, user workflow를 소유합니다.
- StrataWiki는 personal/query/interpretation/provenance/runtime boundary를 소유합니다.
- personal authoring이 들어와도 canonical fact ownership은 바뀌지 않습니다.

## Priority Lanes

### P0. Workspace Shell Around Current Slice

목표:

- 기존 `summary / opportunity / ask / calendar` 구현을 버리지 않고 `workspace shell` 안으로 재배치

핵심 결과:

- `/workspace` route 추가
- shell navigation에서 `report`, `opportunity`, `calendar`, `shared document`, `personal document` entry 노출
- 기존 `/report`, `/ask`, `/calendar`, `/opportunities/:id`는 shell 내부 projection으로 해석

완료 기준:

- 사용자는 onboarding/review 이후 `/workspace`로 진입
- shell 안에서 현재 active context를 볼 수 있음
- 기존 report/opportunity/calendar로 자연스럽게 이동 가능

### P1. Shared/Personal Document Read Path

목표:

- generic `document detail`을 도입해 `shared`와 `personal`을 같은 workspace 안에서 읽게 함

핵심 결과:

- `GET /api/workspace`
- `GET /api/documents/{documentId}`
- layer badge, writable flag, related object link

완료 기준:

- `shared` 문서는 read-only로 보임
- `personal/raw`, `personal/wiki`는 구분되어 보임
- Ask 진입 시 현재 document context가 유지됨

### P2. Personal Authoring Foundation

목표:

- `personal/raw` 문서 생성/업로드/수정/삭제의 최소 경로를 닫음

핵심 결과:

- markdown note create
- PDF upload register
- update/delete
- write success를 `personal에 저장됨`으로 표시

완료 기준:

- 사용자가 workspace shell에서 새 personal 문서를 만들 수 있음
- 저장/삭제 후 shell navigation에 반영됨
- 상위 shared/fact가 바뀐 것처럼 보이지 않음

### P3. Personal Wiki Generation

목표:

- raw 문서를 LLM으로 재가공해 `personal/wiki` 문서로 저장

핵심 결과:

- summarize
- rewrite
- structure into wiki
- link suggestion / attachment

완료 기준:

- generation target은 항상 `personal/wiki`
- 결과 문서는 provenance와 source link를 가짐
- shared document에서 실행해도 shared가 수정되지 않음

### P4. Ask and Grounding Upgrade

목표:

- Ask를 workspace-first 기준으로 강화

핵심 결과:

- `documentId` context 정식 지원
- active context 표시
- evidence kind / related docs / related opportunities 강화
- save/fill as explicit personal action 정리

완료 기준:

- document, opportunity, workspace context에서 Ask가 일관되게 동작
- grounding 없는 free-form answer를 기본으로 두지 않음

### P5. Sync, Provenance, and UX Honesty

목표:

- stale/partial/pending와 generation applied 상태를 UI에 정직하게 반영

핵심 결과:

- sync visibility 정리
- command applied copy 정리
- last-known data 전략 일관화

완료 기준:

- `shared updated`와 `personal saved`를 혼동하지 않음
- stale/partial 상태가 숨겨지지 않음

## Recommended Delivery Order

1. `Workspace shell read path`
2. `Document detail read path`
3. `Personal document CRUD`
4. `Personal wiki generation`
5. `Ask grounding upgrade`
6. `Sync/provenance UX hardening`

## Why This Order

- shell이 먼저 있어야 현재 구현 자산을 workspace-first 서사로 묶을 수 있습니다.
- document read가 먼저 있어야 personal authoring이 자연스럽게 붙습니다.
- CRUD가 먼저 있어야 LLM generation 결과를 둘 곳이 생깁니다.
- generation과 Ask 강화는 그 다음이 더 안전합니다.

## Out of Scope For This Backlog

- full graph explorer
- advanced search
- collaboration / sharing
- multi-user auth hardening
- enterprise RBAC
- long-running automation family

## Exit Condition

이 backlog가 닫히면 제품은 아래 상태에 도달해야 합니다.

- 현재 구현 현실이 여전히 `recruiting vertical`을 강하게 포함하지만
- 사용자 경험의 첫 진입과 주된 작업 흐름은 `workspace-first PKM MVP`로 바뀜
- LLM은 chat toy가 아니라 `personal knowledge workspace assistant`로 보이기 시작함
