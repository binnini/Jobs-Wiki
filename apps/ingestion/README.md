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
정규화한 뒤, StrataWiki runtime wrapper를 통해 validate/ingest까지 수행하는
runtime baseline을 가집니다.

- `src/config/env.js`
  - ingestion 전용 env loading
- `src/lib/logger.js`
  - JSON line 기반 logger
- `src/lib/cli.js`
  - 수동 실행 옵션 파싱
- `src/jobs/manual-run.js`
  - CLI entrypoint
- `src/jobs/run-worknet-ingestion.js`
  - WorkNet fetch -> proposal batch -> StrataWiki validate/ingest workflow
- `src/clients/index.js`
  - WorkNet provider + StrataWiki CLI client bootstrap

현재 baseline은 **WorkNet recruiting dry-run/apply integration path**까지입니다.

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
    - Jobs-Wiki가 반드시 호출해야 하는 고정 wrapper
    - 현재 expected value:
      `/Users/yebin/workSpace/stratawiki-runtime/bin/stratawiki-jobswiki.sh`
  - `JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS`
    - `:` separated absolute artifact paths
    - `validate_domain_proposal_batch` / `ingest_domain_proposal_batch`에 필수
  - `JOBS_WIKI_STRATAWIKI_ACTIVE_DOMAIN_PACKS`
    - optional active pack mapping
    - example: `recruiting=2026-04-18`

## Notes

- 현재 `--dry-run`은 기본값입니다.
- `--dry-run`은 WorkNet source fetch와 proposal mapping을 수행한 뒤,
  StrataWiki `validate_domain_proposal_batch`까지만 호출합니다.
- `--apply`는 validation 성공 후
  `ingest_domain_proposal_batch`까지 호출합니다.
- `--mode scheduled`는 interval 기반 반복 실행 entrypoint 입니다.
- `--mode backfill`은 page window 를 순차 실행하면서 aggregation summary 를 만듭니다.
- retry 는 attempt 수와 delay 로 조정할 수 있습니다.
- 각 실행 결과는 JSON summary 파일로 저장됩니다.
- `INGEST_RUN_SUMMARY_DIR`가 없으면 시스템 temp 아래
  `jobs-wiki-ingestion-runs/`를 기본 저장 위치로 사용합니다.
- Jobs-Wiki는 StrataWiki DB에 직접 접근하지 않습니다.
- Jobs-Wiki는 `/Users/yebin/workSpace/stratawiki` 개발 checkout을 직접 호출하지 않습니다.
- Jobs-Wiki는 `STRATAWIKI_CLI_WRAPPER`만 통해 StrataWiki를 실행합니다.
- future `query_personal_knowledge` 경로는 `save=false`를 기본값으로 둡니다.

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
