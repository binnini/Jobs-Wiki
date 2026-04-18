---
status: draft
---

# Non-Functional Requirements

## Purpose

이 문서는 Jobs-Wiki MVP의 비기능 요구사항 기준선을 정리합니다.

현재 목적:

- auth, tenancy, timeout, retry, cache, logging 같은 운영 요구사항을 구현 직전 수준으로 좁게 고정
- frontend, WAS, external dependency 간의 최소 운영 규칙을 맞춤
- mock-first MVP가 실제 runtime으로 이동할 때 흔들리지 않도록 baseline을 제공

## Scope

현재 baseline은 첫 web MVP를 기준으로 합니다.

현재 이 문서가 다루는 것:

- 접근 경계
- single-user baseline
- latency / timeout / retry
- error normalization
- sync/freshness
- observability
- cache
- security / secrets
- 최소 테스트/운영 readiness

현재 이 문서가 다루지 않는 것:

- final SLA/SLO
- production HA topology
- enterprise RBAC
- long-term audit retention

## NFR Baseline Summary

현재 MVP는 아래 원칙을 따릅니다.

- frontend는 WAS만 호출한다
- WAS는 external provider raw shape를 노출하지 않는다
- single-user-first 또는 mock-user-first baseline으로 시작한다
- partial/stale fallback을 허용한다
- read path는 fail-fast + honest degradation을 우선한다
- ask path는 느릴 수 있지만 무한 대기를 허용하지 않는다

## NFR-1 Access Boundary

- frontend는 third-party API를 직접 호출하지 않습니다.
- frontend는 external read authority나 MCP facade를 직접 호출하지 않습니다.
- 모든 사용자-facing HTTP 요청은 WAS를 통해야 합니다.

현재 구현 체크:

- provider key는 frontend에 두지 않습니다.
- WAS가 external dependency를 대신 호출합니다.

## NFR-2 Auth and Tenancy Baseline

현재 MVP baseline:

- single-user-first 또는 mock-user-first
- auth/session 최종 정책은 deferred

현재 최소 규칙:

- user context는 adapter/service 경계에서 optional plain object로 전달할 수 있어야 합니다.
- multi-user isolation을 전제로 한 schema나 ACL 정책은 지금 단계에서 강제하지 않습니다.

현재 명시적 비목표:

- 완성된 로그인/회원가입
- multi-tenant permission model

## NFR-3 Latency and Timeout

현재 MVP는 아래 수준의 timeout baseline을 권장합니다.

### Read Endpoints

- `GET /api/workspace/summary`
  - fast read로 취급
- `GET /api/opportunities`
  - fast read로 취급
- `GET /api/opportunities/{opportunityId}`
  - fast read로 취급
- `GET /api/calendar`
  - fast read로 취급

현재 권장 adapter timeout:

- fast read: 짧게
- stale fallback 가능 시 fail-fast 우선

### Ask Endpoint

- `POST /api/workspace/ask`
  - 일반 read보다 느릴 수 있음

현재 권장:

- read보다 긴 timeout 허용
- 그러나 request path에서 무한 대기는 금지

### Timeout Rule

- timeout이 나면 provider raw error를 그대로 노출하지 않습니다.
- `temporarily_unavailable` 또는 동등 failure class로 정규화합니다.

## NFR-4 Retry Policy

### Read Path

- broad retry보다 fail-fast + stale fallback을 우선합니다.
- 자동 retry는 없거나 최대 1회 수준으로 제한합니다.

### Ask Path

- validation failure에는 retry하지 않습니다.
- temporary failure에만 제한적으로 retry할 수 있습니다.

### Command Path

- 향후 command path는 idempotency key를 전제로 합니다.
- 현재 MVP read slice에서는 command retry를 핵심 요구사항으로 보지 않습니다.

## NFR-5 Error Normalization

WAS는 아래 error class를 안정적으로 구분해야 합니다.

- `validation_failed`
- `conflict`
- `not_found`
- `forbidden`
- `temporarily_unavailable`
- `unknown_failure`

규칙:

- provider raw error를 그대로 외부에 노출하지 않습니다.
- 사용자-facing 응답은 일관된 error envelope를 사용합니다.
- frontend는 code와 retryable 여부로 1차 분기를 할 수 있어야 합니다.

## NFR-6 Freshness and Sync Honesty

현재 MVP는 `sync.visibility`를 정직하게 사용하는 것을 요구합니다.

허용 vocabulary:

- `applied`
- `pending`
- `partial`
- `unknown`
- `stale`

규칙:

- `applied`는 실제 authoritative visibility가 있을 때만 사용합니다.
- 모르면 `unknown` 또는 `stale`로 둡니다.
- partial data가 있으면 전체 화면을 비우지 않습니다.

## NFR-7 Availability and Degradation

현재 MVP는 아래 degradation 원칙을 따릅니다.

- 첫 진입에 필요한 최소 데이터가 없으면 full error 허용
- 이미 last-known data가 있으면 stale/partial 표시를 우선
- block 일부가 비어 있어도 전체 화면을 막지 않음

예시:

- summary는 왔지만 market brief가 없으면 partial render
- ask answer는 왔지만 evidence가 없으면 `no evidence` 안내
- calendar item detail deep-link가 불가능해도 일정 리스트 자체는 유지

## NFR-8 Caching

현재 MVP는 공격적인 cache보다 단순하고 안전한 cache를 우선합니다.

현재 권장:

- `workspace/summary`
  - 짧은 read cache 가능
- `opportunities`
  - 짧은 read cache 가능
- `opportunity detail`
  - 짧은 read cache 가능
- `calendar`
  - 짧은 read cache 가능
- `ask`
  - shared cache 기본 비권장

규칙:

- stale cache를 최신 데이터로 속여서 보여주지 않습니다.
- cache hit 여부보다 사용자-visible freshness honesty를 우선합니다.

## NFR-9 Observability

MVP에서도 최소한 아래 관측 항목은 필요합니다.

### Logs

- request id
- route name
- HTTP status
- adapter name
- latency
- normalized error code

### Metrics

- endpoint success/failure count
- adapter success/failure count
- endpoint latency
- adapter latency

### Tracing

- full distributed tracing은 optional
- 최소한 request id 기반 상관관계 추적은 가능해야 함

## NFR-10 Security and Secrets

기본 원칙:

- secret은 repo에 저장하지 않습니다.
- env/config를 통해 주입합니다.
- least privilege를 기본 원칙으로 합니다.

현재 MVP 최소 규칙:

- external API key, provider token, internal bridge secret은 frontend에 노출하지 않습니다.
- 로그에 raw secret, 전체 resume 본문, 사용자 자유 입력 전체를 그대로 남기지 않습니다.
- 외부 소비자는 WAS 공개 계약만 사용해야 합니다.

## NFR-11 Privacy and Data Handling

현재 MVP는 아래 데이터를 민감하게 취급해야 합니다.

- 이력서 원문
- 사용자 자유 입력
- 생성된 personalized answer
- 개인 문서/노트

현재 최소 규칙:

- 로그에는 전체 원문 대신 id/ref/요약 수준만 남깁니다.
- error payload에 개인 문서 내용이나 provider raw payload를 포함하지 않습니다.

## NFR-12 Build and Test Readiness

현재 MVP 구현 전 최소 기준:

- route integration test 가능
- service unit test 가능
- mapper unit test 가능
- mock adapter contract test 가능

권장 우선순위:

1. mapper unit test
2. service unit test
3. route integration test

## NFR-13 Operational Simplicity

현재 MVP는 복잡한 infra보다 운영 단순성을 우선합니다.

현재 권장:

- mock mode와 real mode를 명확히 분리
- mode 전환은 env 하나로 선택
- route/service 코드는 mode 차이를 몰라야 함

## Readiness Checklist

현재 MVP가 비기능 기준을 충족하려면 아래를 만족하는 것이 좋습니다.

- frontend가 provider를 직접 호출하지 않는다
- WAS가 normalized error shape를 반환한다
- timeout과 retry 정책이 route 밖 adapter/service 레이어에 있다
- stale/partial fallback이 문서화되어 있다
- request id와 latency log가 남는다
- secret이 repo 밖에서 주입된다

## Relationship to Other Docs

이 문서는 아래 문서를 보완합니다.

- `docs/operations/error-handling.md`
- `docs/operations/observability.md`
- `docs/operations/security.md`
- `docs/architecture/was.md`
- `docs/api/was-external-boundaries.md`
- `docs/product/ui-state-spec.md`

현재 구현을 시작할 때는 이 문서를 비기능 기준선으로 삼고,
세부 운영 문서는 필요 시 하위 주제별로 확장하는 것을 권장합니다.
