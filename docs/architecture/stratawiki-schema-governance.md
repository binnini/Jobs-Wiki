---
status: draft
---

# StrataWiki Schema Governance

## Purpose

이 문서는 `Domain Pack` 기반 구조를 도입할 때,
`StrataWiki`와 `Jobs-Wiki`가 각각 어떤 책임을 지고 어떤 작업을 해야 하는지
에이전트 위임 기준으로 정리합니다.

핵심 원칙은 아래와 같습니다.

- `Jobs-Wiki`는 domain semantics를 제안하고 소유합니다.
- `StrataWiki`는 schema governance와 runtime enforcement를 소유합니다.
- 즉 `Jobs-Wiki`가 제안하고, `StrataWiki`가 승인하고 집행합니다.
- `Jobs-Wiki`는 product/workspace owner이기도 하며, shared substrate를 최종 사용자 경험으로 재구성합니다.

## Ownership Split

### StrataWiki

소유 책임:

- `Domain Pack` registry
- pack validation
- compatibility check
- canonical key resolution
- merge / conflict policy execution
- runtime ingestion gate
- pack lifecycle state
- shared `Fact`/`Interpretation` storage
- snapshot / provenance / stale lifecycle

### Jobs-Wiki

소유 책임:

- recruiting domain pack content
- source-to-proposal mapping
- domain fixtures
- proposal quality tests
- pack evolution proposal
- interpretation family/kind grammar for the recruiting domain
- training/news source expansion criteria for recruiting interpretations
- personal workspace UX and markdown-native product behavior

## Architectural Position

이 ownership split 은 단순 ingestion 분리가 아니라 제품 구조와도 연결됩니다.

- `StrataWiki` 는 lightweight shared substrate runtime 입니다.
- `Jobs-Wiki` 는 recruiting domain product 입니다.
- 따라서 `Jobs-Wiki` 는 shared layer 를 그대로 노출하는 것이 아니라 personal workspace 경험으로 재구성합니다.
- personal layer 의 본체는 markdown 문서이며, shared layer 는 그 personal workspace 를 돕는 공용 context 공급층입니다.

## StrataWiki Agent Backlog

### SW-GOV-1: Define Domain Pack Contract

목표:

- `StrataWiki`가 받아들일 `Domain Pack`의 최소 명세를 고정합니다.

작업:

- manifest 구조 정의
- entity type 정의 구조 설계
- relation type 정의 구조 설계
- identity rule 구조 설계
- merge policy 구조 설계
- projection hint 구조 설계

완료 조건:

- pack JSON shape가 문서와 코드로 명시됨
- validator input contract가 고정됨

### SW-GOV-2: Implement Domain Pack Registry

목표:

- pack을 등록, 조회, 활성화할 수 있는 registry를 만듭니다.

작업:

- registry interface 정의
- pack registration path 구현
- active / deprecated 상태 관리
- domain + version 조회 API 정의

완료 조건:

- 특정 domain/version pack을 런타임에서 조회 가능
- 미등록 pack은 명확한 에러를 반환

### SW-GOV-3: Build Pack Validator

목표:

- 등록 전에 pack 자체의 정합성을 검사합니다.

작업:

- unknown field 검사
- required field 검사
- entity/relation 정의 정합성 검사
- relation endpoint 검사
- identity rule 유효성 검사

완료 조건:

- invalid pack 등록이 차단됨
- 에러 코드가 구조화되어 반환됨

### SW-GOV-4: Build Compatibility Checker

목표:

- 새 pack version이 기존 active version과 충돌하는지 검사합니다.

작업:

- breaking change 규칙 정의
- canonical key rule 변경 감지
- relation cardinality 변경 감지
- required attribute 강화 감지
- migration required 판정

완료 조건:

- pack upgrade 시 compatibility report 생성 가능
- breaking change가 자동 탐지됨

### SW-GOV-5: Implement Proposal Ingestion Gate

목표:

- 등록된 pack 기준으로만 proposal을 승인합니다.

작업:

- `DomainProposalBatch` validate path 구현
- pack version resolution 구현
- identity resolution 구현
- dedupe / merge / conflict 처리 연결
- rejection taxonomy 구현

완료 조건:

- invalid proposal은 Fact로 승격되지 않음
- valid proposal은 canonical Fact/Relation로 반영됨

### SW-GOV-6: Add Dry-Run and Audit Support

목표:

- 실제 반영 전 검증과 변경 추적을 가능하게 합니다.

작업:

- proposal dry-run mode 구현
- pack registration audit trail 구현
- who/when/version 메타데이터 저장

완료 조건:

- pack 등록 이력 조회 가능
- proposal을 dry-run으로 검증 가능

## Jobs-Wiki Agent Backlog

### JW-GOV-1: Author Recruiting Domain Pack v1

목표:

- recruiting domain의 최초 pack을 작성합니다.

작업:

- `job_posting`, `company`, `role` 같은 entity type 정의
- `posted_by`, `for_role` 같은 relation type 정의
- attribute 의미 정의
- identity hint 전략 정의
- projection hint 정의

완료 조건:

- recruiting pack v1 초안이 문서 또는 artifact로 존재
- domain owner 관점의 의미 정의가 합의됨

### JW-GOV-2: Define WorkNet-to-Proposal Mapping

목표:

- `packages/integrations/worknet`의 normalized payload를 proposal로 바꾸는 규칙을 고정합니다.

작업:

- `posting -> job_posting`
- `company -> company`
- `jobs -> role`
- `recruitmentSections.location -> location` 여부 결정
- `otherRequirement / summary -> skill` 승격 여부 결정

완료 조건:

- mapping table이 문서화됨
- pack과 mapper가 같은 의미를 사용함

### JW-GOV-3: Implement Recruiting Proposal Mapper

목표:

- 실제 `RecruitingSourcePayload -> DomainProposalBatch` 변환기를 구현합니다.

작업:

- identity hint 생성
- evidence ref 생성
- relation proposal 생성
- unsupported field 처리 정책 정의

완료 조건:

- WorkNet payload 하나를 proposal batch로 변환 가능
- fixture 기반 테스트가 존재

### JW-GOV-4: Create Golden Fixtures

목표:

- domain governance 검증용 표준 예시를 만듭니다.

작업:

- 정상 WorkNet fixture
- 회사 정보 누락 fixture
- role 정보 누락 fixture
- ambiguous skill fixture
- invalid proposal fixture

완료 조건:

- pack 검증과 mapper 검증에 재사용 가능한 fixture 세트가 존재

### JW-GOV-5: Define Domain Evolution Policy

목표:

- recruiting domain pack이 앞으로 어떻게 바뀌는지 기준을 만듭니다.

작업:

- 어떤 변경이 patch/minor/major인지 정의
- skill/location/entity 승격 원칙 정의
- attribute 추가/삭제 정책 정의
- deprecation 정책 정의

완료 조건:

- future pack change를 분류할 명확한 규칙이 문서화됨

### JW-GOV-6: Prepare Future Source Extensions

목표:

- `RSS`, `Gmail` 같은 새 source가 같은 recruiting pack으로 들어올 수 있도록 준비합니다.

작업:

- source별 required evidence shape 정의
- cross-source identity hint 전략 정의
- WorkNet과 다른 source의 공통 attribute surface 정의

완료 조건:

- 새 source가 와도 recruiting pack을 재사용할 수 있는 기준이 존재

## Recommended Execution Order

1. `SW-GOV-1`과 `JW-GOV-1`을 맞물려 진행합니다.
2. `SW-GOV-2`, `SW-GOV-3`와 `JW-GOV-2`를 병렬로 진행합니다.
3. `SW-GOV-4`와 `JW-GOV-4`를 같이 붙여 compatibility와 fixture를 검증합니다.
4. `JW-GOV-3`와 `SW-GOV-5`를 연결해 첫 proposal ingestion 경로를 만듭니다.
5. `SW-GOV-6`과 `JW-GOV-5`로 운영 단계 안전장치를 정리합니다.
6. 마지막으로 `JW-GOV-6`으로 RSS/Gmail 확장 기반을 다집니다.

## Practical Split For Delegation

빠르게 위임하려면 아래처럼 자르는 편이 좋습니다.

- StrataWiki Agent A:
  - `SW-GOV-1`, `SW-GOV-2`
- StrataWiki Agent B:
  - `SW-GOV-3`, `SW-GOV-4`
- StrataWiki Agent C:
  - `SW-GOV-5`, `SW-GOV-6`

- Jobs-Wiki Agent A:
  - `JW-GOV-1`, `JW-GOV-2`
- Jobs-Wiki Agent B:
  - `JW-GOV-3`, `JW-GOV-4`
- Jobs-Wiki Agent C:
  - `JW-GOV-5`, `JW-GOV-6`

## Bottom Line

`schema governance`는 `StrataWiki` 혼자 하는 일이 아닙니다.

- `Jobs-Wiki`는 domain meaning과 변화 요구를 소유합니다.
- `StrataWiki`는 승인 규칙과 runtime truth enforcement를 소유합니다.

그래서 에이전트 위임도
`도메인 설계 축`과 `플랫폼 승인 축`으로 나눠서 진행하는 편이 가장 안정적입니다.
