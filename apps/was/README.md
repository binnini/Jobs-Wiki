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
