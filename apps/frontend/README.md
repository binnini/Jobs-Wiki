# Frontend

웹 프론트엔드 애플리케이션 디렉터리입니다.

이 레이어는 직접 WorkNet 같은 외부 API를 호출하지 않고, 기본적으로 backend/WAS가 제공하는 내부 API를 소비하는 것을 전제로 합니다.

현재 workspace-first MVP entry component:

- [src/JobsWikiPrototype.jsx](src/JobsWikiPrototype.jsx)
  - workspace tree, document detail, ask, report, opportunity, calendar 흐름을 한 컴포넌트 트리로 정리한 현재 MVP shell

## Run

저장소 루트에서 WAS를 먼저 실행합니다.

```bash
npm run start:was
```

그 다음 frontend dev server를 실행합니다.

```bash
npm run dev:frontend
```

또는 `apps/frontend` 안에서 직접 실행할 수 있습니다.

```bash
npm run dev
```

기본 dev proxy:

- `/api`
- `/health`

기본 proxy target:

- `http://127.0.0.1:4310`

다른 WAS 주소를 사용하려면 아래처럼 실행합니다.

```bash
WAS_PROXY_TARGET=http://127.0.0.1:4310 npm run dev:frontend
```

preview/build 같이 proxy가 없는 실행에서는 `VITE_WAS_BASE_URL` 을 사용합니다.

```bash
VITE_WAS_BASE_URL=http://127.0.0.1:4310 npm run preview
```

현재 MVP route baseline:

- `/workspace`
- `/documents/:documentId`
- `/opportunities/:opportunityId`
- `/ask`
- `/calendar`

현재 프론트 구조의 핵심:

- 좌측 `WorkspaceTree` 로 `shared`, `personal/raw`, `personal/wiki`, `calendar` 를 탐색합니다.
- 중앙에서 선택된 document / opportunity / report / calendar projection 을 렌더합니다.
- 우측 `WorkspaceRightPanel` 에 ask, metadata, sync, action surface 를 둡니다.
- shared content 는 read-only 로 보이고, personal/raw 와 personal/wiki 만 writable surface 를 가집니다.

## Smoke Verification

```bash
npm run build
```

루트에서는 아래 단일 명령으로 WAS test와 frontend build smoke를 함께 실행할 수 있습니다.

```bash
npm run verify:mvp
```
