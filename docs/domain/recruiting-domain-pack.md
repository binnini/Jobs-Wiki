---
status: draft
---

# Recruiting Domain Pack

## Status

Draft.

이 문서는 `Jobs-Wiki`가 소유하는 `recruiting` domain pack v1 초안을 정리합니다.
현재 목표는 `StrataWiki` validator contract를 최종 확정하는 것이 아니라,
WorkNet 기반 첫 mapper 작업이 바로 붙을 수 있을 정도의 최소 semantic baseline을 고정하는 것입니다.

## Purpose

- `Jobs-Wiki`가 소유할 recruiting canonical vocabulary를 최소 범위로 정합니다.
- 어떤 candidate를 Fact/Relation으로 승격하고, 어떤 candidate를 attribute로 남길지 결정합니다.
- WorkNet `open_recruitment` payload가 어떤 identity hint를 생성해야 하는지 정합니다.
- product UI shape를 canonical schema로 고정하지 않습니다.

## Pack Artifact

- Artifact: `packages/domain-packs/recruiting/v1.json`
- Current source profile: `worknet.open_recruitment`

이 artifact는 runtime code가 아니라, `Jobs-Wiki`가 제안하는 versioned domain definition 초안입니다.

## Canonical Concepts

현재 v1에서 canonical Fact 후보로 승격하는 개념은 아래 3개입니다.

- `job_posting`
  - source-backed hiring opportunity
- `company`
  - hiring organization
- `role`
  - hiring role or occupation

현재 v1에서 canonical Relation 후보로 승격하는 개념은 아래 2개입니다.

- `posted_by`
  - `job_posting -> company`
- `for_role`
  - `job_posting -> role`

## Entity Definitions

### `job_posting`

Required attributes:

- `title`

Important optional attributes:

- `summary`
- `employment_type`
- `opens_at`
- `closes_at`
- `source_url`
- `mobile_source_url`
- `location_text`
- `requirements_text`
- `selection_process_text`

Design note:

- v1의 `job_posting`은 source-scoped object입니다.
- 다른 provider의 공고를 cross-source merge하려고 시도하지 않습니다.

### `company`

Required attributes:

- `name`

Important optional attributes:

- `normalized_name`
- `company_type`
- `homepage_url`
- `business_number`
- `summary`
- `description`
- `main_business`

Design note:

- 기업은 장기적으로 cross-source merge 대상이 될 가능성이 높습니다.
- 그래서 v1부터 `external_id`만이 아니라 `business_number`, `normalized_name` fallback을 같이 둡니다.

### `role`

Required attributes:

- `display_name`

Important optional attributes:

- `normalized_name`
- `source_code`

Design note:

- v1의 `role`은 WorkNet `jobsCode`를 우선 쓰되, 코드가 없을 때는 normalized text fallback을 허용합니다.
- 아직 role taxonomy와 posting-local role title을 분리하지 않습니다.

## Relation Definitions

### `posted_by`

- from: `job_posting`
- to: `company`
- evidence: required

설명:

- 공고와 채용 기업을 연결합니다.
- v1에서는 relation attribute를 따로 두지 않습니다.

### `for_role`

- from: `job_posting`
- to: `role`
- evidence: required

설명:

- 공고와 대상 직무/직업을 연결합니다.
- WorkNet의 `jobs[]`가 여러 개면 복수 relation을 허용합니다.

## Fact Promotion vs Attribute Retention

### Promoted in v1

- `job_posting`
- `company`
- `role`
- `posted_by`
- `for_role`

### Kept as attributes in v1

- `location`
  - `job_posting.location_text`
- `skill`
  - `job_posting.requirements_text`
- `selection_step`
  - `job_posting.selection_process_text`

판단 이유:

- 세 후보 모두 현재 WorkNet에서는 posting-local free text 비중이 큽니다.
- stable identity를 만들 수 있는 공통 source signal이 아직 약합니다.
- 지금 entity로 승격하면 UI-friendly label이나 source 문장 조각을 canonical schema로 너무 일찍 고정하게 됩니다.

### Explicitly excluded from v1 Fact scope

- `location` entity
  - `recruitmentSections[].location`은 section별 자유 텍스트라서 canonical geography identity를 만들기 이릅니다.
- `skill` entity
  - `otherRequirement`, `commonRequirementContent`는 qualification summary에 가깝고, reusable skill ontology로 보기 어렵습니다.
- `selection_step` entity
  - ordered, posting-local, source-noisy structure라서 cross-posting reuse value가 낮습니다.

이 세 후보는 v1에서 버리는 것이 아니라, `job_posting` attribute로 보존합니다.

## Identity Hint Strategy

이 초안은 단일 `external_id` 또는 단일 composite rule보다,
proposal에서 생성되는 identity hint의 우선순위를 pack에 명시하는 `hint_priority` shape를 사용합니다.
이유는 `company`와 `role`이 WorkNet v1에서도 fallback 경로가 둘 이상 필요하기 때문입니다.

### Canonical priority

- `job_posting`
  - `source_id` only
- `company`
  - `external_id` -> `business_number` -> `normalized_name`
- `role`
  - `external_id` -> `normalized_name`

Normalization guidance:

- `source_id`, `external_id`
  - trim only
- `business_number`
  - digits only
- `normalized_name`
  - trim
  - lowercase
  - collapse repeated whitespace

### WorkNet mapper guidance

| Entity | Primary hint | Fallback hints | WorkNet source |
| --- | --- | --- | --- |
| `job_posting` | `source_id` | none | `source.sourceId` / `empSeqno` |
| `company` | `external_id` | `business_number`, `normalized_name` | `company.sourceCompanyId` / `empCoNo`, `company.businessNumber`, normalized `company.name` |
| `role` | `external_id` | `normalized_name` | `jobs[].sourceCode` / `jobsCode`, normalized `jobs[].name` |

Rules:

- `job_posting`은 provider-scoped identity만 허용합니다.
- WorkNet mapper는 `company`와 `role`에 대해 가능한 가장 강한 hint를 먼저 제안해야 합니다.
- stronger hint가 없다고 해서 Fact 자체를 버리지는 않지만, `company`의 name-only fallback merge는 충돌 가능성이 높으므로 manual review 성격으로 다룹니다.

## Projection Hints

v1 projection hint의 목적은 read-side를 완성하는 것이 아니라, pack이 의도한 기본 label/search/time semantics를 정하는 것입니다.

Default title attributes:

- `job_posting.title`
- `company.name`
- `role.display_name`

Searchable attributes:

- `job_posting.title`
- `job_posting.summary`
- `job_posting.location_text`
- `job_posting.requirements_text`
- `company.name`
- `company.summary`
- `company.main_business`
- `role.display_name`

Temporal projection:

- `job_posting.opens_at`
- `job_posting.closes_at`

Default family hint:

- `job_posting -> opportunity`
- `company -> company`
- `role -> role`

## Source Mapping Guidance

이 문서는 WorkNet mapper 구현을 상세 설계하지는 않지만, v1에서 최소한 아래 경계는 지켜야 합니다.

- `posting` block은 `job_posting` Fact 후보 하나를 만듭니다.
- `company` block은 이름이 있으면 `company` Fact 후보를 만들고 `posted_by` relation을 연결합니다.
- `jobs[]`는 non-empty role label마다 `role` Fact 후보를 만들고 `for_role` relation을 연결합니다.
- `recruitmentSections[]`와 `selectionSteps[]`는 v1에서 standalone Fact를 만들지 않고 `job_posting` attribute enrichment에만 사용합니다.

즉 mapper의 역할은 source payload를 domain-aware proposal로 바꾸는 것이지,
section/local text를 억지로 새로운 entity로 승격하는 것이 아닙니다.

### WorkNet v1 mapper retention policy

현재 `open_recruitment` mapper는 아래처럼 pack 허용 범위 안에서만 attribute를 만듭니다.

| WorkNet normalized field | v1 proposal handling |
| --- | --- |
| `posting.title` | `job_posting.title` |
| `posting.summary`, `recruitmentSections[].roleDescription` | `job_posting.summary`로 보존 |
| `posting.employmentType` | `job_posting.employment_type` |
| `posting.startsAt`, `posting.closesAt` | `job_posting.opens_at`, `job_posting.closes_at` |
| `source.sourceUrl`, `source.mobileSourceUrl` | `job_posting.source_url`, `job_posting.mobile_source_url` |
| `recruitmentSections[].location` | `job_posting.location_text`로만 보존 |
| `recruitmentSections[].careerRequirement`, `educationRequirement`, `otherRequirement` | `job_posting.requirements_text`로만 보존 |
| `recruitmentSections[].selectionDescription`, `selectionSteps[]`, `posting.acceptanceAnnouncement` | `job_posting.selection_process_text`로만 보존 |
| `company.*` | `company` Fact 후보 + `posted_by` relation |
| `jobs[]` | `role` Fact 후보 + `for_role` relation |

애매한 필드 정책:

- `posting.notes`는 현재 normalized payload에서 `etcContent`와 `commonRequirementContent`가 섞여 들어올 수 있으므로 v1에서 자동 승격하지 않습니다.
- `posting.applicationMethod`, `posting.requiredDocuments`, `posting.inquiry`, `company.logoUrl`, `company.coordinates`, `recruitmentSections[].openings`, `recruitmentSections[].note`, `attachments[]`는 pack에 대응 attribute가 없어서 v1 proposal에서 제외합니다.
- 즉 v1 mapper는 "보존 가능한 것만 명시적으로 보존"하고, 의미가 불안정한 필드는 proposal layer에 새 이름으로 끌어올리지 않습니다.

## Golden Fixtures

schema governance용 fixture 세트는 아래 경로를 source of truth로 둡니다.

- manifest:
  - `tests/domain-packs/fixtures/recruiting-golden-fixtures.json`
- quick guide:
  - `tests/domain-packs/fixtures/README.md`

v1에서 유지하는 기본 fixture 종류:

- `normal`
  - 정상 WorkNet payload -> 정상 proposal batch
- `missing_company`
  - 회사 정보 누락 시 `company` fact와 `posted_by` omission 검증
- `missing_role`
  - role label 누락 시 `role` fact와 `for_role` omission 검증
- `ambiguous_noisy`
  - noisy whitespace, duplicate signal, fallback identity, ambiguous field omission 검증
- `invalid_proposal`
  - future validator / dry-run에서 rejection taxonomy를 확인하기 위한 intentionally invalid batch

운영 규칙:

- valid fixture는 `source payload`와 `expected proposal batch`를 한 쌍으로 유지합니다.
- invalid fixture는 mapper output golden이 아니라 validator input golden으로 취급합니다.
- 새 fixture를 추가할 때는 기존 fixture 의미를 덮어쓰지 말고 additive case를 우선합니다.
- future source가 `RSS`, `Gmail`이어도 같은 canonical semantics를 검증하려면 같은 manifest에 `sourceProfile`만 추가하면 됩니다.

## Evolution Policy

이 섹션은 recruiting pack과 proposal mapper가 앞으로 어떻게 바뀌어야 하는지 판단 기준을 정합니다.

### Versioning rules

| Change class | Allowed examples | Not allowed in this class |
| --- | --- | --- |
| `patch` | 문서 명확화, 설명/오탈자 수정, fixture 추가, validator-facing note 추가 | accepted entity/relation surface 변경, required attribute 변경, identity semantics 변경 |
| `minor` | optional attribute 추가, optional entity/relation type 추가, projection hint 추가, additive source profile 추가 | 기존 valid proposal invalidation, canonical key 계산 방식 변경, 기존 attribute 의미 재정의 |
| `major` | entity/relation/attribute 제거 또는 rename, required attribute 강화, identity hint 우선순위 변경, canonical merge semantics 변경 | 해당 없음 |

Practical rule:

- 기존에 valid였던 proposal batch가 새 pack version에서 invalid가 되면 기본적으로 `major`입니다.
- 새 pack version이 기존 proposal을 그대로 수용하면서 additive capability만 늘리면 기본적으로 `minor`입니다.
- pack artifact가 그대로이고 fixture/doc/policy만 보강되면 기본적으로 `patch`입니다.

### Deprecation policy

- deprecation은 한 번에 remove하지 않고 최소 두 단계로 진행합니다.
- 먼저 `minor` version에서 deprecated 상태와 replacement를 문서/fixture에 명시합니다.
- old shape와 new shape를 모두 golden fixture로 유지한 뒤, 실제 제거는 다음 `major` version에서 합니다.
- deprecation이 시작되면 fixture manifest에 old/new case가 같이 존재해야 합니다.

### Future entity promotion gates

공통 승격 조건:

- posting-local free text를 넘는 cross-posting reuse 가치가 있어야 합니다.
- stable identity hint 또는 deterministic normalization path가 있어야 합니다.
- evidence가 source span 수준으로 붙을 수 있어야 합니다.
- future source(`RSS`, `Gmail`)에서도 재사용 가능한 canonical 의미가 있어야 합니다.

`location` 승격 조건:

- canonical geography contract가 먼저 정의되어야 합니다.
- 자유 텍스트만이 아니라 region code, deterministic geo resolver, 또는 충돌 허용 가능한 canonical normalization이 있어야 합니다.
- section-local 문장 조각이 아니라 cross-source merge 가능한 location identity를 만들 수 있어야 합니다.

`skill` 승격 조건:

- qualification prose와 reusable skill concept를 구분할 수 있어야 합니다.
- source-independent skill vocabulary 또는 curated alias rule이 있어야 합니다.
- `otherRequirement` 같은 문장에서 exact evidence span을 skill candidate로 안정적으로 뽑을 수 있어야 합니다.

`selection_step` 승격 조건:

- ordered posting-local memo를 넘는 reusable stage model이 있어야 합니다.
- step order, status, temporal semantics를 canonical하게 설명할 수 있어야 합니다.
- 한 공고 내부 checklist가 아니라 여러 source에서 재사용 가능한 stage vocabulary가 있어야 합니다.

### Promotion path

future entity 승격은 아래 순서를 권장합니다.

1. v1-style attribute retention으로 raw/noisy signal을 계속 보존합니다.
2. `minor` version에서 새 entity/relation을 optional additive surface로 도입합니다.
3. old attribute와 new entity를 함께 golden fixture에 넣고 overlap period를 운영합니다.
4. old attribute를 제거하거나 의미를 바꾸는 시점은 `major` version으로만 처리합니다.

### Cross-source reuse rule

`WorkNet`에서 먼저 만든 fixture taxonomy는 source-specific test asset이 아니라,
recruiting canonical semantics를 검증하는 공통 틀로 취급합니다.

즉 future source가 `RSS`, `Gmail`이어도 아래는 재사용 가능합니다.

- fixture kind taxonomy
  - `normal`, `missing_data`, `ambiguous_noisy`, `invalid_proposal`
- identity hint strength 개념
  - stronger id fallback vs name-only/manual-review
- additive promotion path
  - attribute retention -> optional entity introduction -> major removal
- invalid proposal pattern
  - missing required attribute, unknown attribute, evidence insufficiency 같은 rejection class

### Future source onboarding checklist

future source가 `RSS`, `Gmail` 같은 신규 recruiting input을 추가할 때는 아래를 먼저 확인합니다.

1. source payload가 `job_posting`, `company`, `role` 중 어떤 canonical candidate를 안정적으로 만들 수 있는지 명시합니다.
2. 각 candidate에 대해 strongest identity hint와 fallback hint를 source evidence와 함께 적습니다.
3. source-local noisy text가 v1 retained attribute로 들어가는지, 아니면 omission 대상인지 먼저 분류합니다.
4. `normal`, `missing_data`, `ambiguous_noisy` fixture를 source profile별로 최소 하나씩 추가합니다.
5. validator / dry-run reuse를 위해 invalid proposal fixture 하나를 같이 둡니다.
6. 새 source가 기존 pack semantic을 깨지 않으면 `minor`, 기존 valid proposal을 무효화하면 `major`로 취급합니다.

## Open Questions

- `location`을 first-class entity로 승격할 최소 canonical geography contract는 무엇인가
- `skill`을 entity로 올리려면 어떤 source-independent evidence가 더 필요한가
- `role`을 occupation taxonomy와 posting-specific role label로 나눌 필요가 있는가
- `company` name-only fallback merge를 어디까지 자동화할 수 있는가
