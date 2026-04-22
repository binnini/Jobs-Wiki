---
status: draft
---

# Recruiting Interpretation Grammar

## Status

Draft.

이 문서는 `Jobs-Wiki`가 소유하는 recruiting interpretation grammar v2 초안입니다.
canonical shared runtime과 governance는 `StrataWiki`가 소유하지만,
어떤 recruiting insight family/kind를 인정할지는 `Jobs-Wiki`가 domain artifact로 제안합니다.

## Purpose

- recruiting shared layer를 무겁게 만들지 않으면서 reusable insight grammar를 명시합니다.
- fact 최소주의와 interpretation 재사용성 사이의 경계를 문서와 artifact로 함께 설명합니다.
- training/news source가 recruiting insight에 어떻게 기여할 수 있는지 기준을 정합니다.

현재 source of truth artifact:

- [packages/domain-packs/recruiting/v2.json](../../packages/domain-packs/recruiting/v2.json)

## Design Rules

- family는 page template가 아니라 반복 가능한 recruiting 질문 공간입니다.
- kind는 family 안의 reviewable claim shape 입니다.
- 새로운 insight 수요가 생겨도 먼저 interpretation kind로 수용할 수 있는지 검토하고, 그 다음에 fact 승격을 검토합니다.
- training/news는 supporting interpretation source가 될 수 있지만, recruiting pack v2에서 곧바로 recruiting fact가 되지는 않습니다.
- `Jobs-Wiki`는 grammar를 제안하고, `StrataWiki`는 등록/활성화/enforcement를 소유합니다.

## Fact Boundary

v2는 v1의 최소 fact surface를 유지합니다.

- promoted entity: `job_posting`, `company`, `role`
- promoted relation: `posted_by`, `for_role`
- retained attribute:
  - `job_posting.location_text`
  - `job_posting.requirements_text`
  - `job_posting.selection_process_text`

즉 v2의 핵심 변화는 fact 확장이 아니라 interpretation grammar 명시화입니다.

## Family Taxonomy

### `market_trends`

용도:

- role, company, market segment 기준의 반복적인 hiring signal을 설명합니다.

대표 kind:

- `hiring_demand_shift`
- `skill_demand_shift`
- `company_hiring_pattern`
- `location_shift`

좋은 질문 예:

- 특정 role segment의 수요가 최근 강해지고 있는가
- 특정 회사군이 반복적으로 어떤 자격을 요구하는가

### `opportunity_landscape`

용도:

- 지금 어디에 actionable opportunity가 있는지 shared하게 요약합니다.

대표 kind:

- `regional_opportunity_summary`
- `company_opportunity_summary`
- `role_opportunity_summary`
- `training_pathway_signal`

좋은 질문 예:

- 특정 지역/직무 조합에서 현재 기회가 실제로 얼마나 보이는가
- training 공급이 해당 기회 접근성을 보강하는가

### `readiness_risks`

용도:

- recurring barrier, qualification gap, transition friction을 설명합니다.

대표 kind:

- `qualification_gap`
- `competition_pressure`
- `credential_requirement`
- `transition_risk`

좋은 질문 예:

- 어떤 요구 조건이 반복적으로 진입 장벽이 되는가
- role transition에서 어떤 준비 부족이 가장 자주 드러나는가

### `source_health`

용도:

- shared interpretation 자체의 신뢰 범위를 설명합니다.

대표 kind:

- `coverage_gap`
- `staleness_notice`
- `source_conflict`

좋은 질문 예:

- 특정 segment가 한 source에 과도하게 치우쳐 있지 않은가
- 최근 증거가 충분히 새롭고 일관적인가

## Subject Guidance

우선 subject는 아래 축을 권장합니다.

- `role`
- `company`
- `job_posting`
- `market_segment`
- `training_path`
- `source_set`

원칙:

- `role`, `company`, `job_posting`은 pack fact와 직접 연결됩니다.
- `market_segment`, `training_path`, `source_set`은 lightweight derived subject이지만 설명 가능한 key여야 합니다.
- derived subject를 도입해도 shared layer를 별도 heavy ontology로 확장하지 않습니다.

## Source Expansion

### WorkNet

- 역할: `primary_fact_source`
- 현재 recruiting pack v2의 사실상 기준 source
- fact와 interpretation 둘 다의 주 증거로 사용

### Training

- 역할: `supporting_interpretation_source`
- course/provider identity가 안정적이고, role access를 설명하는 경우에만 recruiting insight 근거로 사용
- 기본 처리: pathway, readiness, opportunity kind의 supporting evidence
- 비목표: recruiting pack v2에서 training course 자체를 recruiting fact로 승격

### News

- 역할: `supporting_interpretation_source`
- attributable하고 time-bounded하며 recruiting relevance가 분명한 기사만 사용
- 기본 처리: company/market trend를 보강하거나 source conflict를 설명하는 증거
- 비목표: article 자체를 recruiting fact로 승격

## Evidence Policy

공통 규칙:

- interpretation은 traceable evidence를 가져야 합니다.
- market-wide claim은 단일 anecdote로 publish하지 않습니다.
- training/news는 core recruiting evidence를 대체하지 않고 보강합니다.

family별 기본선:

- `market_trends`
  - 최소 evidence 2개
  - time-bounded evidence 필요
- `opportunity_landscape`
  - 최소 evidence 2개
  - current open signal 필요
- `readiness_risks`
  - 최소 evidence 2개
  - barrier-specific support 필요
- `source_health`
  - 최소 evidence 1개
  - source metadata 필요

## Quality Examples

좋은 예:

- "Recent backend postings repeatedly combine API integration and production AI operation requirements."
  - narrow하고 반복 신호를 설명하며, reusable insight로 읽힙니다.
- "This segment is currently dominated by one provider, so demand intensity should be treated as provisional."
  - 해석 자체의 신뢰 범위를 드러내어 shared layer를 과신하지 않게 합니다.

나쁜 예:

- "One open posting proves the market is booming."
  - 단일 사례를 trend로 과장합니다.
- "Everyone should learn Kubernetes now."
  - recruiting evidence에 anchored 되지 않은 generic advice입니다.

## Prompt Direction

- scoped claim을 우선하고 과장된 시장 서사를 피합니다.
- subject와 change를 먼저 밝히고 generic recommendation으로 흘리지 않습니다.
- coverage bias, freshness, disagreement를 숨기지 않습니다.
- training/news를 쓰더라도 새 recruiting fact를 발명하는 지름길로 쓰지 않습니다.
- 개인화 추천이 아니라 shared reusable insight를 우선합니다.

## Ownership Boundary

- `Jobs-Wiki`
  - recruiting interpretation family/kind grammar 제안
  - source expansion 기준 제안
  - quality examples와 prompt guidance 제안
- `StrataWiki`
  - pack registration / activation
  - runtime validation / enforcement
  - interpretation lifecycle / storage / snapshot governance

즉 grammar는 domain-owned artifact이고, lifecycle은 runtime-owned contract입니다.
