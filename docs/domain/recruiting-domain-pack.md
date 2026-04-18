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

## Open Questions

- `location`을 first-class entity로 승격할 최소 canonical geography contract는 무엇인가
- `skill`을 entity로 올리려면 어떤 source-independent evidence가 더 필요한가
- `role`을 occupation taxonomy와 posting-specific role label로 나눌 필요가 있는가
- `company` name-only fallback merge를 어디까지 자동화할 수 있는가
