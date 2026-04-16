---
status: draft
---

# WAS Public API

## Purpose

이 문서는 Jobs-Wiki WAS가 외부 소비자에게 노출할 수 있는 공개 API의 draft 방향을 정리합니다.

현재 단계에서는 이 문서를 final endpoint catalog로 취급하지 않습니다. 이 문서는 public-facing API surface를 어떤 축으로 나눠 생각할지 설명하는 candidate 문서입니다.

## Status

Draft

아직 아래 항목은 확정하지 않습니다.

- 최종 resource naming
- versioning 방식의 세부
- 어떤 API family를 동시에 public stable로 둘지
- workspace-facing API와 domain resource API의 공개 범위 차이

## Public API Families

현재 Jobs-Wiki WAS public API는 성격이 다른 두 family를 가질 수 있습니다.

### Workspace-facing API

개인 지식 공간 탐색과 PKM형 UX를 지원하는 read/command surface입니다.

특징:

- tree
- document
- graph
- calendar
- search
- workspace summary
- personal knowledge query
- command submission and command status

이 family는 현재 [frontend-was.md](/home/yebin/projects/Jobs-Wiki/docs/api/frontend-was.md:1)의 draft contract와 강하게 연결됩니다.
MVP 우선 slice는 [workspace-mvp-read-contract.md](/home/yebin/projects/Jobs-Wiki/docs/api/workspace-mvp-read-contract.md:1)에서 `tree`, `document`, `calendar` 기준선으로 따로 정리합니다.

주의:

- 이 family는 사용자 context와 workspace projection 의존성이 큽니다.
- 따라서 public stable contract로 바로 고정하기보다, frontend 요구사항을 통해 먼저 검증하는 편이 안전합니다.

### Domain/Public Resource API

채용, 기업, 훈련, 직무 등 domain resource를 외부 소비자가 읽기 쉬운 형태로 노출하는 API family입니다.

예시 후보:

- `jobs`
- `recruitments`
- `companies`
- `departments`
- `trainings`

주의:

- 이 family는 workspace projection과 동일하지 않습니다.
- domain/public resource는 사용자별 PKM workspace state를 직접 표현하지 않을 수 있습니다.
- 어떤 resource를 1급 public resource로 둘지는 아직 draft입니다.

## Relationship Between the Two Families

- workspace-facing API는 user-scoped knowledge space 탐색에 초점을 둡니다.
- domain/public resource API는 보다 일반적인 entity/resource 조회에 초점을 둡니다.
- 두 family는 같은 underlying canonical object universe를 공유할 수 있지만, 동일한 contract가 아닙니다.
- Jobs-Wiki는 두 family를 혼합해서 설명하지 않는 편이 좋습니다.

추가 원칙:

- workspace-facing API는 projection contract입니다.
- domain/public resource API는 resource contract입니다.
- 같은 `document` 또는 `recruitment` 관련 데이터가 두 family에 모두 나타날 수 있지만, field selection과 identity semantics는 다를 수 있습니다.
- workspace-facing API는 user context, navigation context, sync visibility를 더 강하게 가집니다.
- domain/public resource API는 projection-specific decoration 없이 더 일반적인 read surface를 지향합니다.

즉:

- `document/graph/calendar/search/tree`는 workspace projection 언어로 설명합니다.
- `jobs/recruitments/companies/trainings`는 domain resource 언어로 설명합니다.

직교 관계:

- workspace-facing API가 domain/public resource API의 단순 wrapper는 아닙니다.
- domain/public resource API도 workspace projection의 축약판으로 정의하지 않습니다.
- 둘은 같은 canonical object universe를 다른 읽기 목적에 맞게 절단한 surface일 수 있습니다.

예시:

- 같은 recruitment object라도 workspace에서는 `calendar item`, `graph node`, `search hit`, `document decoration`으로 읽힐 수 있습니다.
- 반면 domain/public resource API에서는 recruitment resource detail이나 listing item으로 읽힐 수 있습니다.

## Current Candidate Direction

현재 우선순위는 workspace-facing candidate contract를 먼저 정교화하는 것입니다.

이유:

- 제품 정체성이 단순 resource 검색보다 PKM형 workspace에 가깝습니다.
- graph, calendar, file navigation, command delegation은 workspace projection 언어가 더 적합합니다.
- domain/public resource API를 너무 먼저 고정하면 현재 제품 방향보다 좁은 검색 서비스처럼 보일 위험이 있습니다.

따라서 현재 단계에서는 아래를 우선합니다.

- workspace-facing read projection 정리
- 특히 `tree`, `document`, `calendar` MVP read contract 정리
- `retrieve_for_query`와 `query_personal_knowledge` 같은 read-side query assembly 정리
- command lifecycle과 eventual consistency 정리
- read authority / MCP facade boundary 정리

현재 이 우선순위에서 먼저 분명히 하려는 항목:

- candidate response shape
- required vs optional field 성격
- object field / metadata field / projection decoration 구분
- sync state 위치
- object ref / relation ref 사용 방식

반면 아래는 draft로 남깁니다.

- `GET /jobs`
- `GET /recruitments`
- `GET /companies`
- `GET /departments`
- `GET /trainings`

이 resource들은 삭제하는 것이 아니라, 지금 단계에서 final public surface처럼 확정하지 않는다는 뜻입니다.

## Publication Discipline

현재 공식 문서에서 고정 가능한 것:

- workspace-facing API와 domain/public resource API는 구분된 family로 설명합니다.
- workspace-facing API가 현재 제품 정체성을 더 직접 반영하므로 우선 정교화합니다.
- domain/public resource API는 유지 후보이지만 stable scope는 아직 고정하지 않습니다.

아직 draft로 남길 것:

- 두 family를 모두 같은 시점에 public stable로 승격할지
- 외부 소비자별로 workspace projection 접근 범위를 어디까지 허용할지
- domain/public resource API의 최소 canonical entity 집합

공식 docs에 두기 적절한 수준:

- family 간 관계, 목적, 비혼합 원칙
- stable vs candidate 범위
- projection contract와 resource contract의 구분

`dev-wiki`에 남기기 적절한 수준:

- 어떤 외부 소비자가 어떤 family를 먼저 쓰는지에 대한 rollout 메모
- 특정 resource naming 후보 비교안
- domain/public stable 범위를 단계별로 나누는 세부 우선순위

## Public Stability Phasing

현재 권장 phasing은 두 family를 같은 시점에 같은 강도로 stable로 승격하지 않는 것입니다.

### Phase 0: Internal and Candidate

현재 단계:

- workspace-facing API는 frontend 요구 검증을 위한 candidate contract입니다.
- domain/public resource API도 candidate family로만 유지합니다.
- 둘 다 final endpoint naming이나 versioning promise를 고정하지 않습니다.

이 단계에서 고정 가능한 것:

- projection contract와 resource contract를 구분합니다.
- command success와 read visibility를 같은 의미로 취급하지 않습니다.
- external dependency raw shape를 public surface에 직접 새기지 않습니다.

### Phase 1: Workspace-First Stabilization

MVP 이후 유력 방향:

- 먼저 workspace-facing read/command surface 중 반복적으로 검증된 일부를 semi-stable 또는 first stable 후보로 올립니다.
- 우선순위는 `tree`, `document`, `calendar`, `graph`, `search`, `workspace_summary`, `command status` 중 실제 frontend와 external consumer가 공통으로 반복 사용하는 범위입니다.
- 이 단계에서도 endpoint naming보다 projection semantics와 command lifecycle consistency가 더 중요합니다.

채택 조건:

- projection vocabulary가 여러 화면과 consumer에서 일관되게 유지됩니다.
- sync state와 command status semantics가 충분히 검증됩니다.
- read authority / MCP facade 경계가 endpoint 수준에서도 흔들리지 않습니다.

보수적으로 남겨둘 것:

- 외부 consumer에게 모든 workspace projection을 한 번에 개방하는 것
- 아직 화면 의존성이 큰 projection-specific decoration field
- product UX 변화에 따라 흔들릴 가능성이 큰 optional field

### Runtime Binding Before Stabilization

workspace-facing candidate endpoint는 stable 승격 전에 runtime에 먼저 연결될 수 있습니다.
다만 이 경우에도 아래를 함께 유지해야 합니다.

- runtime binding은 candidate endpoint를 실제 router에 올리는 구현 단계일 뿐, stable/public promise가 아닙니다.
- auth, error normalization, logging, dependency injection이 global HTTP concern으로 먼저 정리되어야 합니다.
- personal knowledge query의 GET/POST 분리는 read path discipline으로 유지되어야 하며 command family로 재해석되면 안 됩니다.
- selected external consumer에게 열 수 있는지와 runtime에 연결하는지는 별도 판단입니다.

즉 runtime uplift 조건과 public stabilization 조건은 같은 gate가 아닙니다.

현재 최소 global HTTP concern 기준선:

- auth context
  - authenticated principal을 user/service 수준으로 구분할 수 있어야 합니다.
- capability resolution
  - GET read와 POST regeneration 같은 더 좁은 capability를 분리할 수 있어야 합니다.
- error normalization
  - internal/domain error를 public HTTP error shape로 바꾸는 공통 계층이 있어야 합니다.
- request logging
  - requestId 기준 추적이 가능해야 하며 route business logic와 분리된 상위 concern이어야 합니다.
- registration shape
  - route module이 framework-neutral binding을 노출하고, 상위 runtime이 좁은 registrar interface로 이를 수용할 수 있어야 합니다.

이 기준선은 framework choice가 아니라, runtime에 연결되기 전에 최소한 공통으로 있어야 할 HTTP concern을 설명합니다.

### Phase 2: Selected Domain Resource Stabilization

그 다음 단계 후보:

- domain/public resource API는 workspace contract가 어느 정도 안정된 뒤, 수요가 명확한 resource부터 선택적으로 stable 후보로 올립니다.
- 모든 domain entity를 한 번에 stable family로 만드는 대신, 외부 읽기 수요와 source maturity가 높은 resource부터 좁게 시작하는 편이 맞습니다.

현재 유력 우선순위 후보:

- `jobs`
- `companies`
- `trainings`
- 이후 필요 시 `recruitments`, `departments`

채택 조건:

- 해당 resource가 workspace projection과 분리된 독립 읽기 가치가 있습니다.
- source mapping과 canonical field naming이 비교적 안정적입니다.
- user-scoped workspace context 없이도 의미 있는 외부 read contract가 됩니다.

아직 draft로 남길 것:

- 전체 domain/public resource catalog
- 각 resource family의 final versioning/deprecation policy
- workspace-facing API와 domain/public resource API를 동시에 stable로 승격할지 여부

### Phase 3: Broader Externalization

Extended 단계 이후에나 검토할 항목:

- workspace-facing API의 더 넓은 외부 공개
- richer search/filter semantics
- domain/public resource API의 범위 확대
- external consumer별 capability tier 차등화

이 단계의 전제:

- product core vocabulary가 충분히 안정됨
- projection semantics와 resource semantics가 혼동 없이 분리됨
- access control, quota, compatibility policy를 명시할 수 있음

## Stability Gate

특정 family 또는 endpoint를 stable 후보로 올리기 전에 확인할 기준:

- semantic stability
  - 같은 이름이 여러 문서와 화면에서 같은 뜻으로 쓰입니다.
- boundary stability
  - read path / command path / ingestion 경계가 endpoint 설계에 그대로 유지됩니다.
- sync stability
  - acceptance, conflict, partial visibility, refresh hint semantics가 일관됩니다.
- field discipline
  - document surface, metadata, projection decoration, resource field가 혼합되지 않습니다.
- consumer independence
  - 특정 frontend 구현 세부가 public contract에 과도하게 새겨지지 않습니다.

## Candidate Public Surface

### Workspace-facing Candidate Endpoints

현재 후보:

- `GET /workspace/tree`
- `GET /workspace/documents/{id}`
- `GET /workspace/calendar`
- `GET /workspace/graph`
- `GET /workspace/search`
- `GET /workspace/summary`
- `GET /workspace/personal-knowledge/query`
- `POST /workspace/personal-knowledge/regenerations`
- `POST /workspace/commands`
- `GET /workspace/commands/{id}`

이 endpoint shape 자체도 draft입니다. 핵심은 endpoint 이름보다 projection family와 command boundary입니다.

추가 방향:

- `GET /workspace/personal-knowledge/query`는 search endpoint의 alias가 아닙니다.
- 이 endpoint는 read-side query assembly result를 consumer-facing envelope로 반환하는 후보입니다.
- current draft에서는 `retrieve_for_query` raw debug payload보다 `present_query_personal_knowledge` envelope를 우선합니다.
- current draft에서는 GET 기준 `ephemeral` generation만 허용합니다.
- `persisted` regeneration은 `POST /workspace/personal-knowledge/regenerations` 같은 별도 candidate surface에 두는 편이 맞습니다.
- raw retrieval/bundle debug는 public query flag로 노출하지 않습니다.
- `GET /workspace/personal-knowledge/query`는 frontend 전용으로 닫기보다, selected external consumer와도 같은 draft envelope를 공유할 수 있는 workspace-facing read surface로 유지하는 편이 맞습니다.
- 반면 persisted regeneration POST surface는 더 좁은 candidate 범위로 남기고 broad external stabilization은 보류합니다.
- 현재 기준으로 `POST /workspace/personal-knowledge/regenerations`는 frontend와 tightly scoped approved consumer까지만 여는 편이 맞습니다.
- broad external consumer 기본 공개는 endpoint semantics, quota, auth tier가 더 안정된 뒤에 검토하는 편이 안전합니다.
- approved consumer 최소 gate는 auth, narrow capability, quota control 세 축으로 설명하는 편이 맞습니다.

### Domain/Public Resource Candidates

현재 후보:

- `GET /jobs`
- `GET /jobs/{jobId}`
- `GET /recruitments`
- `GET /recruitments/{recruitmentId}`
- `GET /companies/{companyId}`
- `GET /departments/{departmentId}`
- `GET /trainings`

이 resource family는 유지 후보이지만, 현재 단계에서는 product core를 정의하는 기준선으로 삼지 않습니다.

## Conventions

공통 후보 항목:

- versioning strategy
- pagination
- filtering
- error format
- authentication

원칙:

- public contract는 external dependency raw shape를 직접 노출하지 않습니다.
- command success와 read projection visibility를 같은 의미로 취급하지 않습니다.
- draft 단계에서는 canonical storage 구현과 DB ownership을 public API 계약에 새기지 않습니다.

## Stability Rules

- breaking change 절차는 final stable API 범위가 정해진 뒤 구체화합니다.
- deprecated field 정책은 public stable family가 정해진 뒤 세분화합니다.
- 현재 문서의 resource와 endpoint는 모두 candidate 수준으로 봅니다.

## Open Questions

- workspace-facing API와 domain/public resource API를 모두 public stable family로 가져갈지
- 어떤 domain entity를 1급 public resource로 둘지
- 외부 소비자별로 workspace projection 접근 범위를 어디까지 허용할지
