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

현재 `apps/was`는 mock-first MVP runtime skeleton을 가지며, `WAS_DATA_MODE=real`일 때는 StrataWiki canonical read DB를 통해 live projection을 읽을 수 있습니다.

- `src/server.js`
  - HTTP server bootstrap과 graceful shutdown
- `src/app.js`
  - app assembly, health endpoint, route mount
- `src/http/`
  - 공통 response helper, error normalization, request parsing
- `src/routes/`
  - workspace / opportunity / calendar route family
- `src/services/`
  - endpoint 단위 orchestration
- `src/mappers/`
  - internal normalized record -> WAS response shape
- `src/adapters/`
  - `mock` / `real` mode adapter factory와 family skeleton
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
  - `auto|http|wrapper`
  - 기본 권장값: `auto`
- `STRATAWIKI_BASE_URL`
  - HTTP-first StrataWiki integration base URL
- `STRATAWIKI_API_TOKEN`
  - auth-enabled HTTP 환경용 bearer token
- `STRATAWIKI_HTTP_TIMEOUT_MS`
  - HTTP request timeout
- `STRATAWIKI_CLI_WRAPPER`
  - wrapper rollback path
- `JOBS_WIKI_PROFILE_CONTEXT_CATALOG_PATH`
  - personal-aware ask 에서 provision 할 profile catalog path
- `STRATAWIKI_PERSONAL_QUERY_MODEL_PROFILE`
  - 기본값: `balanced_default`
- `STRATAWIKI_COMMAND_SUBMIT_TOOL`
  - 기본값: `knowledge.command.submit`
- `STRATAWIKI_COMMAND_STATUS_TOOL`
  - 기본값: `knowledge.command.get`
  - 주의: 현재 runtime 이 이 tool 들을 실제로 노출하지 않으면 frontend 의 수동 WorkNet 갱신은 `temporarily_unavailable` 로 실패합니다.
- `STRATAWIKI_GET_PROFILE_CONTEXT_TOOL`
  - 기본값: `get_profile_context`
- `STRATAWIKI_UPSERT_PROFILE_CONTEXT_TOOL`
  - 기본값: `upsert_profile_context`
- `STRATAWIKI_PERSONAL_QUERY_TOOL`
  - 기본값: `query_personal_knowledge`
- `STRATAWIKI_GET_PERSONAL_RECORD_TOOL`
  - 기본값: `get_personal_record`
- `STRATAWIKI_GET_INTERPRETATION_RECORD_TOOL`
  - 기본값: `get_interpretation_record`
- `STRATAWIKI_GET_FACT_RECORD_TOOL`
  - 기본값: `get_fact_record`

기본 health endpoint:

```text
GET /health
```

현재 mock runtime으로 제공되는 MVP baseline route:

- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities`
- `GET /api/opportunities/:opportunityId`
- `GET /api/calendar`
- `GET /api/workspace/sync`
- `POST /api/admin/ingestions/worknet/:sourceId`

기본값은 mock fixture 기반이지만, `WAS_DATA_MODE=real`에서는 위 route들이 StrataWiki fact/relation/snapshot table에서 live data를 읽습니다.

real ask adapter는 현재 HTTP/REST 우선 dual-mode 입니다.

- profile sync: `PUT /api/v1/profile-contexts/{tenant_id}/{user_id}`
- personal query: `POST /api/v1/personal-queries`
- interpretation/status reads:
  - `POST /api/v1/interpretation-builds`
  - `GET /api/v1/jobs/{job_id}`
  - `GET /api/v1/snapshot-status`
  - `GET /api/v1/cache-status/{record_id}`
  - `GET /api/v1/explanations/{layer}/{record_id}`
- resource-specific endpoint 가 없는 record/tool 조회만 generic `/api/v1/tool-calls` 또는 wrapper fallback 을 사용합니다.

wrapper 는 rollback path 로 남아 있고, HTTP path 가 unavailable 일 때만 fallback 됩니다. `save`는 계속 reserved no-op입니다.

real command facade adapter도 `STRATAWIKI_CLI_WRAPPER`를 통해 thin client 구조를 가지며, `workspace/sync`와 admin trigger endpoint에서 같은 경계를 재사용합니다.

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
