# Training Domain

## Status

Draft

이 문서는 확정된 WAS API 스펙이 아니라 훈련 도메인의 canonical model 후보를 정리하기 위한 문서입니다.

## Purpose

국민내일배움카드, 사업주훈련, 컨소시엄, 일학습병행처럼 구조가 유사한 여러 훈련 API를 내부적으로 어떤 공통 모델로 다룰지 정리합니다.

현재 recruiting pack v2 기준에서 training source는 recruiting shared fact를 직접 늘리는 primary source가 아니라,
`training_pathway_signal`, `qualification_gap`, `transition_risk` 같은 recruiting interpretation을 보강하는
supporting interpretation source로 먼저 취급합니다.

## Stable Concepts

- `TrainingSummary`
- `TrainingDetail`
- `TrainingSession`
- `TrainingProvider`

## Candidate Models

### TrainingSummary

유력 필드:

- `trainingKind`
- `courseId`
- `courseDegree`
- `providerId`
- `title`
- `subTitle`
- `startDate`
- `endDate`
- `address`
- `trainTarget`
- `realCost`
- `employmentRate3`
- `employmentRate6`

### TrainingDetail

유력 필드:

- `summary`
- `providerName`
- `homepage`
- `contactName`
- `contactEmail`
- `contactPhone`
- `totalTrainingDays`
- `totalTrainingHours`
- `governmentSupportAmount`
- `facilities`
- `equipment`
- `sessions`

### TrainingSession

유력 필드:

- `courseId`
- `courseDegree`
- `courseName`
- `startDate`
- `endDate`
- `fixedCount`
- `participantCount`
- `totalCost`
- `employmentRate3`
- `employmentRate6`

## Canonical Field Candidates

| Candidate Field | Meaning |
| --- | --- |
| `trainingKind` | 훈련 계열 구분 |
| `courseId` | 훈련과정 ID |
| `courseDegree` | 회차 |
| `providerId` | 훈련기관 ID |
| `providerName` | 훈련기관명 |
| `sessions` | 회차별 일정 목록 |

## Source Mapping

| WorkNet Source | External Field | Candidate Internal Field |
| --- | --- | --- |
| 훈련목록 | `trprId` | `courseId` |
| 훈련목록 | `trprDegr` | `courseDegree` |
| 훈련목록 | `trainstCstId` | `providerId` |
| 훈련목록 | `title` | `title` |
| 훈련목록 | `subTitle` | `subTitle` |
| 훈련상세 | `inoNm` | `providerName` |
| 훈련상세 | `hpAddr` | `homepage` |
| 훈련상세 | `trprChap` | `contactName` |
| 훈련일정 | `trStaDt` | `sessions[].startDate` |
| 훈련일정 | `trEndDt` | `sessions[].endDate` |

## Known Source Oddities

- 일학습병행 상세는 `inst_base_info`가 비어도 시설/장비 블록은 존재하는 경우가 있습니다.
- 동일한 구조처럼 보여도 계열마다 제공 필드가 조금씩 다릅니다.
- 취업률은 숫자 대신 상태 코드(`A`, `B`, `C`, `D`)가 올 수 있습니다.

## Nullability and Fallback Rules

- `courseId`는 가능한 한 필수에 가깝게 취급
- `providerId`와 `providerName`은 source에 따라 비어 있을 수 있음
- `sessions`는 빈 배열 허용
- 시설/장비 정보가 없더라도 `TrainingDetail`은 유효할 수 있음

## Workspace Relevance

training은 workspace object universe에서 temporal semantics가 강한 source-backed object 후보입니다.

- `calendar`
  - `sessions[].startDate`, `sessions[].endDate`를 통해 temporal projection item의 source object가 될 수 있습니다.
- `graph`
  - `job`, `company/provider`, `document`, `activity`, `skill`과 연결되는 학습/action node가 될 수 있습니다.
- `search`
  - 사용자가 바로 탐색하고 비교하는 actionable result object가 될 수 있습니다.
- `document`
  - 훈련 비교 노트, 지원 계획, 회고 문서에서 `references`, `targets_job`, `related_to` relation target이 될 수 있습니다.
- `workspace_summary`
  - 예정된 훈련, 관심 과정, 마감 임박 과정 같은 요약 항목의 근거 object가 될 수 있습니다.

## Public API Notes

- 여러 훈련 계열을 하나의 resource로 보여줄지 별도 resource로 분리할지는 아직 미정
- `trainingKind`는 public API에서 유지될 가능성이 높음

## Open Questions

- 훈련 계열별 차이를 어디까지 공통 모델로 흡수할 것인가
- 취업률 상태 코드를 숫자/상태 구조로 정규화할 것인가
- provider 개념을 별도 도메인으로 분리할 것인가

## Non-Goals

- 최종 훈련 공개 API 스키마 확정
- 훈련 계열별 endpoint 분리 정책 확정
