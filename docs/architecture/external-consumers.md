# External Consumers

## Purpose

이 시스템 외부에서 WAS 기능을 소비하는 주체를 정의합니다.

## Consumers

- Web frontend
- Admin or internal tools
- MCP-based clients
- Future automation clients

## Supported Access Paths

- WAS public HTTP API

## Boundary Rule

- 외부 소비자는 ingestion 계층에 직접 접근하지 않습니다.
- 외부 소비자는 WAS 공개 API만 사용합니다.

## Explicit Non-Goals

- 이 레포는 MCP 서버 구현을 포함하지 않습니다.
- 외부 소비자는 이 레포 내부 패키지를 직접 import하지 않습니다.

## Stability Boundaries

- API path
- request/response schema
- pagination contract
- error contract
- auth model
