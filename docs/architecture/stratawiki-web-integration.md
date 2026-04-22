---
status: draft
---

# StrataWiki Web Integration

## Purpose

이 문서는 현재 코드 기준의 `Jobs-Wiki -> StrataWiki` 통합 경계를 설명합니다.

특히 아래를 구분해서 적습니다.

- 현재 이미 구현된 경로
- direct DB access 금지와 read DB 사용의 차이
- read DB boundary 와 HTTP boundary 의 차이

이 문서는 **current baseline** 과 **target baseline** 을 분리해서 읽어야 합니다.

- current baseline
  - write / personal / command 는 HTTP 입니다.
  - read 는 `JOBS_WIKI_READ_AUTHORITY_MODE=sql|http` 로 병행 가능합니다.
  - default read authority 는 이제 `http` 입니다.
- target baseline
  - read / write / personal / command 모두 HTTP 입니다.
  - Jobs-Wiki 는 StrataWiki canonical DB 에 직접 연결하지 않습니다.

## Current Runtime Split

현재 Jobs-Wiki 는 StrataWiki 를 세 개의 경계로 사용합니다.

### 1. Ingestion write path

`apps/ingestion` 은 WorkNet payload 를 `DomainProposalBatch` 로 정규화한 뒤,
StrataWiki canonical write surface 로 전달합니다.

현재 write path 원칙:

- 기본 경로는 HTTP 입니다.
- `POST /api/v1/domain-proposals/validate`
- `POST /api/v1/domain-proposals/ingest`
- HTTP 가 기본 경계입니다.
- Jobs-Wiki 는 StrataWiki DB 에 직접 write 하지 않습니다.
- Jobs-Wiki 는 StrataWiki 개발 checkout 을 직접 호출하지 않습니다.

즉 write authority 는 여전히 StrataWiki 쪽에 있고, Jobs-Wiki 는 proposal caller 입니다.

### 2. WAS read path

`apps/was` 의 `WAS_DATA_MODE=real` 은 read authority mode 에 따라
두 경로 중 하나로 user-facing projection 을 만듭니다.

이 read path 원칙:

- `JOBS_WIKI_READ_AUTHORITY_MODE=sql`
  - deprecated fallback path 입니다.
  - `STRATAWIKI_READ_DATABASE_URL` 로 read DB 에 연결합니다.
  - `STRATAWIKI_READ_PSQL_BIN` 으로 SQL read process 를 실행합니다.
  - read 대상은 canonical snapshot / fact / relation state 입니다.
- `JOBS_WIKI_READ_AUTHORITY_MODE=http`
  - current default 입니다.
  - StrataWiki read model endpoint 를 호출합니다.
  - canonical table shape 가 아니라 consumer-shaped projection contract 를 사용합니다.

따라서 현재 구현을 정확히 적으면 아래와 같습니다.

- direct DB write 는 하지 않는다
- read 의 default 는 HTTP 이고 SQL path 는 fallback 으로 남아 있다
- migration target 은 direct DB read 제거다

### 3. WAS ask path

현재 ask 의 baseline 은 **read-backed source-first answer** 입니다.

실제 동작 순서:

1. `ReadAuthorityAdapter` 로 live summary / opportunity data 를 읽습니다.
2. profile context catalog 에서 사용할 profile 이 resolve 되면 StrataWiki personal path 를 시도합니다.
3. personal path 가 성공하면 personal-aware answer 로 upgrade 합니다.
4. personal path 가 없거나 실패하면 read-backed source-first answer 로 fallback 합니다.

### 3-1. WAS personal document path

현재 workspace-first authoring 은 ask path 와 별도로 StrataWiki personal surface 를 사용합니다.

실제 동작 범위:

- Personal document list / detail
- Personal document create / update / delete
- Personal asset registration
- raw -> wiki summarize / rewrite / structure
- wiki link suggestion / attach

중요한 현재 구현 baseline:

- Jobs-Wiki 는 이 personal family 를 dedicated resource/operation-shaped REST endpoint 로 호출합니다.
- cross-repo consumer contract baseline 은 이제 generic tool-call bridge 가 아니라 HTTP resource contract 입니다.

현재 ask 와 personal document path 에서 실제로 사용하는 StrataWiki surface:

- `PUT /api/v1/profile-contexts/{tenant_id}/{user_id}`
- `POST /api/v1/personal-queries`
- `GET /api/v1/snapshot-status`
- ask upgrade 에 필요한 record/tool 조회용 generic `/api/v1/tool-calls`
  - `get_profile_context`
  - `get_personal_record`
  - `get_interpretation_record`
  - `get_fact_record`
- personal document / asset / generation / link endpoint
  - `GET /api/v1/users/{tenant_id}/{user_id}/personal-documents`
  - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents`
  - `GET /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}`
  - `PATCH /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}`
  - `DELETE /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}`
  - `POST /api/v1/users/{tenant_id}/{user_id}/personal-assets`
  - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/summarize-wiki`
  - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/rewrite-wiki`
  - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/structure-wiki`
  - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/suggest-links`
  - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/attach-links`

중요한 현재 상태:

- ask 는 기본적으로 read-backed 입니다.
- personal-aware path 는 **optional upgrade** 입니다.
- `save` 는 아직 reserved no-op 입니다.
- target PKM structure 나 ask history 는 아직 구현 완료 상태가 아닙니다.

### 4. Command / admin path

현재 command facade 는 HTTP command contract 를 사용합니다.

이 경계를 쓰는 route:

- `GET /api/workspace/sync`
- `POST /api/admin/ingestions/worknet/:sourceId`

정확히는 아래처럼 구분됩니다.

- `GET /api/workspace/sync`
  - `commandId` 가 없으면 read-side projection visibility 를 read adapter 로 계산합니다.
- `GET /api/workspace/sync?commandId=...`
  - HTTP command status 를 조회합니다.
- `POST /api/admin/ingestions/worknet/:sourceId`
  - HTTP command submit 을 호출합니다.

## Implemented Today

### Ingestion

```text
WorkNet source
  -> Jobs-Wiki ingestion
  -> DomainProposalBatch
  -> HTTP validate/ingest
  -> StrataWiki canonical write authority
```

현재 기본 경로:

- `POST /api/v1/domain-proposals/validate`
- `POST /api/v1/domain-proposals/ingest`

현재 문서상 주의:

- `ingest_fact_batch` 를 cross-repo 기본 경로로 설명하지 않습니다.
- wrapper mode 를 normal write baseline 으로 설명하지 않습니다.

### WAS read projections

`WAS_DATA_MODE=real` 에서 live data 를 읽는 route:

- `GET /api/workspace/summary`
- `GET /api/opportunities`
- `GET /api/opportunities/:opportunityId`
- `GET /api/calendar`
- `GET /api/workspace/sync`

이 route 들은 read authority mode 에 따라 다르게 동작합니다.

- `sql`
  - StrataWiki read DB 로부터 projection 을 조합합니다.
- `http`
  - StrataWiki read endpoint 를 직접 호출합니다.
  - 현재 endpoint baseline:
    - `GET /api/v1/workspace-summary`
    - `GET /api/v1/opportunities`
    - `GET /api/v1/opportunities/{opportunity_id}`
    - `GET /api/v1/calendar`

### WAS ask

현재 ask 는 아래처럼 이해하는 편이 정확합니다.

```text
POST /api/workspace/ask
  -> read-backed summary/opportunity context
  -> optional profile context resolution
  -> optional personal query upgrade
  -> fallback to source-first answer when personal path is unavailable
```

현재 구현이 보장하는 것은 아래까지입니다.

- read-backed generic answer
- read-backed opportunity-scoped answer
- profile catalog 가 있을 때 personal-aware upgrade 시도
- personal/interpretation/fact artifact 를 evidence 로 다시 붙이는 것

현재 구현이 아직 보장하지 않는 것은 아래입니다.

- ask history persistence
- save-enabled personal note creation
- binary upload transport 자체

현재는 이미 보장하는 것:

- workspace tree 기반 document navigation
- personal/raw 와 personal/wiki authoring
- generation trace / provenance surface
- personal wiki link suggestion / attachment

### Sync / admin

현재 command facade real implementation 은 아래 HTTP command surface 를 사용합니다.

- `POST /api/v1/commands`
- `GET /api/v1/commands/{command_id}`

## Current Env Contract

### Jobs-Wiki owned env

- `STRATAWIKI_INTEGRATION_MODE`
  - current baseline 은 `http`
  - legacy `auto|wrapper` compatibility path 는 운영 기준선으로 설명하지 않습니다
- `STRATAWIKI_BASE_URL`
  - ask / personal document / command / HTTP read integration base URL
- `STRATAWIKI_API_TOKEN`
  - auth-enabled HTTP 환경용 bearer token
- `JOBS_WIKI_READ_AUTHORITY_MODE`
  - `sql|http`
  - current default 는 `http`
  - `sql` 은 제거 대상 fallback
- `STRATAWIKI_HTTP_TIMEOUT_MS`
  - HTTP timeout
- `STRATAWIKI_CLI_WRAPPER`
  - legacy rollback/debug path
- `JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS`
  - ingestion runtime artifact path list
- `JOBS_WIKI_STRATAWIKI_ACTIVE_DOMAIN_PACKS`
  - optional active pack mapping
- `STRATAWIKI_READ_DATABASE_URL`
  - `sql` read authority mode 에서만 사용
  - deprecated target
- `STRATAWIKI_READ_PSQL_BIN`
  - `sql` read authority mode 에서만 사용
  - deprecated target
- `JOBS_WIKI_PROFILE_CONTEXT_CATALOG_PATH`
  - ask personal-aware upgrade 시도에 사용할 profile catalog

현재 runtime baseline 메모:

- local verification baseline 은 `STRATAWIKI_INTEGRATION_MODE=http` 와 `STRATAWIKI_BASE_URL=http://127.0.0.1:18080` 입니다.

### StrataWiki owned env

- `DATABASE_URL`
- `STRATAWIKI_DOMAIN_PACK_PATHS`
- `STRATAWIKI_ACTIVE_DOMAIN_PACKS`
- LLM provider env

StrataWiki runtime 자체가 책임지는 env 와 Jobs-Wiki 가 소유하는 env 는 구분해서 보는 편이 맞습니다.

## Current Tool / Endpoint Expectations

현재 코드가 **실제로 main path 에서 사용하는** StrataWiki surface:

- HTTP read endpoint family
  - `GET /api/v1/workspace-summary`
  - `GET /api/v1/opportunities`
  - `GET /api/v1/opportunities/{opportunity_id}`
  - `GET /api/v1/calendar`
- `POST /api/v1/domain-proposals/validate`
- `POST /api/v1/domain-proposals/ingest`
- `PUT /api/v1/profile-contexts/{tenant_id}/{user_id}`
- `POST /api/v1/personal-queries`
- `GET /api/v1/snapshot-status`
- generic `/api/v1/tool-calls`
  - `get_profile_context`
  - `get_personal_record`
  - `get_interpretation_record`
  - `get_fact_record`
- personal document / asset / generation / link endpoint
- command endpoint
  - `POST /api/v1/commands`
  - `GET /api/v1/commands/{command_id}`

현재 client surface 에는 아래도 존재하지만,
이 문서에서 말하는 "현재 ask baseline" 의 핵심 경로로 취급하지는 않습니다.

- `POST /api/v1/interpretation-builds`
- `GET /api/v1/jobs/{job_id}`
- `GET /api/v1/cache-status/{record_id}`
- `GET /api/v1/explanations/{layer}/{record_id}`

## Frontend Interpretation

frontend 는 StrataWiki 를 직접 호출하지 않습니다.
frontend 가 보는 것은 항상 WAS projection 또는 WAS command envelope 입니다.

현재 사용자 관점에서의 실제 surface:

- `/report`
  - read-backed summary projection
- `/opportunities/:id`
  - read-backed opportunity detail
- `/ask`
  - read-backed baseline answer
  - 조건이 맞을 때만 personal-aware upgrade
- `/calendar`
  - read-backed calendar projection
- sidebar sync / admin trigger
  - HTTP command facade 상태

즉 StrataWiki 는 frontend 에 직접 드러나는 PKM UI 구조라기보다,
**WAS 뒤에 있는 write authority + read authority + optional personal knowledge backend** 로 보이는 편이 맞습니다.

## Verification

현재 구현 기준 최소 smoke:

```bash
npm run smoke:live
```

이 smoke 가 확인하는 범위:

- WorkNet ingestion trigger path
- WAS real summary / list / detail / ask / sync
- StrataWiki DB count sanity check

HTTP smoke:

```bash
npm run smoke:http
```

이 smoke 는 HTTP write / ask / command surface 를 검증합니다.

## Remaining Future Direction

다음은 아직도 future direction 으로 남아 있는 항목입니다.

- full PKM document hierarchy
- ask save/history UX
- frontend 가 personal knowledge object graph 를 직접 이해하는 계약
- read-backed ask 를 personal-aware ask 로 전면 대체했다는 설명

graph terminology note:

- StrataWiki graph
  - internal dependency / retrieval support concern
- Jobs-Wiki graph
  - user-facing projection concern

## Rule Of Thumb

현재 구현을 한 줄로 요약하면 아래가 가장 정확합니다.

- write 는 HTTP 우선, wrapper 는 rollback
- read 는 `http` default + `sql` fallback
- ask 는 read-backed baseline 위에 optional personal-aware upgrade
- sync/admin 은 HTTP command facade
- target PKM structure 는 future direction 이지 shipped surface 가 아니다
