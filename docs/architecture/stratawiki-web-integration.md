---
status: draft
---

# StrataWiki Web Integration

## Purpose

이 문서는 현재 구현된 `Jobs-Wiki -> StrataWiki` 통합 경계를 설명합니다.
특히 다음을 명확히 합니다.

- 어떤 경로가 이미 live integration 으로 동작하는지
- Jobs-Wiki 가 어떤 책임을 가지고 StrataWiki 를 호출하는지
- read path / write path / ask path 가 어떻게 분리되는지
- 아직 남아 있는 결정 사항이 무엇인지

현재 문서는 장기적인 generic MCP backend 설명이 아니라, **지금 코드에 반영된 wrapper-first, read-backed architecture**를 기준으로 합니다.

## Current Runtime Contract

현재 Jobs-Wiki 는 StrataWiki 를 아래 두 방식으로 사용합니다.

### 1. Write / command path

Jobs-Wiki ingestion 과 WAS command facade 는 StrataWiki 를 **고정 CLI wrapper** 로만 호출합니다.

- wrapper: `STRATAWIKI_CLI_WRAPPER`
- 현재 기본 wrapper:
  - `/Users/yebin/workSpace/stratawiki-runtime/bin/stratawiki-jobswiki.sh`

중요한 원칙:

- Jobs-Wiki 는 StrataWiki DB 에 직접 write 하지 않습니다.
- Jobs-Wiki 는 `/Users/yebin/workSpace/stratawiki` 개발 checkout 을 직접 호출하지 않습니다.
- Jobs-Wiki 는 `python -m wiki_mcp.cli` 를 직접 호출하지 않습니다.
- Jobs-Wiki 는 wrapper 를 통해서만 StrataWiki tool surface 를 사용합니다.

### 2. Read path

Jobs-Wiki WAS real mode 는 StrataWiki canonical read DB 를 읽어서 사용자-facing projection 을 만듭니다.

- read DB env:
  - `STRATAWIKI_READ_DATABASE_URL`
- 현재 read projection:
  - workspace summary
  - opportunities list
  - opportunity detail
  - calendar
  - read-backed ask fallback

즉 현재 구조는 아래처럼 읽는 편이 맞습니다.

```text
frontend
  -> Jobs-Wiki WAS
       -> StrataWiki read DB (projection assembly)
       -> StrataWiki CLI wrapper (command / provisioning / personal query)
```

## What Is Implemented Today

### Ingestion write path

이미 구현된 canonical write path:

```text
WorkNet source
  -> Jobs-Wiki ingestion
  -> DomainProposalBatch
  -> validate_domain_proposal_batch
  -> ingest_domain_proposal_batch
  -> StrataWiki fact snapshot
```

이 경로는 local smoke 로 검증되었습니다.

사용하는 StrataWiki tool:

- `validate_domain_proposal_batch`
- `ingest_domain_proposal_batch`

사용하지 않는 경로:

- `ingest_fact_batch`
  - legacy path 이므로 cross-repo integration 의 기본 경로로 사용하지 않습니다.

### WAS real read path

이미 구현된 read-backed projection:

- `GET /api/workspace/summary`
- `GET /api/opportunities`
- `GET /api/opportunities/:opportunityId`
- `GET /api/calendar`
- `GET /api/workspace/sync`

이 route 들은 `WAS_DATA_MODE=real` 일 때 StrataWiki snapshot / fact / relation state 를 읽어서 응답합니다.

### Ask path

현재 Ask 는 두 레이어를 가집니다.

1. **source-first read-backed answer**
   - summary / detail / list evidence 를 조합한 fallback
2. **personal-aware path**
   - profile context 가 provision 되면
   - `query_personal_knowledge`
   - `get_personal_record`
   - `get_interpretation_record`
   - `get_fact_record`
   를 조합해 answer / evidence / related objects 를 구성

즉 현재 Ask 는 "항상 mock" 이 아니라,
**profile context 가 있으면 personal-aware, 없으면 read-backed source-first fallback** 으로 동작합니다.

## Logical Split

현재 구현을 설명할 때는 StrataWiki 를 아래 세 경계로 보는 것이 가장 정확합니다.

### 1. Canonical write authority

역할:

- DomainProposalBatch validation
- canonical fact / relation ingestion
- snapshot publication side effect

현재 Jobs-Wiki caller:

- `apps/ingestion`

### 2. Read authority

역할:

- canonical fact / relation / snapshot read
- workspace summary / opportunity / calendar projection 재료 제공

현재 Jobs-Wiki caller:

- `apps/was` real read adapter

### 3. Personal knowledge tool surface

역할:

- profile context lookup / upsert
- personal query orchestration
- personal / interpretation / fact record retrieval

현재 Jobs-Wiki caller:

- `apps/was` ask adapter

## Current Env Contract

### Jobs-Wiki owned env

- `STRATAWIKI_CLI_WRAPPER`
  - StrataWiki tool surface 를 호출하는 유일한 실행 경계
- `JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS`
  - canonical proposal write 를 위한 domain pack artifact path
- `JOBS_WIKI_STRATAWIKI_ACTIVE_DOMAIN_PACKS`
  - optional active pack mapping
- `STRATAWIKI_READ_DATABASE_URL`
  - WAS real read adapter 가 읽는 DB connection string
- `STRATAWIKI_READ_PSQL_BIN`
  - read adapter query process

### StrataWiki owned env

- `DATABASE_URL`
- `STRATAWIKI_DOMAIN_PACK_PATHS`
- `STRATAWIKI_ACTIVE_DOMAIN_PACKS`
- `OPENAI_API_KEY` 등 LLM provider env

Jobs-Wiki 가 wrapper subprocess 를 실행하더라도, 위 값들은 **StrataWiki runtime contract** 로 취급합니다.

## Current Tool Expectations

현재 Jobs-Wiki 가 사용하는 StrataWiki tool surface:

- `validate_domain_proposal_batch`
- `ingest_domain_proposal_batch`
- `get_snapshot_status`
- `get_profile_context`
- `upsert_profile_context`
- `query_personal_knowledge`
- `get_personal_record`
- `get_interpretation_record`
- `get_fact_record`

추가로 command facade 경계는 Jobs-Wiki WAS 안에 존재하지만, 현재 live integration 의 핵심 가치는 ingestion + read + ask 에 있습니다.

## Frontend Interpretation

frontend 는 StrataWiki 를 직접 호출하지 않습니다.
frontend 가 보는 것은 항상 WAS projection 입니다.

현재 사용자 흐름:

- `/report`
  - live summary projection
- `/opportunities/:id`
  - live opportunity detail
- `/ask`
  - personal-aware 또는 source-first fallback answer
- `/calendar`
  - live calendar projection
- shell sidebar
  - `workspace/sync`
  - manual ingestion trigger

즉 StrataWiki 는 frontend 에서 "문서 저장소" 로 직접 보이기보다,
**WAS projection 뒤에 있는 knowledge runtime** 으로 보이는 편이 맞습니다.

## Verification

현재 구현 기준 최소 live smoke:

```bash
npm run smoke:live
```

이 smoke 는 다음을 확인합니다.

- wrapper tool listing
- WorkNet dry-run ingestion
- WorkNet apply ingestion
- WAS real summary / list / detail / ask / sync
- StrataWiki DB count sanity check

## Still Open

아직 미결정 또는 후속 구현이 필요한 항목:

- profile context 를 언제 UI 에서 명시적으로 갱신할지
- command facade 를 local wrapper 에서 long-lived MCP service 로 바꿀지
- ask answer history / save UX 를 붙일지
- scheduled ingestion / retry / backfill 운영 정책을 어디까지 자동화할지

## Rule Of Thumb

현재 구현을 설계할 때 가장 중요한 기준은 아래입니다.

- **write 는 wrapper**
- **read 는 canonical DB**
- **frontend 는 WAS only**
- **personal-aware ask 는 profile context 가 있을 때만**
- **없으면 source-first fallback 을 정직하게 유지**
