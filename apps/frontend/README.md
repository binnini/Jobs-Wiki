# Frontend

웹 프론트엔드 애플리케이션 디렉터리입니다.

이 레이어는 직접 WorkNet 같은 외부 API를 호출하지 않고, 기본적으로 backend/WAS가 제공하는 내부 API를 소비하는 것을 전제로 합니다.

현재 컨셉 프로토타입 정리본:

- [src/JobsWikiPrototype.jsx](/Users/yebin/workSpace/Jobs-Wiki/apps/frontend/src/JobsWikiPrototype.jsx:1)
  - baseline report, opportunity detail, ask workspace, calendar, workspace를 포함한 standalone prototype component

실행 방법:

1. `cd /Users/yebin/workSpace/Jobs-Wiki/apps/frontend`
2. `npm install`
3. `npm run dev`

루트에서도 바로 실행할 수 있도록 아래 스크립트를 추가했습니다.

- `npm run dev:frontend`
