# WAS

웹 서비스의 serving 계층 디렉터리입니다.

이 레이어의 책임:

- 공개 HTTP API 제공
- frontend 및 외부 소비자 요청 처리
- 이 레포 내부 서비스 및 외부 backend 의존성 호출
- 필요 시 ingestion 작업 트리거

이 레이어는 durable ingestion 자체를 담당하지 않습니다.

현재 구현을 시작할 때 우선 보면 좋은 문서:

- [was-runtime-layout.md](../../docs/architecture/was-runtime-layout.md)
  - `apps/was` 폴더 구조와 레이어 책임
- [was-adapter-contract.md](../../docs/architecture/was-adapter-contract.md)
  - mock/real adapter가 공유해야 하는 interface
- [mvp-api-baseline.md](../../docs/api/mvp-api-baseline.md)
  - 현재 구현 우선 endpoint 기준선
- [mvp-api-examples.md](../../docs/api/mvp-api-examples.md)
  - request/response example payload

## Current Runtime Status

현재 `apps/was`는 mock / real dual-mode runtime 을 가지며, 저장소 루트의 기본 실행 경로는 `WAS_DATA_MODE=real` 입니다.

현재 real mode 는 아래 세 경계를 조합합니다.

- read authority
  - StrataWiki canonical read DB 를 직접 읽는 read-backed projection path
- ask workspace / personal document facade
  - read-backed baseline answer
  - 조건이 맞을 때만 personal-aware upgrade
  - personal document CRUD / wiki generation / link flow 는 StrataWiki personal surface 를 경유
- command facade
  - HTTP command submit/status path

- `src/server.js`
  - HTTP server bootstrap과 graceful shutdown
- `src/app.js`
  - app assembly, health endpoint, route mount
- `src/http/`
  - 공통 response helper, error normalization, request parsing
- `src/routes/`
  - workspace / document / opportunity / calendar / admin route family
- `src/services/`
  - endpoint 단위 orchestration
- `src/mappers/`
  - internal normalized record -> WAS response shape
- `src/adapters/`
  - `mock` / `real` mode adapter factory
  - `read-authority`, `ask`, `command-facade` family
- `src/fixtures/`
  - mock adapter가 반환하는 normalized fixture

루트 저장소의 `npm run dev:was`, `npm run start:was` 는 기본적으로 `WAS_DATA_MODE=real` 로 실행됩니다.
mock runtime 이 필요하면 `WAS_DATA_MODE=mock` 을 명시적으로 지정하십시오.

## Run

저장소 루트에서:

```bash
npm run start:was
```

또는 `apps/was` 안에서:

```bash
npm start
```

주요 환경 변수:

- `WAS_HOST`
- `WAS_PORT`
- `WAS_DATA_MODE=mock|real`
- `WAS_LOG_LEVEL`
- `STRATAWIKI_READ_DATABASE_URL`
  - 기본값: `postgresql://stratawiki:stratawiki@localhost:5432/stratawiki_jobswiki`
- `STRATAWIKI_READ_PSQL_BIN`
  - 기본값: `psql`
- `STRATAWIKI_READ_DOMAIN`
  - 기본값: `recruiting`
- `STRATAWIKI_READ_SCOPE`
  - 기본값: `shared`
- `STRATAWIKI_INTEGRATION_MODE`
  - current baseline 은 `http`
  - legacy `auto|wrapper` compatibility path 는 운영 기준선으로 설명하지 않습니다
- `STRATAWIKI_BASE_URL`
  - HTTP-first StrataWiki integration base URL
- `STRATAWIKI_API_TOKEN`
  - auth-enabled HTTP 환경용 bearer token
- `STRATAWIKI_HTTP_TIMEOUT_MS`
  - HTTP request timeout
- `STRATAWIKI_CLI_WRAPPER`
  - legacy rollback/debug path
  - current HTTP-only 운영 기준선에서는 필요하지 않습니다
- `JOBS_WIKI_PROFILE_CONTEXT_CATALOG_PATH`
  - personal-aware ask 에서 provision 할 profile catalog path
- `STRATAWIKI_PERSONAL_QUERY_MODEL_PROFILE`
  - 기본값: `balanced_default`
- `STRATAWIKI_COMMAND_SUBMIT_TOOL`
  - deprecated legacy tool name
- `STRATAWIKI_COMMAND_STATUS_TOOL`
  - deprecated legacy tool name
- `STRATAWIKI_GET_PROFILE_CONTEXT_TOOL`
  - 기본값: `get_profile_context`
- `STRATAWIKI_UPSERT_PROFILE_CONTEXT_TOOL`
  - 기본값: `upsert_profile_context`
- `STRATAWIKI_PERSONAL_QUERY_TOOL`
  - 기본값: `query_personal_knowledge`
- `STRATAWIKI_GET_PERSONAL_RECORD_TOOL`
  - 기본값: `get_personal_record`
- `STRATAWIKI_LIST_PERSONAL_DOCUMENTS_TOOL`
  - 기본값: `list_personal_documents`
- `STRATAWIKI_GET_PERSONAL_DOCUMENT_TOOL`
  - 기본값: `get_personal_document`
- `STRATAWIKI_CREATE_PERSONAL_DOCUMENT_TOOL`
  - 기본값: `create_personal_document`
- `STRATAWIKI_UPDATE_PERSONAL_DOCUMENT_TOOL`
  - 기본값: `update_personal_document`
- `STRATAWIKI_DELETE_PERSONAL_DOCUMENT_TOOL`
  - 기본값: `delete_personal_document`
- `STRATAWIKI_REGISTER_PERSONAL_ASSET_TOOL`
  - 기본값: `register_personal_asset`
- `STRATAWIKI_SUMMARIZE_PERSONAL_DOCUMENT_TO_WIKI_TOOL`
  - 기본값: `summarize_personal_document_to_wiki`
- `STRATAWIKI_REWRITE_PERSONAL_DOCUMENT_TO_WIKI_TOOL`
  - 기본값: `rewrite_personal_document_to_wiki`
- `STRATAWIKI_STRUCTURE_PERSONAL_DOCUMENT_TO_WIKI_TOOL`
  - 기본값: `structure_personal_document_to_wiki`
- `STRATAWIKI_SUGGEST_PERSONAL_WIKI_LINKS_TOOL`
  - 기본값: `suggest_personal_wiki_links`
- `STRATAWIKI_ATTACH_PERSONAL_WIKI_LINKS_TOOL`
  - 기본값: `attach_personal_wiki_links`
- `STRATAWIKI_GET_INTERPRETATION_RECORD_TOOL`
  - 기본값: `get_interpretation_record`
- `STRATAWIKI_GET_FACT_RECORD_TOOL`
  - 기본값: `get_fact_record`

기본 health endpoint:

```text
GET /health
```

현재 route baseline:

- `GET /api/workspace`
- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities`
- `GET /api/opportunities/:opportunityId`
- `GET /api/documents/:documentId`
- `POST /api/documents`
- `PATCH /api/documents/:documentId`
- `DELETE /api/documents/:documentId`
- `POST /api/assets`
- `POST /api/documents/:documentId/summarize`
- `POST /api/documents/:documentId/rewrite`
- `POST /api/documents/:documentId/structure`
- `POST /api/documents/:documentId/suggest-links`
- `POST /api/documents/:documentId/attach-links`
- `GET /api/calendar`
- `GET /api/workspace/sync`
- `POST /api/admin/ingestions/worknet/:sourceId`

`WAS_DATA_MODE=real` 에서는 아래처럼 동작합니다.

- `workspace`, `workspace/summary`, `opportunities`, `calendar`
  - StrataWiki fact/relation/snapshot table 기반 read projection
- `workspace/ask`
  - read-backed baseline answer
  - profile context catalog 와 StrataWiki personal surface 가 모두 준비된 경우에만 personal-aware upgrade
- `documents`, `assets`, wiki generation, link routes`
  - StrataWiki personal surface 를 통해 user-scoped CRUD / generation / link attachment 처리
- `workspace/sync`
  - 기본값은 read-side projection visibility
  - `commandId` 가 있으면 HTTP command status 까지 포함
- `admin/ingestions/worknet/:sourceId`
  - HTTP command submit

real ask/personal adapter는 현재 HTTP 우선 dual-mode 이지만, baseline 을 아래처럼 이해해야 합니다.

- ask 의 기본값은 read-backed source-first answer 입니다.
- personal query path 는 optional upgrade 입니다.
- `save` 는 계속 reserved no-op 입니다.
- personal authoring path 는 현재 frontend contract 에 이미 노출되어 있습니다.

- 현재 ask baseline 에서 실제로 사용하는 경로:
  - `PUT /api/v1/profile-contexts/{tenant_id}/{user_id}`
  - `POST /api/v1/personal-queries`
  - `GET /api/v1/snapshot-status`
  - resource-specific endpoint 가 없는 record/tool 조회는 generic `/api/v1/tool-calls`
    - `get_profile_context`
    - `get_personal_record`
    - `get_interpretation_record`
    - `get_fact_record`
  - personal document / asset / generation / link family 는 dedicated HTTP endpoint
    - `GET/POST/PATCH/DELETE /api/v1/users/{tenant_id}/{user_id}/personal-documents...`
    - `POST /api/v1/users/{tenant_id}/{user_id}/personal-assets`
    - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/summarize-wiki`
    - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/rewrite-wiki`
    - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/structure-wiki`
    - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/suggest-links`
    - `POST /api/v1/users/{tenant_id}/{user_id}/personal-documents/{document_id}/attach-links`

current command facade adapter는 HTTP command contract 를 사용합니다. `workspace/sync?commandId=...` 와 admin trigger endpoint 는 이 HTTP command 경계를 재사용합니다.

## Test

```bash
npm run test:was
```

런타임 smoke 예시:

```bash
curl http://127.0.0.1:4310/health
curl http://127.0.0.1:4310/api/workspace/summary
```

real read smoke 예시:

```bash
WAS_DATA_MODE=real \
STRATAWIKI_READ_DATABASE_URL=postgresql://stratawiki:stratawiki@localhost:5432/stratawiki_jobswiki \
npm run start:was
```

live integration smoke:

```bash
npm run smoke:live
```

StrataWiki HTTP smoke:

```bash
npm run smoke:http
```

이 smoke 는 recruiting fixture canonical row 를 남기지 않도록 설계되어 있습니다.

- fixture fact 대신 빈 recruiting proposal batch 로 ingest 경계만 확인합니다.
- personal query / interpretation build 는 현재 local DB 의 live recruiting fact snapshot 을 사용합니다.
- smoke 종료 시 recruiting fact pointer 는 이전 snapshot 으로 복원됩니다.

이전 smoke 가 남긴 local fixture row 를 정리하려면:

```bash
npm run smoke:http:cleanup
```

Cross-repo HTTP baseline smoke:

```bash
npm run smoke:http:cross-repo
```

이 smoke 는 이미 실행 중인 `Jobs-Wiki WAS` 와 `StrataWiki HTTP runtime` 을 대상으로 아래 경계를 빠르게 확인합니다.

- `Jobs-Wiki /health`
- `StrataWiki /healthz`
- `Jobs-Wiki -> StrataWiki` personal document create/read/delete
- `StrataWiki /api/v1/commands` submit/status

Operator-friendly local stack smoke:

```bash
npm run smoke:stack
```

이 경로는 local `Jobs-Wiki WAS` 와 sibling `stratawiki` HTTP runtime 을 tmux 세션 기준으로 시작 또는 재시작하고,
health 확인 후 baseline cross-repo smoke 를 실행합니다.
느린 real-provider smoke 까지 같이 보려면:

```bash
npm run smoke:stack -- --with-ollama-publish
```
