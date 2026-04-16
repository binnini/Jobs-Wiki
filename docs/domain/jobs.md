# Jobs Domain

## Status

Draft

이 문서는 확정된 WAS API 스펙이 아닙니다.  
현재는 WorkNet 기반의 내부 canonical model 후보를 정리하는 목적의 문서입니다.

## Purpose

직업 관련 데이터를 외부 API 구조와 분리해서, 내부적으로 어떤 개념으로 다룰지 정리합니다.

이 문서가 답하려는 질문은 아래와 같습니다.

- 우리 시스템에서 `직업`은 어떤 단위로 식별할 것인가
- 직업 검색 결과와 직업 상세는 어떤 개념으로 구분할 것인가
- WorkNet의 여러 상세 API를 어떤 내부 모델로 묶을 것인가
- 아직 확정되지 않은 필드는 무엇인가

## Stable Concepts

현재 시점에서 비교적 안정적으로 볼 수 있는 개념은 아래와 같습니다.

- `JobSummary`
  직업 검색 결과나 목록 화면에 필요한 최소 정보
- `JobDetail`
  단일 직업의 설명, 관련 전공/자격, 임금/전망 등 통합 정보
- `JobMetrics`
  능력/지식/환경/성격/흥미/가치관/업무활동처럼 점수형 비교 데이터
- `RelatedMajor`
  직업과 연결되는 전공
- `RelatedCertificate`
  직업과 연결되는 자격
- `RelatedJob`
  직업 상세에서 함께 노출할 연관 직업

## Candidate Models

### JobSummary

직업 검색 결과에 필요한 최소 모델 후보입니다.

유력 필드:

- `jobId`
  현재는 WorkNet `jobCd`를 그대로 사용하는 후보
- `name`
  직업명
- `classCode`
  직업 분류 코드
- `className`
  직업 분류명

의도:

- 검색 결과, 자동완성, 목록 카드에 사용
- 상세 화면 이동의 식별자 역할

미정 사항:

- `classCode`와 `className`을 public API에 그대로 노출할지
- 분류 체계를 장기적으로 별도 리소스로 분리할지

### JobDetail

직업 상세 화면 또는 외부 소비자가 단일 직업을 조회할 때 사용하는 통합 모델 후보입니다.

유력 필드:

- `jobId`
- `name`
- `largeClassName`
- `middleClassName`
- `smallClassName`
- `summary`
- `way`
- `salaryText`
- `satisfaction`
- `prospectText`
- `statusText`
- `executionJob`
- `technicalKnowledge`
- `relatedMajors`
- `relatedCertificates`
- `relatedOrganizations`
- `relatedJobs`

의도:

- WorkNet의 직업 요약, 하는 일, 교육/자격/훈련, 임금/전망 데이터를 한 개념으로 묶음
- frontend와 외부 소비자가 “직업 하나를 보여주기 위한 데이터”로 사용 가능

미정 사항:

- `salaryText`를 문자열로 유지할지, 별도 구조화 필드로 나눌지
- `prospectText`와 `prospectSummary`를 하나로 합칠지 분리할지
- `executionJob`을 `summary`와 별도 필드로 유지할지

### JobMetrics

직업 상세 중 비교 지표 성격이 강한 데이터를 별도 개념으로 볼지에 대한 후보 모델입니다.

유력 하위 그룹:

- `ability`
- `knowledge`
- `environment`
- `character`
- `interest`
- `values`
- `activity`

각 그룹 안의 유력 필드:

- `name`
- `score`
- `description`
- `scope`
  직업 내 비교인지, 직업 간 비교인지 구분하는 필드 후보

미정 사항:

- `JobDetail` 안에 완전히 포함할지
- 별도 endpoint 또는 별도 public resource로 분리할지
- 점수 스케일을 원문 그대로 둘지 정규화할지

## Canonical Field Candidates

현재 유력한 내부 표준 필드 이름은 아래와 같습니다.

| Candidate Field | Meaning |
| --- | --- |
| `jobId` | 직업 식별자 |
| `name` | 직업명 |
| `summary` | 대표 설명 또는 직무 개요 |
| `way` | 되는 길 또는 준비 경로 |
| `salaryText` | 임금 설명 원문 |
| `satisfaction` | 직업 만족도 |
| `prospectText` | 일자리 전망 설명 원문 |
| `statusText` | 일자리 현황 설명 |
| `executionJob` | 수행 직무 설명 |
| `technicalKnowledge` | 필수 기술/지식 설명 |
| `relatedMajors` | 관련 전공 목록 |
| `relatedCertificates` | 관련 자격 목록 |
| `relatedOrganizations` | 관련 기관/참고 사이트 목록 |
| `relatedJobs` | 관련 직업 목록 |

명명 원칙:

- public API와 internal model 모두에서 WorkNet 원문 필드명을 직접 드러내지 않는 방향을 우선합니다.
- 의미가 불명확한 경우 `...Text`, `...Summary`, `...Metrics`처럼 역할이 보이는 이름을 사용합니다.

## Source Mapping

현재 확인된 주요 WorkNet 대응은 아래와 같습니다.

| WorkNet Source | External Field | Candidate Internal Field |
| --- | --- | --- |
| 직업목록 | `jobCd` | `jobId` |
| 직업목록 | `jobNm` | `name` |
| 직업목록 | `jobClcd` | `classCode` |
| 직업목록 | `jobClcdNM` | `className` |
| 직업상세 요약 | `jobSum` | `summary` |
| 직업상세 요약 | `way` | `way` |
| 직업상세 요약 | `sal` | `salaryText` |
| 직업상세 요약 | `jobSatis` | `satisfaction` |
| 직업상세 요약 | `jobProspect` | `prospectText` |
| 직업상세 하는 일 | `execJob` | `executionJob` |
| 직업상세 교육 | `technKnow` | `technicalKnowledge` |
| 직업상세 교육 | `majorNm` | `relatedMajors[].name` |
| 직업상세 교육 | `certNm` | `relatedCertificates[]` |
| 직업상세 교육 | `orgNm` | `relatedOrganizations[].name` |
| 직업상세 교육 | `orgSiteUrl` | `relatedOrganizations[].url` |
| 직업상세 공통 | `jobLrclNm` | `largeClassName` |
| 직업상세 공통 | `jobMdclNm` | `middleClassName` |
| 직업상세 공통 | `jobSmclNm` | `smallClassName` |

## Known Source Oddities

현재 WorkNet 기준으로 확인된 특이사항:

- 직업 상세 `D01` 응답은 `jobSum` 태그가 중첩되어 있어서 단순 태그 파싱만으로는 대표 설명을 잘못 읽을 수 있습니다.
- 직업 상세 `D02~D07`은 문서상 `JOB_DESCRIPTIONS` 계열처럼 보여도 실제 호출은 `JOB_INFORMATION` 인증키로 성공하는 케이스가 확인됐습니다.
- 상세 API가 여러 개로 분리되어 있어서 “직업 상세”를 한 번의 외부 호출로 얻을 수 없습니다.

이 특이사항은 integration 계층에서 흡수하고, domain 모델에는 가능한 한 노출하지 않는 방향이 좋습니다.

## Nullability and Fallback Rules

현재 후보 규칙:

- `jobId`, `name`는 가능한 한 필수에 가깝게 취급
- `salaryText`, `prospectText`, `executionJob`, `technicalKnowledge`는 source 부재 시 비어 있을 수 있음
- `relatedMajors`, `relatedCertificates`, `relatedOrganizations`, `relatedJobs`는 빈 배열 허용
- metric 데이터가 전부 없어도 `JobDetail` 자체는 유효한 응답으로 볼 수 있음

## Workspace Relevance

job은 workspace object universe에서 reference-heavy object 후보입니다.

- `graph`
  - `recruitment`, `training`, `department`, `skill`, `document`를 해석하는 reference node가 될 수 있습니다.
- `search`
  - 직접 탐색 대상이 될 수 있지만, action object라기보다 해석과 비교를 위한 reference result에 가깝습니다.
- `document`
  - 사용자 메모나 전략 문서에서 `targets_job`, `references`, `related_to` relation target이 될 수 있습니다.
- `workspace_summary`
  - 관심 직무, 목표 직무, 비교 중인 직무 같은 요약 맥락의 근거 object가 될 수 있습니다.
- `calendar`
  - job 자체가 calendar item이 되기보다는 recruitment/training/activity의 시간 해석을 보조하는 reference object에 가깝습니다.

## Public API Notes

아직 확정은 아니지만 현재 기준 권장 방향은 아래와 같습니다.

- public API에는 WorkNet 원문 필드명을 직접 노출하지 않음
- `jobId`는 외부 식별자로 유지할 가능성이 높음
- metric 계열은 별도 필드 그룹으로 묶는 것이 유력
- 설명성 텍스트는 지나친 구조화보다 원문 보존을 우선할 수 있음

## Open Questions

- `JobDetail`에 metric 데이터를 기본 포함할지 선택형으로 둘지
- `salaryText`를 추후 구조화된 salary model로 분해할지
- `relatedOrganizations`를 public API에 유지할지
- 직업 분류 정보는 단순 텍스트로 둘지 별도 taxonomy로 분리할지

## Non-Goals

이 문서는 다음을 확정하지 않습니다.

- 최종 WAS endpoint shape
- 최종 frontend response schema
- versioning 규칙
- 직업 metric의 최종 노출 정책
