# Integrations Architecture

## Purpose

외부 API의 인증, 요청 형식, XML/JSON 응답 구조를 내부 코드와 분리합니다.

## Current Integrations

- WorkNet

## Rules

- 외부 응답은 integration 패키지에서 1차 정규화합니다.
- WAS와 ingestion은 integration 계약을 통해서만 외부 데이터를 사용합니다.
- third-party 원문 필드명은 상위 계층 전역으로 퍼지지 않게 합니다.
- integration 패키지는 orchestration 책임을 갖지 않습니다.
- integration 패키지는 ingestion scheduling, retry, crawling loop를 담당하지 않습니다.

## Open Questions

- 공통 재시도 정책
- 공통 timeout 정책
