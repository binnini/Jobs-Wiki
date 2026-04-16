# Recruitments Domain

## Status

Draft

이 문서는 확정된 WAS API 스펙이 아니라 채용 공고 도메인의 canonical model 후보를 정리하기 위한 문서입니다.

## Purpose

채용 공고 관련 데이터를 외부 API 구조와 분리해서 내부적으로 어떤 개념으로 다룰지 정리합니다.

이 문서가 답하려는 질문은 아래와 같습니다.

- 우리 시스템에서 `채용 공고`를 어떤 단위로 식별할 것인가
- 목록/검색용 요약과 상세 조회용 모델을 어떻게 나눌 것인가
- 기업, 직업, 문서, 일정과 연결되는 recruitment object를 어떤 공통 개념으로 설명할 것인가
- 아직 확정되지 않은 필드는 무엇인가

## Stable Concepts

현재 시점에서 비교적 안정적으로 볼 수 있는 개념은 아래와 같습니다.

- `RecruitmentSummary`
  - 목록, 검색, 캘린더, graph decoration에 필요한 최소 정보
- `RecruitmentDetail`
  - 단일 채용 공고의 본문, 조건, 접수 기간, 기업 맥락을 담는 상세 정보
- `RecruitmentPeriod`
  - 접수 시작/마감/발표 예정 등 시간 의미가 강한 필드 그룹 후보
- `RecruitmentContact`
  - 채용 담당 부서, 전화, 이메일 같은 연락 정보 후보

## Candidate Models

### RecruitmentSummary

채용 공고 목록 또는 검색 결과에 필요한 최소 모델 후보입니다.

유력 필드:

- `recruitmentId`
- `title`
- `companyName`
- `companyId`
- `jobTitle`
- `employmentType`
- `regionName`
- `openDate`
- `closeDate`
- `status`

의도:

- 검색 결과, 리스트 카드, 캘린더 item source object, graph/document decoration에 사용
- 공고 상세 조회와 deep-link의 anchor 역할

미정 사항:

- `recruitmentId`를 source identifier 중심으로 둘지 별도 canonical id를 둘지
- `jobTitle`을 단순 텍스트로 둘지 `jobId` 참조와 함께 둘지
- `status`를 source 원문 기준으로 둘지 정규화 enum으로 둘지

### RecruitmentDetail

채용 공고 상세 화면 또는 외부 소비자가 단일 공고를 조회할 때 사용하는 통합 모델 후보입니다.

유력 필드:

- `recruitmentId`
- `title`
- `companyId`
- `companyName`
- `summary`
- `description`
- `employmentType`
- `experienceLevel`
- `educationRequirement`
- `regionName`
- `salaryText`
- `openDate`
- `closeDate`
- `applicationUrl`
- `applicationMethod`
- `status`
- `jobTitle`
- `jobId`
- `contacts`
- `sourceMetadata`

의도:

- 외부 source의 공고 제목, 본문, 조건, 회사 정보, 지원 링크를 하나의 recruitment object로 묶음
- workspace document, calendar, graph, search에서 공통으로 참조 가능한 상세 concept 제공

미정 사항:

- `summary`와 `description`을 모두 둘지, body 중심 단일 필드로 합칠지
- `salaryText`를 문자열로 유지할지 구조화 salary model로 분리할지
- `applicationMethod`를 단순 텍스트로 둘지 enum/structured field로 둘지

### RecruitmentPeriod

채용 공고의 시간 의미를 별도 개념으로 둘지에 대한 후보 모델입니다.

유력 필드:

- `openDate`
- `closeDate`
- `deadlineText`
- `status`
- `isAlwaysOpen`

의도:

- calendar projection과 status badge, workspace summary에서 시간 의미를 일관되게 설명

미정 사항:

- `closeDate`가 없고 `deadlineText`만 있는 경우를 어떤 canonical shape로 흡수할지
- 상시채용, 채용시마감 같은 source 표현을 어떤 규칙으로 정규화할지

### RecruitmentContact

채용 담당 또는 지원 경로를 설명하는 후보 모델입니다.

유력 필드:

- `departmentName`
- `contactName`
- `phone`
- `email`

미정 사항:

- contact를 recruitment detail 안의 field group으로 둘지 별도 sub-model로 유지할지
- source 부재가 잦을 때 public API에서 유지할 가치가 충분한지

## Canonical Field Candidates

현재 유력한 내부 표준 필드 이름은 아래와 같습니다.

| Candidate Field | Meaning |
| --- | --- |
| `recruitmentId` | 채용 공고 식별자 후보 |
| `title` | 공고 제목 |
| `summary` | 공고 요약 또는 대표 설명 |
| `description` | 공고 본문 또는 상세 설명 |
| `companyId` | 기업 식별자 후보 |
| `companyName` | 기업명 |
| `jobId` | 직업/직무 식별자 후보 |
| `jobTitle` | 직무명 |
| `employmentType` | 고용 형태 |
| `experienceLevel` | 경력 요건 |
| `educationRequirement` | 학력 요건 |
| `regionName` | 근무 지역 |
| `salaryText` | 급여 설명 원문 |
| `openDate` | 모집 시작일 후보 |
| `closeDate` | 모집 마감일 후보 |
| `applicationUrl` | 지원 링크 |
| `applicationMethod` | 지원 방법 설명 |
| `status` | 모집 상태 |
| `contacts` | 담당자/연락처 목록 |

명명 원칙:

- source 원문 필드명을 직접 public/internal model에 노출하지 않는 방향을 우선합니다.
- description 계열은 지나친 미세 분해보다 사람이 읽는 recruitment surface를 유지하는 쪽이 낫습니다.
- status와 period는 calendar/search/workspace summary에서 반복적으로 쓰일 수 있으므로 의미가 드러나는 이름을 우선합니다.

## Source Mapping

현재 recruitment source는 아직 통합 확정 전 단계이므로, 아래는 source-independent한 mapping 원칙 수준으로 둡니다.

유력 대응 축:

| Source Concern | Candidate Internal Field |
| --- | --- |
| source recruitment identifier | `recruitmentId` |
| posting title | `title` |
| hiring company name | `companyName` |
| job / role name | `jobTitle` |
| employment category | `employmentType` |
| experience requirement | `experienceLevel` |
| education requirement | `educationRequirement` |
| work region | `regionName` |
| salary text | `salaryText` |
| posting start date | `openDate` |
| posting end date / deadline | `closeDate` |
| apply link | `applicationUrl` |
| apply instructions | `applicationMethod` |
| posting body | `description` |

원칙:

- source별 recruitment identifier 체계 차이는 integration 계층에서 최대한 흡수합니다.
- 일정 표현이 source마다 달라도 calendar projection에 필요한 최소 semantic field는 `openDate`, `closeDate`, `status` 축으로 설명합니다.
- 기업명, 직무명처럼 source에 텍스트로만 오는 정보도 장기적으로 canonical object ref와 연결될 수는 있지만, 현재 단계에서는 텍스트 fallback을 허용합니다.

## Known Source Oddities

현재 recruitment 계열에서 일반적으로 예상되는 특이사항:

- source마다 recruitment identifier가 안정적이지 않거나 재사용될 수 있습니다.
- 상세 본문은 HTML, 개행 텍스트, 조각 필드 등 서로 다른 형태로 제공될 수 있습니다.
- 마감일이 명시적 날짜가 아니라 `채용시까지`, `상시`, `오늘마감` 같은 텍스트로 제공될 수 있습니다.
- 같은 기업/직무라도 source별로 title, employment type, region 표현이 다를 수 있습니다.
- 지원 링크가 외부 원문 landing page인지 직접 지원 URL인지 구분이 어려울 수 있습니다.

이 특이사항은 integration 계층에서 최대한 흡수하고, domain 모델에는 가능한 한 semantic field만 남기는 방향이 좋습니다.

## Nullability and Fallback Rules

현재 후보 규칙:

- `recruitmentId`, `title`은 가능한 한 필수에 가깝게 취급
- `companyName`, `jobTitle`, `regionName`은 source에 따라 비어 있을 수 있으나 목록/검색에서는 가능한 한 채우는 방향이 유력
- `description`, `salaryText`, `applicationUrl`, `contacts`는 source 부재 시 비어 있을 수 있음
- `openDate`, `closeDate`가 모두 없더라도 `deadlineText` 또는 `status`만으로 공고를 설명할 수 있을 수 있음
- `companyId`, `jobId`는 ref 연결이 불가능할 때 비어 있고 `companyName`, `jobTitle` 텍스트 fallback을 허용

## Workspace Relevance

recruitment는 workspace object universe에서 특히 중요한 source-backed object 후보입니다.

- `calendar`
  - `closeDate` 또는 동등한 deadline semantic을 통해 temporal projection item의 source object가 됩니다.
- `graph`
  - `company`, `job`, `training`, `document`, `activity`와 연결되는 action-oriented node 후보입니다.
- `search`
  - 사용자가 바로 탐색하고 행동으로 옮길 수 있는 result object입니다.
- `document`
  - 사용자 메모, 전략 문서, 비교 문서에서 `references` 또는 `applies_to` relation target이 될 수 있습니다.
- `workspace_summary`
  - 마감 임박, 관심 공고, 최근 확인 공고 같은 요약 항목의 근거 object가 될 수 있습니다.

## Public API Notes

아직 확정은 아니지만 현재 기준 권장 방향은 아래와 같습니다.

- recruitment는 workspace projection과 별도로 public resource candidate가 될 가능성이 높습니다.
- 다만 현재 제품 핵심은 workspace-facing API이므로 recruitment resource를 먼저 final로 고정하지는 않습니다.
- calendar/search/graph에서 쓰이는 recruitment decoration field와 resource detail field를 같은 계약으로 섞지 않는 편이 맞습니다.

## Open Questions

- `recruitmentId`를 어떤 source 기준으로 canonical key로 볼 것인가
- `jobTitle`과 `jobId`를 언제까지 text-first로 유지할 것인가
- 모집 상태와 마감 표현을 어디까지 정규화할 것인가
- 본문 surface를 `summary` + `description`으로 유지할지 단일 body surface로 단순화할지
- recruitment를 source별 family로 나눌지 하나의 canonical object family로 흡수할지

## Non-Goals

이 문서는 다음을 확정하지 않습니다.

- 최종 WAS endpoint shape
- 최종 frontend response schema
- recruitment storage shape
- source-specific ingestion orchestration
