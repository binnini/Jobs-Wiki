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

현재 `apps/ingestion`은 첫 실행 계약을 고정한 bootstrap runtime을 가집니다.

- `src/config/env.js`
  - ingestion 전용 env loading
- `src/lib/logger.js`
  - JSON line 기반 logger
- `src/lib/cli.js`
  - 수동 실행 옵션 파싱
- `src/jobs/manual-run.js`
  - CLI entrypoint
- `src/jobs/run-worknet-ingestion.js`
  - WorkNet ingestion workflow placeholder
- `src/clients/index.js`
  - downstream client bootstrap placeholder

현재 baseline은 **실행 가능한 skeleton + dry-run/apply 구분**까지입니다.

아직 구현하지 않은 것:

- 실제 WorkNet fetch
- proposal batch 생성
- StrataWiki write
- scheduling / retry / backfill orchestration

## Run

저장소 루트에서:

```bash
npm run ingest:worknet
```

또는 apply baseline 확인:

```bash
npm run ingest:worknet:apply
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
- `INGEST_SOURCE=worknet`
- `WORKNET_SOURCE_ID`
- `STRATAWIKI_BASE_URL`

## Notes

- 현재 `--dry-run`은 기본값입니다.
- `--apply`는 실제 write를 수행하지 않고, 이후 write integration을 위한 execution mode만 구분합니다.
- 실제 fetch는 다음 이슈에서 WorkNet source pipeline으로 연결합니다.
