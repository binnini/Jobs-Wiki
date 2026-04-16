# Departments Domain

## Status

Draft

이 문서는 확정된 WAS API 스펙이 아니라 학과 도메인의 canonical model 후보를 정리하기 위한 문서입니다.

## Purpose

일반학과와 이색학과처럼 source에서 분리된 구조를 내부적으로 어떤 공통 개념으로 다룰지 정리합니다.

## Stable Concepts

- `DepartmentSummary`
- `DepartmentDetail`
- `DepartmentType`

## Candidate Models

### DepartmentSummary

유력 필드:

- `departmentKey`
- `departmentType`
- `categoryId`
- `departmentId`
- `departmentName`
- `detailDepartmentName`

### DepartmentDetail

유력 필드:

- `departmentKey`
- `departmentType`
- `categoryName`
- `departmentName`
- `introSummary`
- `aptitudeInterest`
- `whatStudy`
- `howPrepare`
- `jobProspect`
- `relatedDepartments`
- `subjects`
- `licenses`
- `relatedJobs`

의도:

- 일반학과/이색학과를 하나의 조회 개념으로 다루되, source-specific 필드는 optional로 보존

## Canonical Field Candidates

| Candidate Field | Meaning |
| --- | --- |
| `departmentKey` | 학과 식별자 후보 |
| `departmentType` | `general` or `special` |
| `categoryId` | 계열 ID |
| `departmentId` | 학과 ID |
| `departmentName` | 학과명 |
| `detailDepartmentName` | 세부학과명 |

## Source Mapping

| WorkNet Source | External Field | Candidate Internal Field |
| --- | --- | --- |
| 학과목록 | `majorGb` | `departmentType` |
| 학과목록 | `empCurtState1Id` | `categoryId` |
| 학과목록 | `empCurtState2Id` | `departmentId` |
| 학과목록 | `knowSchDptNm` | `departmentName` |
| 학과목록 | `knowDtlSchDptNm` | `detailDepartmentName` |
| 일반학과상세 | `schDptIntroSum` | `introSummary` |
| 일반학과상세 | `aptdIntrstCont` | `aptitudeInterest` |
| 이색학과상세 | `whatStudy` | `whatStudy` |
| 이색학과상세 | `howPrepare` | `howPrepare` |
| 이색학과상세 | `jobPropect` | `jobProspect` |

## Known Source Oddities

- 상세 endpoint가 `majorGb` 값에 따라 완전히 분기됩니다.
- 일반학과와 이색학과는 공통 필드도 있지만 제공 정보 밀도가 다릅니다.
- `departmentKey` 같은 단일 식별자는 source에 없고 내부 조합 키 후보입니다.

## Nullability and Fallback Rules

- `departmentType`, `categoryId`, `departmentId`, `departmentName`는 가능한 한 필수
- 일반학과 전용 필드와 이색학과 전용 필드는 서로 비어 있을 수 있음
- 목록만으로도 `DepartmentSummary`는 유효

## Workspace Relevance

department는 workspace object universe에서 진로 맥락을 설명하는 reference object 후보입니다.

- `graph`
  - `job`, `document`, `activity`, `training`과 연결되는 background/reference node가 될 수 있습니다.
- `search`
  - 직접 탐색 대상이 될 수 있지만, 실행 대상보다 진로 이해를 위한 reference result에 가깝습니다.
- `document`
  - 전공 탐색 메모, 진로 비교 문서, 준비 계획 문서에서 `targets_department` 또는 `references` relation target이 될 수 있습니다.
- `workspace_summary`
  - 관심 전공, 탐색 중 전공, 관련 직업 연결 현황 같은 요약 맥락에 기여할 수 있습니다.
- `calendar`
  - department 자체는 temporal object가 아니며, 다른 일정성 object를 해석하는 맥락으로만 등장하는 편이 맞습니다.

## Public API Notes

- public API에서는 일반/이색학과를 하나의 `Department` resource로 보이게 할 가능성이 높음
- 다만 상세 필드 밀도 차이는 optional 필드로 유지하는 방향이 유력

## Open Questions

- `departmentKey`를 단순 조합 문자열로 둘지 별도 구조 객체로 둘지
- 일반/이색학과를 UI와 API 모두 같은 리소스로 볼지

## Non-Goals

- 최종 학과 공개 API 스키마 확정
- `departmentKey` 형식 확정
