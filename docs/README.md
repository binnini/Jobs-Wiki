# Docs

이 디렉터리는 Jobs-Wiki 웹 서비스 레포의 문서를 관리합니다.

## Principles

- 이 레포는 웹 서비스 중심 레포입니다.
- MCP 서버 구현은 이 레포에 포함하지 않습니다.
- MCP 기반 클라이언트는 WAS 공개 계약을 소비하는 외부 소비자로 취급합니다.
- Ingestion은 WAS와 분리된 별도 계층으로 다룹니다.
- WAS는 ingestion을 직접 수행하지 않습니다.
- third-party 문서, 내부 도메인 모델, 공개 API 계약을 분리해 관리합니다.
- 개발 중 생성되는 임시 노트, 비교안, 실험 기록은 `dev-wiki/`에 둡니다.

## Sections

- `product/`: 제품 목표와 범위
- `architecture/`: 시스템 구조와 경계
- `api/`: 공개 API 및 외부 연동 계약
- `domain/`: 내부 표준 모델과 도메인 개념
- `operations/`: 환경, 설정, 보안, 관측성
- `third-party/`: 외부 서비스 원문과 정리본

## Official vs Working Docs

- `docs/`: 공식 프로젝트 문서
- `dev-wiki/`: 개발 중 작업 메모와 실험 기록

## Metadata Rule

공식 문서는 필요할 경우 아래와 같은 최소 메타데이터를 가질 수 있습니다.

```md
---
status: draft
working_notes:
  - dev-wiki/architecture/2026-04-15-doc-boundary.md
---
```

규칙:

- `docs/`에서는 `working_notes`만 허용합니다.
- `depends_on` 같은 강한 표현은 사용하지 않습니다.
- `dev-wiki` 문서끼리 연결하는 `related_notes`는 사용하지 않습니다.
