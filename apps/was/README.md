# WAS

웹 서비스의 serving 계층 디렉터리입니다.

이 레이어의 책임:

- 공개 HTTP API 제공
- frontend 및 외부 소비자 요청 처리
- 이 레포 내부 서비스 및 외부 backend 의존성 호출
- 필요 시 ingestion 작업 트리거

이 레이어는 durable ingestion 자체를 담당하지 않습니다.

현재 구현을 시작할 때 우선 보면 좋은 문서:

- [was-runtime-layout.md](/Users/yebin/workSpace/Jobs-Wiki/docs/architecture/was-runtime-layout.md:1)
  - `apps/was` 폴더 구조와 레이어 책임
- [was-adapter-contract.md](/Users/yebin/workSpace/Jobs-Wiki/docs/architecture/was-adapter-contract.md:1)
  - mock/real adapter가 공유해야 하는 interface
- [mvp-api-baseline.md](/Users/yebin/workSpace/Jobs-Wiki/docs/api/mvp-api-baseline.md:1)
  - 현재 구현 우선 endpoint 기준선
- [mvp-api-examples.md](/Users/yebin/workSpace/Jobs-Wiki/docs/api/mvp-api-examples.md:1)
  - request/response example payload

## Current Runtime Status

현재 `apps/was`는 mock-first MVP runtime skeleton을 가집니다.

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

기본 데이터 모드는 `WAS_DATA_MODE=mock` 입니다.

## Run

저장소 루트에서:

```bash
npm run start:was
```

또는 `apps/was` 안에서:

```bash
npm start
```

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

이 route들은 real authority 연결이 아니라 fixture 기반 internal record를 반환합니다.

## Test

```bash
npm run test:was
```
