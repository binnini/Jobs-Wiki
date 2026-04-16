# Jobs-Wiki

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
  integrations/
    worknet/    # 외부 WorkNet 연동 계약과 구현
tests/
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
- MCP 서버 구현은 포함하지 않습니다.
- MCP 기반 클라이언트는 WAS 공개 API를 소비하는 외부 소비자로 취급합니다.
- StrataWiki 같은 knowledge backend와 그 DB schema/migration ownership은 이 레포에 포함하지 않습니다.
- Ingestion은 WAS와 분리된 별도 계층으로 다룹니다.
- WAS는 ingestion을 직접 수행하지 않습니다.
- WAS가 할 수 있는 것은 필요 시 ingestion job을 좁은 경계로 요청하는 것뿐입니다.

## Docs Policy

- `docs/`는 공식 설계와 프로젝트 핵심 정보만 담습니다.
- `dev-wiki/`는 개발 중 비교안, 작업 메모, 실험 기록을 위한 작업 노트 공간입니다.

## WorkNet Placement

WorkNet 같은 third-party는 역할별로 분리하는 편이 좋습니다.

- 문서: [docs/third-party/worknet](/home/yebin/projects/Jobs-Wiki/docs/third-party/worknet)
- 외부 연동 코드: [packages/integrations/worknet](/home/yebin/projects/Jobs-Wiki/packages/integrations/worknet)
- serving 계층 소비자: [apps/was](/home/yebin/projects/Jobs-Wiki/apps/was)
- ingestion 계층 소비자: [apps/ingestion](/home/yebin/projects/Jobs-Wiki/apps/ingestion)
- 실호출 테스트: [tests/worknet](/home/yebin/projects/Jobs-Wiki/tests/worknet)
