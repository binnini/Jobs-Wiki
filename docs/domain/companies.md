# Companies Domain

## Status

Draft

이 문서는 확정된 WAS API 스펙이 아니라 기업 도메인의 canonical model 후보를 정리하기 위한 문서입니다.

## Purpose

기업 관련 데이터를 외부 API 구조와 분리해서 내부적으로 어떤 개념으로 다룰지 정리합니다.

주요 목적:

- 채용 기업 정보와 강소기업 계열 정보를 어떤 모델로 볼지 정리
- 기업 목록과 기업 상세의 경계를 정의
- source별 차이를 내부 표준 후보 모델로 흡수

## Stable Concepts

- `CompanySummary`
  목록/검색에 필요한 최소 정보
- `CompanyProfile`
  기업 소개, 사업 내용, 복리후생, 연혁 등을 포함한 상세 정보
- `CompanyBadge`
  강소기업, 청년친화강소기업 같은 분류/라벨 개념 후보

## Candidate Models

### CompanySummary

유력 필드:

- `companyId`
- `name`
- `companyType`
- `businessNumber`
- `regionName`
- `homepage`
- `introSummary`

미정 사항:

- `companyId`를 WorkNet `empCoNo` 중심으로 둘지 별도 내부 id를 둘지
- 강소기업 계열 목록에도 동일한 `companyId` 체계를 적용할 수 있는지

### CompanyProfile

유력 필드:

- `companyId`
- `name`
- `companyType`
- `businessNumber`
- `homepage`
- `introSummary`
- `intro`
- `mainBusiness`
- `coordinates`
- `welfare`
- `history`
- `talentKeywords`
- `badges`

의도:

- 공채기업 상세와 강소기업/청년친화강소기업 계열 정보를 장기적으로 통합할 수 있는 후보 모델

### CompanyBadge

후보 예시:

- `small-giant`
- `youth-friendly-small-giant`
- `small-giant-experience-provider`

미정 사항:

- badge를 enum처럼 고정할지 source metadata로 유지할지

## Canonical Field Candidates

| Candidate Field | Meaning |
| --- | --- |
| `companyId` | 기업 식별자 후보 |
| `name` | 기업명 |
| `companyType` | 기업 구분명 |
| `businessNumber` | 사업자등록번호 |
| `homepage` | 홈페이지 |
| `introSummary` | 기업 소개 요약 |
| `intro` | 기업 소개 상세 |
| `mainBusiness` | 주요 사업 |
| `regionName` | 지역명 |
| `badges` | 기업 라벨 목록 |

## Source Mapping

현재 확인된 주요 WorkNet 대응:

| WorkNet Source | External Field | Candidate Internal Field |
| --- | --- | --- |
| 공채기업목록 | `empCoNo` | `companyId` |
| 공채기업목록 | `coNm` | `name` |
| 공채기업목록 | `coClcdNm` | `companyType` |
| 공채기업목록 | `busino` | `businessNumber` |
| 공채기업상세 | `coIntroSummaryCont` | `introSummary` |
| 공채기업상세 | `coIntroCont` | `intro` |
| 공채기업상세 | `mainBusiCont` | `mainBusiness` |
| 공채기업상세 | `homepg` | `homepage` |
| 강소기업 | `coNm` | `name` |
| 강소기업 | `regionNm` | `regionName` |
| 강소기업 | `sgBrandNm` | `badges[]` 후보 |
| 청년친화강소기업 | `coNm` | `name` |

## Known Source Oddities

- 기업 source마다 식별자 체계가 다를 수 있습니다.
- 강소기업 계열은 공채기업의 `empCoNo`와 직접 연결되지 않을 수 있습니다.
- 어떤 source는 좌표나 상세 소개가 없고, 어떤 source는 라벨 정보만 강합니다.

## Nullability and Fallback Rules

- `name`은 가능한 한 필수에 가깝게 취급
- `companyId`는 source마다 없을 수 있어 장기적으로 별도 내부 식별 전략이 필요할 수 있음
- `intro`, `mainBusiness`, `homepage`, `coordinates`는 비어 있을 수 있음
- `badges`, `welfare`, `history`, `talentKeywords`는 빈 배열 허용

## Workspace Relevance

company는 workspace object universe에서 recruitment와 강하게 결합되는 contextual object 후보입니다.

- `graph`
  - `recruitment`, `training`, `document`, `activity`와 연결되는 맥락 node가 될 수 있습니다.
- `search`
  - 사용자가 기업 자체를 탐색하거나, 공고 결과를 해석하는 보조 맥락 result가 될 수 있습니다.
- `document`
  - 기업 분석 메모, 지원 전략 문서, 비교 문서에서 `references` 또는 `applies_to` relation target이 될 수 있습니다.
- `workspace_summary`
  - 관심 기업, 최근 본 기업, 강소기업 badge 요약 같은 항목의 근거 object가 될 수 있습니다.
- `calendar`
  - company 자체가 temporal object는 아니지만, recruitment/training 일정의 source context로 함께 노출될 수 있습니다.

## Public API Notes

- 공채기업과 강소기업을 하나의 public resource로 합칠지는 아직 미정
- source-specific 라벨은 public API에서는 정규화된 badge로 노출하는 방향이 유력

## Open Questions

- 공채기업과 강소기업을 같은 `Company`로 통합할 수 있는가
- 기업 식별자는 무엇을 canonical key로 볼 것인가
- badge 체계는 어디까지 정규화할 것인가

## Non-Goals

- 최종 기업 공개 API 스키마 확정
- 공채기업/강소기업 통합 여부 확정
