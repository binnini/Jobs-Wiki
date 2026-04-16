---
status: draft
working_notes:
  - dev-wiki/decisions/2026-04-16-project-phase-and-todo-map.md
  - dev-wiki/decisions/2026-04-16-personal-knowledge-query-transport-scope.md
---

# Implementation Roadmap

## Status

Draft

이 문서는 Jobs-Wiki의 현재 구현 단계와 다음 우선순위를 공식 문서 수준에서 압축해 정리합니다.
세션별 작업 로그나 임시 비교안은 포함하지 않습니다.

## Current Phase

현재 프로젝트는 초기 구현 단계이지만, 설계-only 단계는 지난 상태로 봅니다.

현재 강한 기준선:

- canonical-storage-to-read backbone
- personal knowledge query read slice
- answer bundle과 user-facing Personal family
- candidate HTTP surface
- runtime execution spine의 최소 기준선

현재 약한 영역:

- lexical / canonical retrieval depth
- 실제 global HTTP runtime/router
- 더 넓은 product/domain breadth
- 운영 성숙도

## Current Baseline

현재까지 공식적으로 볼 수 있는 최소 구현 기준선은 아래입니다.

- workspace-facing read/query direction이 문서화되어 있습니다.
- `GET /workspace/personal-knowledge/query` candidate read surface가 존재합니다.
- `POST /workspace/personal-knowledge/regenerations` candidate persisted refresh surface가 존재합니다.
- GET query는 `ephemeral` only이며, default evidence policy는 `personal_only`입니다.
- `query_personal_knowledge`는 command family가 아니라 retrieval 위의 좁은 read orchestration으로 유지합니다.
- persisted regeneration은 command path가 아니라 read-side artifact refresh transport로 유지합니다.
- runtime 쪽에는 access policy metadata, authorization helper, handler-ready execution context, envelope-based execution spine의 최소 기준선이 있습니다.

## Current Decisions

- `personal.workspace_briefing`, `personal.application_next_steps`를 default family set으로 유지합니다.
- `personal.evidence_map`는 opt-in family로 유지합니다.
- approved consumer 최소 gate는 auth, narrow capability, quota control 세 축으로 둡니다.
- object/relation visibility는 read authority 기존 정책을 따르고, POST regeneration surface는 projection-level persisted regeneration gate만 별도로 가집니다.
- runtime은 raw request와 별도로 handler-ready execution context를 조립하고, normalization은 `authorizedInput`을 우선 소비하는 편이 맞습니다.
- direct/public HTTP handler도 envelope-based execution spine을 공유하는 편이 맞습니다.
- relation context는 `neighborhoodSummary` 한 줄까지 유지하고, richer neighborhood는 보류합니다.

## Next Priorities

현재 공식 우선순위는 아래 순서로 둡니다.

1. runtime/direct path validation을 어디까지 공통화할지 판단
2. 실제 global HTTP runtime/router shape를 framework/middleware 수준까지 더 좁힐지 판단
3. selected external consumer beyond frontend에 POST regeneration surface를 언제 열지 판단

## Later Priorities

- lexical / canonical retrieval 강화
- interpretation family 추가 확장
- 실제 HTTP runtime/router 구현
- 실제 MCP runtime / transport 정의
- multi-domain 및 운영 성숙도 개선

## Non-Goals For This Phase

- MCP 서버 구현
- ingestion orchestration을 WAS request path 안으로 넣는 것
- DB ownership, schema, migration을 이 레포 안으로 끌어오는 것
- draft runtime/transport를 final contract처럼 너무 일찍 고정하는 것

## Maintenance Rule

- 현재 phase나 next priority가 바뀌면 이 문서를 갱신합니다.
- 작업 중 세부 판단과 임시 메모는 `dev-wiki/`에 두고, 안정된 결론만 이 문서에 반영합니다.
