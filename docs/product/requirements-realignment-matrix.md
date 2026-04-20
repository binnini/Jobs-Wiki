---
status: draft
---

# Requirements Realignment Matrix

## Status Vocabulary

- `구현`
- `부분 구현`
- `미구현`

## Phase Vocabulary

- `MVP`
- `다음 단계`
- `장기 비전`

## Product and UX

| Area | Requirement | Phase | Current Status | Notes |
| --- | --- | --- | --- | --- |
| Product identity | PKM knowledge workspace가 제품의 main UX여야 한다 | MVP | 부분 구현 | 새 기준선에서 최상위 목표로 승격 |
| Directory split | workspace는 `shared`, `personal/raw`, `personal/wiki`를 구분해 보여줘야 한다 | MVP | 미구현 | 이번에 새로 승격된 요구사항 |
| Shared read-only | shared 문서는 읽기 전용이어야 한다 | MVP | 부분 구현 | 개념은 맞지만 제품 UX/API로는 더 필요 |
| Workspace shell | report, documents, ask, calendar를 오가는 shell이 필요하다 | MVP | 부분 구현 | route와 projection은 있으나 shell 서사는 약함 |
| Workspace navigation | tree/list 기반 navigation이 필요하다 | MVP | 미구현 | 현재 구현 중심은 report/opportunity |
| Document detail | markdown 또는 structured document detail이 필요하다 | MVP | 미구현 | 현재 opportunity detail은 있으나 generic document detail은 아님 |
| Personal CRUD | personal에서 md/pdf 문서를 생성, 수정, 삭제할 수 있어야 한다 | MVP | 미구현 | 핵심 추가 요구사항 |
| Report projection | report는 workspace projection 중 하나여야 한다 | MVP | 부분 구현 | 현재는 메인 홈으로 강하게 배치됨 |
| Opportunity detail | opportunity는 workspace 안의 object/projection으로 읽혀야 한다 | MVP | 구현 | 현재 detail projection 존재 |
| Calendar | calendar는 workspace projection으로 제공되어야 한다 | MVP | 부분 구현 | read path 존재 |

## LLM

| Area | Requirement | Phase | Current Status | Notes |
| --- | --- | --- | --- | --- |
| Profile interpretation | 입력과 파일에서 profile snapshot 후보를 생성해야 한다 | MVP | 부분 구현 | extraction baseline 있음 |
| Grounded ask | answer는 evidence와 related context를 포함해야 한다 | MVP | 부분 구현 | ask path 존재 |
| Personal query | profile-aware personal query를 수행해야 한다 | MVP | 부분 구현 | StrataWiki `query_personal_knowledge` 존재 |
| Shared interpretation | Fact 기반 shared interpretation을 생성해야 한다 | MVP | 부분 구현 | 한 family 중심 lifecycle 존재 |
| Raw to wiki generation | personal/raw 문서를 personal/wiki로 요약/재작성/구조화할 수 있어야 한다 | MVP | 미구현 | 이번에 새로 승격 |
| Linking and relations | LLM이 문서 관계/link를 제안 또는 부착할 수 있어야 한다 | MVP | 미구현 | personal wiki 구성 핵심 |
| No upward propagation | personal layer 작업이 Fact/Interpretation으로 역전파되면 안 된다 | MVP | 부분 구현 | 원칙은 강하지만 제품/API 반영 필요 |
| Save / filing | answer를 personal artifact로 저장/파일링할 수 있어야 한다 | 다음 단계 | 부분 구현 | 저장 경로는 열려 있음 |

## API and WAS

| Area | Requirement | Phase | Current Status | Notes |
| --- | --- | --- | --- | --- |
| WAS-only boundary | frontend는 WAS만 호출해야 한다 | MVP | 구현 | 현재 구조와 테스트 기준 충족 |
| Workspace API | workspace shell/tree/document API가 필요하다 | MVP | 미구현 | 새 MVP 방향에 맞춰 추가 정의 필요 |
| Document CRUD API | personal 문서 CRUD와 PDF 업로드 API가 필요하다 | MVP | 미구현 | 새 핵심 API 요구사항 |
| Wiki action API | summarize/rewrite/link 같은 personal wiki generation API가 필요하다 | MVP | 미구현 | 새 LLM action surface |
| Read/command separation | WAS는 read path와 command path를 분리해야 한다 | MVP | 구현 | adapter 구조상 유지됨 |
| Adapter-based integration | mock/real mode adapter를 지원해야 한다 | MVP | 구현 | 현재 구현됨 |
| Error normalization | raw provider error를 외부에 노출하지 않아야 한다 | MVP | 부분 구현 | 구조는 있으나 전반 점검 필요 |

## Ingestion and Domain

| Area | Requirement | Phase | Current Status | Notes |
| --- | --- | --- | --- | --- |
| Recruiting vertical | recruiting은 첫 vertical slice여야 한다 | MVP | 구현 | 현재 실제 중심 도메인 |
| DomainProposalBatch | validate -> ingest write contract | MVP | 구현 | preferred external write path |
| Canonical ownership | canonical write ownership은 StrataWiki가 가져야 한다 | MVP | 구현 | direct DB write 금지 원칙 유지 |
| Personal-only mutation | user mutation은 personal layer에만 허용되어야 한다 | MVP | 부분 구현 | 방향은 명확하나 제품/API 반영 필요 |

## StrataWiki Platform

| Area | Requirement | Phase | Current Status | Notes |
| --- | --- | --- | --- | --- |
| Three-layer model | Fact / Interpretation / Personal 분리 | MVP | 구현 | 데모 및 runtime 기준 충족 |
| Shared as rendered view | shared는 interpretation layer의 문서형 view여야 한다 | MVP | 부분 구현 | 개념적으로 존재하나 UX/IA로 강화 필요 |
| Snapshot awareness | answer와 artifact가 snapshot tuple을 기록 | MVP | 부분 구현 | personal/interpretation path에 반영됨 |
| Provenance | derived output은 provenance를 가져야 한다 | MVP | 부분 구현 | core path에는 존재 |

## Realignment Summary

- `report-first recruiting app`에서 `workspace-first PKM`으로 중심을 옮깁니다.
- `shared`는 interpretation layer의 문서형 read-only view입니다.
- `personal/raw`와 `personal/wiki`는 MVP 핵심으로 승격됩니다.
- personal layer의 모든 작업은 상위 layer로 역전파되지 않는다는 규칙을 명시적 MVP 원칙으로 둡니다.
