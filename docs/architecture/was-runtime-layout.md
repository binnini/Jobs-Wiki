---
status: draft
---

# WAS Runtime Layout

## Purpose

이 문서는 Jobs-Wiki `apps/was` runtime을 어떤 구조로 시작할지 고정합니다.

기존 문서들이 WAS의 역할과 경계를 설명한다면,
이 문서는 실제 코드 디렉터리와 레이어 책임을 구현 직전 수준으로 좁게 정리합니다.

현재 목적은 아래와 같습니다.

- `apps/was`의 첫 폴더 구조를 흔들리지 않게 시작
- route / service / mapper / adapter 책임을 분리
- mock runtime과 real adapter runtime이 같은 레이어 구조를 공유하도록 고정

## Scope

현재 MVP 우선 endpoint를 기준으로 합니다.

- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/calendar`

이번 문서가 뒤로 미루는 것:

- auth/session runtime
- command status full family
- ingest orchestration runtime
- graph/tree/document full read runtime

## Layout Principles

### 1. Route Is Thin

- route layer는 HTTP concern만 처리합니다.
- request parse, validation invoke, response send까지만 담당합니다.

### 2. Service Owns Use Case

- service layer는 화면/endpoint 단위 use case를 담당합니다.
- service는 adapter를 조합하고 mapper를 호출합니다.

### 3. Adapter Hides Dependency Shape

- external dependency raw payload는 adapter 밖으로 나오지 않습니다.
- WAS 내부에서는 provider-specific field naming이 route까지 올라오지 않도록 합니다.

### 4. Mapper Owns API Projection Shape

- 최종 WAS response shape는 mapper가 만듭니다.
- service는 "무엇을 보여줄지"를 결정하고, mapper는 "어떤 field 이름으로 보낼지"를 결정합니다.

## Proposed Directory Layout

현재 기준 첫 runtime layout은 아래처럼 두는 것이 가장 안전합니다.

```text
apps/was/
  README.md
  package.json
  src/
    server.js
    app.js
    config/
      env.js
    http/
      errors.js
      error-middleware.js
      response.js
    routes/
      workspace-routes.js
      opportunity-routes.js
      calendar-routes.js
    validators/
      workspace-validator.js
      opportunity-validator.js
      calendar-validator.js
    services/
      get-workspace-summary-service.js
      ask-workspace-service.js
      list-opportunities-service.js
      get-opportunity-detail-service.js
      get-calendar-service.js
    mappers/
      workspace-summary-mapper.js
      ask-workspace-mapper.js
      opportunity-list-mapper.js
      opportunity-detail-mapper.js
      calendar-mapper.js
    adapters/
      read-authority/
        create-read-authority-adapter.js
        mock-read-authority-adapter.js
        stratawiki-read-authority-adapter.js
      ask/
        create-ask-adapter.js
        mock-ask-adapter.js
        stratawiki-ask-adapter.js
      command-facade/
        create-command-facade-adapter.js
        mock-command-facade-adapter.js
        stratawiki-command-facade-adapter.js
    domain/
      refs.js
      sync.js
      opportunity.js
      workspace-summary.js
      ask.js
      calendar.js
    fixtures/
      workspace-summary.fixture.js
      opportunities.fixture.js
      ask.fixture.js
      calendar.fixture.js
```

## Layer Responsibilities

## 1. `server.js`

역할:

- HTTP server bootstrap
- port binding
- process-level startup/shutdown handling

규칙:

- business logic를 두지 않습니다.
- app factory만 호출합니다.

## 2. `app.js`

역할:

- middleware 등록
- route mount
- health endpoint 추가 가능

규칙:

- domain mapping을 직접 하지 않습니다.

## 3. `routes/*`

역할:

- endpoint path와 HTTP method 선언
- validator 호출
- service 호출
- mapper 결과 응답

규칙:

- external adapter를 직접 호출하지 않습니다.
- route file 하나가 너무 많은 endpoint family를 가지지 않도록 합니다.

현재 family 기준:

- `workspace-routes.js`
  - `/api/workspace/summary`
  - `/api/workspace/ask`
- `opportunity-routes.js`
  - `/api/opportunities`
  - `/api/opportunities/:opportunityId`
- `calendar-routes.js`
  - `/api/calendar`

## 4. `validators/*`

역할:

- path/query/body validation
- required field 확인
- parse normalization

현재 MVP 기준:

- `workspace-validator`
  - ask request body
- `opportunity-validator`
  - `opportunityId`, list query
- `calendar-validator`
  - `from`, `to`

규칙:

- validation error는 route가 아니라 validator/helper에서 만드는 편이 맞습니다.

## 5. `services/*`

역할:

- endpoint 단위 use case orchestration
- adapter 호출
- fallback policy 결정
- mapper input 모델 생성

예시:

- `get-workspace-summary-service`
  - profile snapshot + recommended opportunities + market brief 조합
- `ask-workspace-service`
  - question + optional opportunity context 처리
- `get-opportunity-detail-service`
  - opportunity + company + qualification + evidence 조합

규칙:

- service는 HTTP object를 직접 받지 않습니다.
- service input은 plain object여야 합니다.

## 6. `mappers/*`

역할:

- service result를 WAS public response shape로 변환
- projection name과 field naming을 고정

규칙:

- mapper는 외부 dependency의 raw field를 알지 않아야 합니다.
- mapper는 `mvp-api-baseline.md`와 `frontend-view-model.md`를 기준으로 작성합니다.

## 7. `adapters/*`

역할:

- external dependency를 호출하거나 mock 데이터를 제공합니다.
- provider-specific field, retry/timeout, error translation을 흡수합니다.

현재 구분:

- `read-authority`
  - summary, opportunity, calendar read
- `ask`
  - ask analysis result 생성
- `command-facade`
  - 현재 slice에서는 optional/deferred

규칙:

- route에서 adapter를 직접 사용하지 않습니다.
- adapter interface는 mock과 real 구현이 동일해야 합니다.

## 8. `domain/*`

역할:

- WAS 내부에서 재사용하는 normalized model
- ref, sync vocabulary, opportunity record 같은 공통 타입/shape

규칙:

- canonical external schema를 그대로 복사하지 않습니다.
- WAS 내부 용어와 UI projection 사이의 중간 언어로 유지합니다.

## 9. `fixtures/*`

역할:

- mock runtime과 테스트에서 재사용하는 fixture 제공

규칙:

- prototype에서 이미 사용하는 sample language와 최대한 맞춥니다.
- fixture는 API final shape보다 adapter/service input 모델에 가깝게 두는 편이 낫습니다.

## Request Flow

## `GET /api/workspace/summary`

권장 흐름:

1. route
2. service
3. read authority adapter
4. service compose
5. mapper
6. response

즉:

```text
workspace-routes
  -> get-workspace-summary-service
  -> read-authority adapter
  -> workspace-summary-mapper
  -> HTTP response
```

## `POST /api/workspace/ask`

권장 흐름:

1. route
2. validator
3. service
4. ask adapter
5. service compose
6. mapper
7. response

즉:

```text
workspace-routes
  -> workspace-validator
  -> ask-workspace-service
  -> ask adapter
  -> ask-workspace-mapper
  -> HTTP response
```

## `GET /api/opportunities/{opportunityId}`

권장 흐름:

1. route
2. validator
3. service
4. read authority adapter
5. mapper
6. response

## Error Handling Placement

### Validation Error

- validator 또는 route helper에서 생성
- 바로 `validation_failed`로 반환

### Adapter Error

- adapter에서 internal normalized error로 변환
- service가 적절한 failure class로 승격 또는 전달
- error middleware가 최종 WAS error shape로 응답

### Unknown Error

- route 안에서 직접 stringify하지 않습니다.
- 공통 error middleware에서 처리합니다.

## Mock-first Runtime Rule

현재 첫 구현은 mock runtime으로 시작하는 것이 자연스럽습니다.

즉:

- route는 실제 route로 만든다
- service는 실제 orchestration 구조로 만든다
- adapter는 우선 mock implementation을 사용한다

이 접근의 장점:

- frontend를 실제 HTTP contract로 먼저 연결할 수 있음
- later replacement가 adapter boundary 안에서 가능함
- prototype의 mock service를 WAS mock fixture로 옮기기 쉬움

## Environment Selection Rule

현재 권장 환경 선택 방식:

```text
WAS_DATA_MODE=mock | real
```

규칙:

- `mock`
  - fixture 기반 adapter 사용
- `real`
  - StrataWiki/read authority 연결 adapter 사용

service와 route는 이 차이를 몰라야 합니다.

## Logging and Observability

MVP에서도 최소한 아래는 남기는 편이 좋습니다.

- request id
- route name
- adapter name
- latency
- error code

현재 단계에서 굳이 복잡한 tracing을 먼저 넣을 필요는 없지만,
adapter 호출 단위 latency는 남기는 편이 좋습니다.

## Test Entry Points

현재 runtime layout에서 테스트 우선순위는 아래처럼 두는 것이 좋습니다.

1. mapper unit test
2. service unit test
3. route integration test

이유:

- field mapping regression을 빨리 잡을 수 있음
- mock adapter로 service behavior를 쉽게 검증할 수 있음
- route test는 얇게 유지 가능함

## Recommended Build Order

현재 `apps/was` 구현 순서는 아래가 가장 안전합니다.

1. `server.js`, `app.js`
2. `http/errors.js`, `error-middleware.js`
3. `fixtures/*`
4. `adapters/read-authority/mock-*`
5. `services/*`
6. `mappers/*`
7. `routes/*`

그 다음:

8. real adapter skeleton
9. route integration test

## Relationship to Other Docs

이 문서는 아래 문서와 함께 봅니다.

- `docs/architecture/was.md`
- `docs/api/was-mvp-contract.md`
- `docs/api/mvp-api-baseline.md`
- `docs/architecture/was-adapter-contract.md`

