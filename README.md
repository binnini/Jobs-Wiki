# Jobs-Wiki

현재 구현 기준은 `workspace-first PKM MVP`입니다.
`report`, `opportunity`, `ask`, `calendar`는 workspace 안의 핵심 projection/flow로 취급합니다.
루트 README보다 더 구체적인 기준선이 필요하면 `docs/README.md`와 `docs/product/mvp-requirements-baseline.md`를 우선합니다.

핵심 문서 진입점:

- [docs/README.md](docs/README.md)
- [docs/product/mvp-requirements-baseline.md](docs/product/mvp-requirements-baseline.md)
- [docs/api/mvp-api-baseline.md](docs/api/mvp-api-baseline.md)
- [docs/operations/non-functional-requirements.md](docs/operations/non-functional-requirements.md)

## Current MVP Run

1. WAS 실행

   ```bash
   npm run start:was
   ```

   기본 주소는 `http://127.0.0.1:4310` 이고, 루트 스크립트는 기본적으로 `WAS_DATA_MODE=real` 로 실행됩니다.
   mock runtime 이 필요하면 `WAS_DATA_MODE=mock npm run start:was` 처럼 명시적으로 덮어씁니다.

2. frontend 실행

   ```bash
   npm run dev:frontend
   ```

   Vite dev server는 기본적으로 `/api` 와 `/health` 를 `http://127.0.0.1:4310` 으로 프록시합니다.
   다른 WAS 주소를 쓰려면 `WAS_PROXY_TARGET=http://host:port npm run dev:frontend` 를 사용합니다.

3. 확인할 MVP route

   - `/onboarding`
   - `/review`
   - `/workspace`
   - `/documents/:documentId`
   - `/report`
   - `/opportunities/:opportunityId`
   - `/ask`
   - `/calendar`

## Current MVP Verification

- 전체 최소 smoke:

  ```bash
  npm run verify:mvp
  ```

- live integration smoke:

  ```bash
  npm run smoke:live
  ```

- StrataWiki HTTP smoke:

  ```bash
  npm run smoke:http
  ```

  이 smoke 는 fixture recruiting fact 를 새로 만들지 않습니다. 빈 recruiting proposal batch 로 HTTP ingest 계약만 확인한 뒤,
  실제로 적재된 live recruiting fact snapshot 을 읽어서 personal query 와 interpretation build 를 검증합니다.
  실행 중 fact pointer 는 일시적으로 smoke snapshot 을 가리킬 수 있지만, 종료 시 원래 recruiting fact snapshot 으로 복원됩니다.
  과거 smoke fixture row 정리가 필요하면:

  ```bash
  npm run smoke:http:cleanup
  ```

- one-command local stack smoke:

  ```bash
  npm run smoke:stack
  ```

  이 경로는 local `Jobs-Wiki WAS` 와 `StrataWiki HTTP runtime` 을 tmux 세션 기준으로 시작 또는 재시작하고,
  예상 포트와 health endpoint 를 확인한 뒤 `npm run smoke:http:cross-repo` 를 이어서 실행합니다.
  느린 real-Ollama publish smoke 까지 같이 보려면:

  ```bash
  npm run smoke:stack -- --with-ollama-publish
  ```

- 수동 WorkNet 갱신:
  - frontend sync 패널은 `POST /api/admin/ingestions/worknet/:sourceId` 를 사용합니다.
  - 이 경로는 현재 runtime 에 `STRATAWIKI_COMMAND_SUBMIT_TOOL`, `STRATAWIKI_COMMAND_STATUS_TOOL` 이 실제로 노출되어 있어야 동작합니다.

- 런타임 확인:

  ```bash
  curl http://127.0.0.1:4310/health
  curl http://127.0.0.1:4310/api/workspace/summary
  ```

## Directory Layout

```text
apps/
  frontend/     # 웹 프론트엔드
  was/          # serving API / request-response 계층
  ingestion/    # 수집, 크롤링, 적재 파이프라인 계층
docs/
  architecture/
  api/
  domain/
  operations/
  product/
  third-party/
    worknet/    # 외부 문서 정리본과 원문 보관
packages/
  domain-packs/ # Jobs-Wiki가 소유하는 versioned domain pack artifacts
  integrations/
    worknet/    # 외부 WorkNet 연동 계약과 구현
tests/
  domain-packs/ # domain pack artifact 검증 테스트
  worknet/      # 실제 WorkNet 호출 스모크 테스트
dev-wiki/       # 개발 중 작업 노트와 실험 기록, gitignored
```

## Why This Layout

- `apps/`: 실제 배포 단위
- `packages/`: 여러 앱이 함께 쓸 수 있는 공유 코드
- `docs/`: 제품, 아키텍처, API, 운영 문서
- `docs/third-party/`: 외부 서비스 문서 원본과 정제본 보관
- `tests/`: 실행 가능한 검증 코드

## Architecture Note

- 이 레포는 웹 서비스 중심 레포입니다.
- 이 레포의 중심 제품 모델은 markdown-native personal workspace 입니다.
- MCP 서버 구현은 포함하지 않습니다.
- MCP 기반 클라이언트는 WAS 공개 API를 소비하는 외부 소비자로 취급합니다.
- StrataWiki 같은 knowledge backend와 그 DB schema/migration ownership은 이 레포에 포함하지 않습니다.
- Jobs-Wiki는 recruiting domain semantics, source normalization, proposal generation, workspace UX 를 소유합니다.
- StrataWiki는 canonical shared `Fact`/`Interpretation` storage 와 runtime governance 를 소유합니다.
- Ingestion은 WAS와 분리된 별도 계층으로 다룹니다.
- WAS는 ingestion을 직접 수행하지 않습니다.
- WAS가 할 수 있는 것은 필요 시 ingestion job을 좁은 경계로 요청하는 것뿐입니다.
- StrataWiki integration 은 현재 HTTP-first baseline 이고, SQL read fallback 은 deprecated compatibility path 로 남아 있습니다.
- resource-specific HTTP endpoint 가 있는 경우 Jobs-Wiki 는 generic tool bridge 보다 해당 endpoint 를 우선 사용합니다.

## Docs Policy

- `docs/`는 공식 설계와 프로젝트 핵심 정보만 담습니다.
- `dev-wiki/`는 개발 중 비교안, 작업 메모, 실험 기록을 위한 작업 노트 공간입니다.

## WorkNet Placement

WorkNet 같은 third-party는 역할별로 분리하는 편이 좋습니다.

- 문서: [docs/third-party/worknet/README.md](docs/third-party/worknet/README.md)
- 외부 연동 코드: [packages/integrations/worknet/README.md](packages/integrations/worknet/README.md)
- serving 계층 소비자: [apps/was/README.md](apps/was/README.md)
- ingestion 계층 소비자: [apps/ingestion/README.md](apps/ingestion/README.md)
- 실호출 테스트: [tests/worknet/README.md](tests/worknet/README.md)
