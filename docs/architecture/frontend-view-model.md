---
status: draft
---

# Frontend View Model

## Purpose

이 문서는 Jobs-Wiki frontend가 WAS 응답을 어떤 화면 블록에 매핑하는지 정의합니다.

현재 기준은 `workspace-first MVP` 입니다.
따라서 view model도 report/opportunity 중심에서 끝나지 않고,
`workspace`, `document`, `personal authoring`, `wiki generation`을 포함해야 합니다.

다만 현재 실제 구현은 이 target view model보다 좁습니다.
지금 살아 있는 구현 중심은 `report / opportunity / ask / calendar` slice이며,
generic workspace shell과 document-centered personal authoring view model은 follow-up입니다.

## Scope

현재 MVP 우선 화면 기준으로 아래를 다룹니다.

- `Workspace Shell`
- `Document Detail`
- `Report Projection`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

## Mapping Rules

### 1. Screen-first Mapping

- field mapping은 canonical object 기준이 아니라 screen block 기준으로 설명합니다.

### 2. Projection-first Naming

- frontend는 `workspace`, `document`, `opportunity`, `summary`, `calendar`, `ask` projection naming을 우선 사용합니다.

### 3. Layer Visibility

- 문서/아이템은 `shared`, `personal_raw`, `personal_wiki` 중 어디에 속하는지 UI에서 표현할 수 있어야 합니다.

### 4. Write Boundary

- `writable`은 UI affordance를 여는 필드입니다.
- `writable: false`인 `shared` 문서에는 편집 affordance를 열지 않습니다.

## Shared View Model Conventions

### Object Identity

```ts
type ObjectIdentity = {
  objectId: string;
  objectKind: string;
  title?: string;
};
```

### Layered Document Ref

```ts
type LayeredDocumentRef = {
  documentRef: ObjectIdentity;
  layer: "shared" | "personal_raw" | "personal_wiki";
  writable: boolean;
};
```

frontend 사용 규칙:

- badge / breadcrumb / toolbar affordance 결정
- route는 동일해도 layer 표시가 달라질 수 있음

## 1. Workspace Shell View Model

### Source Endpoint

- `GET /api/workspace`

### Top-level Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Workspace navigation | `navigation.sections[]` | sidebar / tree / list navigation |
| Section label | `navigation.sections[].label` | `shared`, `personal/raw`, `personal/wiki` 표시 |
| Navigation item | `navigation.sections[].items[]` | 문서/공고/리포트/캘린더 진입 |
| Active projection | `activeProjection` | 현재 메인 pane routing 기준 |

### Section Mapping

| UI field | API path | Notes |
| --- | --- | --- |
| 섹션 key | `sectionId` | required |
| 섹션 제목 | `label` | required |
| 아이템 kind | `items[].kind` | document / opportunity / report / calendar |
| 아이템 layer | `items[].layer` | shared / personal_raw / personal_wiki |
| active 표시 | `items[].active` | optional |

### Workspace Derived Fields

frontend에서 계산하는 항목:

- section open/close
- empty personal 안내 문구
- 현재 section별 item count

## 2. Document Detail View Model

### Source Endpoint

- `GET /api/documents/{documentId}`

### Top-level Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Header | `item.documentRef`, `item.layer`, `item.writable` | 제목, 레이어, 편집 가능 여부 |
| Body | `item.surface.bodyMarkdown` | 본문 표시 |
| Summary | `item.surface.summary` | optional summary block |
| Metadata | `item.metadata` | source, updatedAt, tags |
| Related Objects | `item.relatedObjects[]` | deep-link block |

### Header Mapping

| UI field | API path | Notes |
| --- | --- | --- |
| 문서 제목 | `item.documentRef.title` | required candidate |
| 레이어 badge | `item.layer` | required |
| 편집 가능 여부 | `item.writable` | toolbar 결정 |

### Toolbar Mapping

`shared`

- 표시:
  - `Ask`
  - `요약해서 Wiki 만들기`
  - `재작성`
  - `링크 제안`
- 비표시:
  - 직접 `편집`
  - 직접 `삭제`

`personal_raw`

- 표시:
  - `편집`
  - `삭제`
  - `Ask`
  - `요약`
  - `재작성`

`personal_wiki`

- 표시:
  - `편집`
  - `삭제`
  - `Ask`
  - `링크 보강`

## 3. Report Projection View Model

### Source Endpoint

- `GET /api/workspace/summary`

### Top-level Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Hero headline | derived from summary fields | 리포트 첫 문장 |
| Personal Snapshot | `profileSnapshot` | 프로필 요약 |
| Recommended Opportunities | `recommendedOpportunities[]` | 공고 카드 리스트 |
| Market Brief | `marketBrief` | 시장 신호 |
| Skills Gap | `skillsGap` | 강점/보완 영역 |
| Action Queue | `actionQueue[]` | CTA list |
| Ask Follow-ups | `askFollowUps[]` | Ask 진입용 제안 질문 |

## 4. Opportunity Detail View Model

### Source Endpoint

- `GET /api/opportunities/{opportunityId}`

### Top-level Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Header | `item.surface`, `item.metadata` | 제목, 고용형태, 일정 |
| Company Context | `item.company` | 회사 설명 |
| Role Summary | `item.surface.summary`, `item.surface.descriptionMarkdown` | 직무 요약 |
| Qualification | `item.qualification` | 요구사항, 위치, 전형 |
| Fit Analysis | `item.analysis` | 적합도, 강점, 리스크 |
| Evidence | `item.evidence[]` | 근거 블록 |
| Related Documents | `item.relatedDocuments[]` | 문서 deep-link |

## 5. Ask Workspace View Model

### Source Endpoint

- `POST /api/workspace/ask`

### Request Context Mapping

| UI state | API request field | Notes |
| --- | --- | --- |
| 질문 입력창 | `question` | required |
| 선택 문서 컨텍스트 | `documentId` | optional |
| 선택 공고 컨텍스트 | `opportunityId` | optional |
| 답변 저장 여부 | `save` | optional |

### Response Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Main answer | `answer.markdown` | 메인 분석 패널 |
| Answer meta | `answer.answerId`, `answer.generatedAt` | optional metadata |
| Evidence panel | `evidence[]` | 근거 자료 패널 |
| Related documents | `relatedDocuments[]` | 문서 deep-link |
| Related opportunities | `relatedOpportunities[]` | 컨텍스트 전환 / 상세 보기 |
| Provenance | `provenance` | freshness/explainability hint |

### Ask Action Mapping

UI에서 추가로 필요한 local action:

- `이 결과를 personal/wiki에 저장`
- `현재 문서를 다시 요약`
- `현재 문서를 재작성`

원칙:

- shared 기반 분석 결과도 저장 target은 personal이어야 합니다.

## 6. Calendar View Model

### Source Endpoint

- `GET /api/calendar`

### Top-level Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Timeline list | `items[]` | 일정 리스트 |
| Month grid | `items[]` | 날짜별 그룹핑 |

## 7. Deferred Mapping

현재 문서 범위에서 뒤로 미루는 mapping:

- graph node/edge rendering
- advanced search result model
- full command status timeline

## API to UI Checklist

### `GET /api/workspace`

- section label만으로 `shared`, `personal/raw`, `personal/wiki`가 분명히 보이는가
- active item이 없어도 shell이 열리는가

### `GET /api/documents/{documentId}`

- layer와 writable만으로 toolbar 분기가 가능한가
- shared 문서에서 edit affordance가 열리지 않는가

### `POST /api/workspace/ask`

- `documentId` 없이도 동작하는가
- `documentId`가 있을 때 active context가 자연스럽게 보이는가

### `GET /api/workspace/summary`

- report가 workspace 안의 projection으로 읽히는가
- personal snapshot과 추천 공고가 같이 보여도 layer 혼동이 없는가
