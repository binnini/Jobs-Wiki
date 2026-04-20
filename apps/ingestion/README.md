# Ingestion

수집 및 적재 파이프라인 계층 디렉터리입니다.

이 레이어의 책임:

- third-party API fetch
- 추후 crawling
- retry / backfill / scheduling
- source payload normalization 및 적재
- downstream canonicalization 파이프라인 트리거

이 레이어는 request/response serving 계층과 분리됩니다.

## Current Runtime Status

현재 `apps/ingestion`은 WorkNet recruiting source를 fetch하고, proposal batch로
정규화한 뒤, StrataWiki HTTP/REST 경로를 **기본 경로**로 사용해 validate/ingest를
수행합니다. wrapper 경로는 rollback path 로 유지됩니다.

- `src/config/env.js`
  - ingestion 전용 env loading
- `src/lib/logger.js`
  - JSON line 기반 logger
- `src/lib/cli.js`
  - 수동 실행 옵션 파싱
- `src/jobs/manual-run.js`
  - CLI entrypoint
- `src/jobs/fetch-worknet-source-payloads.js`
  - WorkNet source ref/payload fetch, pagination window, fetch success/failure summary baseline
- `src/jobs/map-worknet-payloads-to-proposal-batches.js`
  - normalized payload -> recruiting proposal batch mapping stage와 fact/relation summary baseline
- `src/jobs/run-worknet-ingestion.js`
  - fetch/map stage를 재사용해 proposal batch validate/ingest workflow 실행
- `src/clients/stratawiki-write-client.js`
  - StrataWiki HTTP-first dual-mode write client와 normalized write failure envelope
- `src/clients/index.js`
  - WorkNet provider + StrataWiki dual-mode client bootstrap

현재 baseline은 **WorkNet recruiting dry-run/apply integration path**와 HTTP-first
dual-mode write path 까지입니다.

다음 단계로 남아 있는 것:

- long-lived MCP daemon transport
- profile context explicit refresh UX

## Run

저장소 루트에서:

```bash
npm run ingest:worknet
```

또는 apply baseline 확인:

```bash
npm run ingest:worknet:apply
```

주기 실행:

```bash
npm run ingest:worknet:schedule
```

backfill:

```bash
npm run ingest:worknet:backfill
```

`apps/ingestion` 안에서 직접 실행하려면:

```bash
npm start -- --source worknet --dry-run
```

## Environment

현재 baseline env:

- `INGEST_SERVICE_NAME`
- `INGEST_LOG_LEVEL`
- `INGEST_DRY_RUN=true|false`
- `INGEST_RUN_SUMMARY_DIR`
- `INGEST_SOURCE=worknet`
- `WORKNET_SOURCE_ID`
- `WORKNET_FETCH_PAGE`
- `WORKNET_FETCH_SIZE`
- `INGEST_MAX_ATTEMPTS`
- `INGEST_RETRY_DELAY_MS`
- `INGEST_SCHEDULE_INTERVAL_MS`
- `INGEST_SCHEDULE_CYCLES`
- `WORKNET_BACKFILL_START_PAGE`
- `WORKNET_BACKFILL_PAGES`
- WorkNet auth keys
  - `EMPLOYMENT_INFO` -> `employment`
  - `NATIONAL_TRAINING` -> `nationalTraining`
  - `BUSINESS_TRAINING` -> `businessTraining`
  - `NATIONAL_HUMAN_RESOURCES` -> `consortiumTraining`
  - `JOB_SEEKER_EMPLOYMENT` -> `jobPrograms`
  - `SMALL_GIANT_COMPANY` -> `smallGiant`
  - `DEPARTMENT_INFO` -> `department`
  - `JOB_INFORMATION` -> `jobInfo`
  - `JOB_DESCRIPTIONS` -> `jobDescription`
  - `WORK_WITH_STUDY_TRAINING` -> `workStudy`

`apps/ingestion/src/config/env.js`는 위 env 이름들을 `WorknetClient`의
`keys` shape로 정규화합니다. 다음 alias도 함께 지원합니다.

- `WORKNET_EMPLOYMENT_AUTH_KEY`
- `WORKNET_NATIONAL_TRAINING_AUTH_KEY`
- `WORKNET_BUSINESS_TRAINING_AUTH_KEY`
- `WORKNET_CONSORTIUM_TRAINING_AUTH_KEY`
- `WORKNET_JOB_PROGRAMS_AUTH_KEY`
- `WORKNET_SMALL_GIANT_AUTH_KEY`
- `WORKNET_DEPARTMENT_AUTH_KEY`
- `WORKNET_JOB_INFO_AUTH_KEY`
- `WORKNET_JOB_DESCRIPTION_AUTH_KEY`
- `WORKNET_WORK_STUDY_AUTH_KEY`

- StrataWiki runtime integration
- `STRATAWIKI_CLI_WRAPPER`
  - wrapper fallback / rollback path
  - 현재 expected value:
    `/Users/yebin/workSpace/stratawiki-runtime/bin/stratawiki-jobswiki.sh`
- `STRATAWIKI_INTEGRATION_MODE`
  - `auto|http|wrapper`
  - 기본 권장값: `auto`
- `STRATAWIKI_BASE_URL`
  - HTTP mode base URL
  - 예: `http://127.0.0.1:8080`
- `STRATAWIKI_API_TOKEN`
  - auth-enabled shared HTTP 환경용 bearer token
- `STRATAWIKI_HTTP_TIMEOUT_MS`
  - HTTP request timeout
- `JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS`
  - wrapper fallback 시 `:` separated absolute artifact paths
  - `validate_domain_proposal_batch` / `ingest_domain_proposal_batch` CLI rollback path 에 필요
  - `JOBS_WIKI_STRATAWIKI_ACTIVE_DOMAIN_PACKS`
    - optional active pack mapping
    - example: `recruiting=2026-04-18`

## Notes

- 현재 `--dry-run`은 기본값입니다.
- `--dry-run`은 WorkNet source fetch와 proposal mapping을 수행한 뒤,
  StrataWiki `POST /api/v1/domain-proposals/validate`까지만 호출합니다.
- `--apply`는 validation 성공 후
  `POST /api/v1/domain-proposals/ingest`까지 호출합니다.
- `--mode scheduled`는 interval 기반 반복 실행 entrypoint 입니다.
- `--mode backfill`은 page window 를 순차 실행하면서 aggregation summary 를 만듭니다.
- retry 는 attempt 수와 delay 로 조정할 수 있습니다.
- 각 실행 결과는 JSON summary 파일로 저장됩니다.
- 실패 summary는 `error.code`, `error.retryable`, `error.transport`, `error.operation`을 함께 남깁니다.
- scheduled/backfill success summary는 `retryPolicy`와 실행 window 정보를 함께 남깁니다.
- retry exhaustion failure summary는 `retry`와 `context`를 함께 남겨 어느 cycle/page에서 실패했는지 추적할 수 있습니다.
- `INGEST_RUN_SUMMARY_DIR`가 없으면 시스템 temp 아래
  `jobs-wiki-ingestion-runs/`를 기본 저장 위치로 사용합니다.
- Jobs-Wiki는 StrataWiki DB에 직접 접근하지 않습니다.
- Jobs-Wiki는 HTTP mode 에서 resource-specific REST endpoint 를 우선 사용합니다.
- wrapper fallback 이 필요할 때도 `/Users/yebin/workSpace/stratawiki` 개발 checkout을 직접 호출하지 않습니다.
- wrapper fallback 은 `STRATAWIKI_CLI_WRAPPER`만 통해 StrataWiki를 실행합니다.
- future `query_personal_knowledge` 경로는 `save=false`를 기본값으로 둡니다.

## StrataWiki Modes

### HTTP mode

```bash
STRATAWIKI_INTEGRATION_MODE=auto \
STRATAWIKI_BASE_URL=http://127.0.0.1:8080 \
npm run ingest:worknet
```

### Wrapper fallback mode

```bash
STRATAWIKI_INTEGRATION_MODE=wrapper \
npm run ingest:worknet
```

## StrataWiki CLI Examples

Tool 목록 확인:

```bash
$STRATAWIKI_CLI_WRAPPER list-tools
```

직접 검증:

```bash
$STRATAWIKI_CLI_WRAPPER call validate_domain_proposal_batch --args-file /tmp/proposal-batch.json
```

직접 적재:

```bash
$STRATAWIKI_CLI_WRAPPER call ingest_domain_proposal_batch --args-file /tmp/proposal-batch.json
```

## Ops Runbook

주기 실행 기준선:

```bash
INGEST_DRY_RUN=true \
INGEST_SCHEDULE_CYCLES=3 \
INGEST_SCHEDULE_INTERVAL_MS=60000 \
npm run ingest:worknet:schedule
```

backfill 기준선:

```bash
INGEST_DRY_RUN=false \
WORKNET_BACKFILL_START_PAGE=1 \
WORKNET_BACKFILL_PAGES=5 \
WORKNET_FETCH_SIZE=20 \
npm run ingest:worknet:backfill
```

retry 튜닝:

```bash
INGEST_MAX_ATTEMPTS=3 \
INGEST_RETRY_DELAY_MS=2000 \
npm run ingest:worknet:schedule
```

run summary 확인:

- 기본 저장 위치: `${TMPDIR:-/tmp}/jobs-wiki-ingestion-runs/`
- 커스텀 저장 위치: `INGEST_RUN_SUMMARY_DIR=/path/to/runs`
- scheduled/backfill 실패 시 `retry`, `context`, `error.code`를 먼저 확인합니다.
