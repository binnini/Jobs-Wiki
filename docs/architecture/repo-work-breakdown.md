---
status: draft
---

# Repo Work Breakdown

## Purpose

이 문서는 `workspace-first PKM MVP`를 구현할 때
어떤 작업을 `Jobs-Wiki`에서 하고, 어떤 작업을 `StrataWiki`에서 해야 하는지 정리합니다.

핵심은 ownership을 흐리지 않는 것입니다.

## Ground Rules

- Jobs-Wiki는 web product repo 입니다.
- StrataWiki는 knowledge runtime repo 입니다.
- Jobs-Wiki가 canonical backend나 knowledge DB schema ownership을 가져오면 안 됩니다.
- StrataWiki가 web-specific projection과 screen flow를 직접 소유하면 안 됩니다.

## Ownership Summary

### Jobs-Wiki owns

- frontend route / screen / interaction
- WAS endpoint surface
- view model / projection mapping
- workspace shell UX
- opportunity/report/calendar presentation
- user-visible command flow
- adapter wiring and fallback policy
- consumer of StrataWiki read-serving contract, not the contract owner

### StrataWiki owns

- fact / interpretation / personal runtime authority
- profile context
- personal query
- provenance / snapshot / explainability
- interpretation lifecycle
- personal artifact storage contract if stored in personal layer
- LLM runtime policy and retrieval discipline
- authoritative read-serving data contract for external consumers

## Graph Naming

- `StrataWiki internal graph`
  - dependency / invalidation / retrieval support graph
  - operator/runtime concern
- `Jobs-Wiki workspace graph projection`
  - user-facing node/edge visualization
  - product projection concern

## Work Breakdown By Epic

## 1. Workspace Shell

### Jobs-Wiki

- `/workspace` route 추가
- shell navigation UI 추가
- `GET /api/workspace` endpoint surface 추가
- shell projection mapper 추가
- existing summary/opportunity/calendar route를 shell 안으로 재배치

### StrataWiki

- shell이 읽을 수 있는 최소 navigation/read contract 제공 여부 결정
- shared/personal object ref shape 제공
- current active context와 layer visibility를 표현할 수 있는 personal/read contract 정리
- consumer-shaped HTTP read endpoint 제공

## 2. Document Detail

### Jobs-Wiki

- `/documents/:documentId` route 추가
- document detail page 구현
- document detail mapper 구현
- shared/personal writable affordance 분기

### StrataWiki

- `shared` 문서형 read model 계약 정리
- `personal/raw`, `personal/wiki` 문서 조회 계약 정리
- related object/document link shape 제공

## 3. Personal Document CRUD

### Jobs-Wiki

- create/update/delete/upload UI
- command endpoint surface
- optimistic/pending/applied UX
- error normalization 및 retry copy

### StrataWiki

- personal document create/update/delete/upload register contract
- personal artifact identity / version / provenance
- scope guard and permission enforcement
- write 후 read visibility contract

## 4. Personal Wiki Generation

### Jobs-Wiki

- summarize/rewrite/wiki/link action button
- generation request flow
- generation result를 personal/wiki detail로 연결
- applied / failed / retry UX

### StrataWiki

- summarize/rewrite/link generation tool contract
- retrieval policy enforcement
- output schema / provenance / source link
- generation result persistence into personal/wiki

## 5. Ask Upgrade

### Jobs-Wiki

- `documentId` context 정식 지원
- active context banner
- save-as-personal action UX
- answer/evidence/related blocks 정리

### StrataWiki

- profile-aware + document-aware personal query contract
- evidence kind / provenance payload 강화
- explainability / snapshot tuple 노출 정리

## 6. Recruiting Vertical Preservation

### Jobs-Wiki

- 기존 summary/opportunity/calendar slice 유지
- shell 안에서 report/opportunity/calendar을 projection/object로 재배치
- regression 없이 current flow 유지

### StrataWiki

- WorkNet -> DomainProposalBatch -> canonical write path 유지
- recruiting interpretation/personal query path 유지

## Suggested Delivery Split

### Slice A. Jobs-Wiki only

- workspace route shell
- navigation UI
- current report/opportunity/calendar embed
- active context handling

### Slice B. Cross-repo small contract

- `GET /api/workspace`
- `GET /api/documents/{documentId}`
- shared/personal document ref shape

### Slice C. Cross-repo command

- personal document CRUD
- upload register

### Slice D. Cross-repo LLM action

- summarize / rewrite / link
- personal/wiki persistence

## Open Decisions To Resolve Early

### D1. Personal document persistence owner

권장 방향:

- personal 문서 persistence는 StrataWiki personal layer contract로 두고
- Jobs-Wiki는 UI와 projection만 소유

이유:

- provenance, snapshot, explainability, personal query와 자연스럽게 연결됨

### D2. Shared document materialization shape

권장 방향:

- shared는 interpretation layer의 rendered document view로 읽게 하고
- Jobs-Wiki는 이를 generic document projection으로 소비

### D3. Upload path

권장 방향:

- file blob 자체의 저장 경로와 extracted metadata path를 분리
- Jobs-Wiki는 upload UX와 registration trigger를 담당
- authoritative record는 StrataWiki personal contract가 담당

## Anti-patterns

- Jobs-Wiki가 StrataWiki DB를 직접 write
- Jobs-Wiki가 StrataWiki canonical read DB를 장기 기본 경계로 유지
- Jobs-Wiki가 personal layer schema를 ad-hoc로 복제
- StrataWiki가 frontend route/view model naming까지 직접 소유
- personal wiki generation 결과를 shared update처럼 표시
