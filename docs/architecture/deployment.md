# Deployment

## Scope

이 문서는 웹 서비스 레포 관점의 배포 경계를 설명합니다.

## Deployable Units

- frontend
- WAS
- ingestion

## External Systems

- third-party APIs
- external backends
- 외부 소비자(MCP 포함)

## Note

- MCP 서버는 별도 프로젝트에서 배포된다고 가정합니다.
- StrataWiki 같은 knowledge backend와 그 데이터 저장소는 별도 프로젝트에서 소유/배포된다고 가정합니다.
- ingestion은 WAS와 별도 배포 단위가 될 수 있습니다.
- WAS와 ingestion은 독립 배포 가능 경계를 유지하는 것이 원칙입니다.
