---
status: draft
---

# Frontend View Model

## Purpose

이 문서는 Jobs-Wiki frontend가 WAS 응답을 어떤 화면 블록에 매핑하는지 정의합니다.

현재 문서 세트에서 역할은 아래와 같습니다.

- `ui-screen-spec.md`
  - 화면의 역할과 CTA를 설명
- `ui-state-spec.md`
  - 화면 상태와 fallback을 설명
- `mvp-api-baseline.md`
  - API endpoint와 response shape를 설명
- `frontend-view-model.md`
  - API field가 실제 UI block에 어디 붙는지 설명

즉, 이 문서는 frontend와 WAS가 같은 field vocabulary를 보도록 만드는 구현 기준 문서입니다.

## Scope

현재 MVP 우선 화면 기준으로 아래만 다룹니다.

- `Baseline Report`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

아래는 현재 문서 범위에서 제외합니다.

- full tree explorer
- graph projection
- document detail full mapping
- auth/session view model

## Mapping Rules

### 1. Screen-first Mapping

- field mapping은 canonical object 기준이 아니라 screen block 기준으로 설명합니다.
- 같은 API field라도 서로 다른 화면에서 다른 방식으로 표현될 수 있습니다.

### 2. Projection-first Naming

- frontend는 `job_posting` 같은 canonical naming보다 `opportunity` projection naming을 우선 사용합니다.
- field alias가 필요하면 WAS에서 projection-friendly naming으로 정리합니다.

### 3. Decoration Separation

- canonical identity field와 UI helper field를 구분합니다.
- urgency label, why matched, badge text 같은 값은 decoration으로 취급합니다.

### 4. Null Handling

- optional field는 UI에서 빈칸으로 두지 않고, block-level fallback 규칙을 사용합니다.
- block 전체가 불완전하면 `partial` state와 함께 처리합니다.

## Shared View Model Conventions

### Object Identity

```ts
type ObjectIdentity = {
  objectId: string;
  objectKind: string;
  title?: string;
};
```

frontend 사용 규칙:

- detail 진입 anchor로 사용
- React key/selection state anchor로 사용
- canonical identity가 필요할 때만 사용

### Opportunity Identity

```ts
type OpportunityIdentity = {
  opportunityId: string;
  title?: string;
};
```

frontend 사용 규칙:

- 공고 상세 라우팅 anchor
- Ask context anchor
- 연관 공고 전환 anchor

## 1. Baseline Report View Model

### Source Endpoint

- `GET /api/workspace/summary`

### Top-level Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Hero headline | derived from `recommendedOpportunities.length`, `skillsGap.recommendedToStrengthen.length` | 리포트 첫 문장 생성 |
| Personal Snapshot | `profileSnapshot` | 목표 직무, 경력, 학력, 지역, 도메인, 핵심 역량 |
| Recommended Opportunities | `recommendedOpportunities[]` | 공고 카드 리스트 |
| Market Brief | `marketBrief` | 시장 신호, rising skills, notable companies |
| Skills Gap | `skillsGap` | strong / requested / recommendedToStrengthen |
| Action Queue | `actionQueue[]` | CTA list |
| Ask Follow-ups | `askFollowUps[]` | Ask 진입용 제안 질문 |

### Personal Snapshot Mapping

| UI field | API path | Notes |
| --- | --- | --- |
| 목표 직무 | `profileSnapshot.targetRole` | required |
| 경력 | `profileSnapshot.experience` | required |
| 학력 | `profileSnapshot.education` | optional |
| 지역 | `profileSnapshot.location` | optional |
| 도메인 | `profileSnapshot.domain` | optional |
| 핵심 역량 chip | `profileSnapshot.skills[]` | 최대 표시 개수는 UI에서 제한 가능 |
| 입력 소스 요약 | `profileSnapshot.sourceSummary[]` | optional |

### Recommended Opportunities Mapping

각 카드의 최소 매핑은 아래처럼 둡니다.

| 카드 요소 | API path | Notes |
| --- | --- | --- |
| 카드 key | `item.opportunityRef.opportunityId` | required |
| 제목 | `item.surface.title` | required |
| 회사명 | `item.surface.companyName` | required candidate |
| 역할 label | `item.surface.roleLabels[]` | optional |
| 요약 | `item.surface.summary` | optional |
| 고용 형태 | `item.metadata.employmentType` | optional |
| 마감일 | `item.metadata.closesAt` | optional but highly recommended |
| 상태 badge | `item.metadata.status` | optional |
| urgency label | `item.decoration.urgencyLabel` | optional |
| why matched | `item.decoration.whyMatched` | strongly recommended |

### Action Queue Mapping

| UI element | API path | Notes |
| --- | --- | --- |
| 액션 label | `actionQueue[].label` | required |
| 액션 설명 | `actionQueue[].description` | optional |
| 연관 공고 anchor | `actionQueue[].relatedOpportunityRef` | Ask/Detail deep-link에 사용 가능 |

### Baseline Report Derived Fields

frontend에서 파생 계산해도 되는 항목:

- 추천 공고 개수
- 보완 권장 역량 개수
- hero headline 문장
- 공고 카드 정렬 상태

WAS에서 직접 주면 더 안정적인 항목:

- `whyMatched`
- `urgencyLabel`
- action queue 추천 순서

## 2. Opportunity Detail View Model

### Source Endpoint

- `GET /api/opportunities/{opportunityId}`

### Top-level Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Header | `item.surface`, `item.metadata` | 제목, 고용형태, 일정 |
| Company Context | `item.company` | 회사 설명 및 도메인 맥락 |
| Role Summary | `item.surface.summary`, `item.surface.descriptionMarkdown` | 직무 요약 |
| Qualification | `item.qualification` | 위치, 요구사항, 전형 정보 |
| Fit Analysis | `item.analysis` | 적합도 점수, 강점 요약, 리스크 요약 |
| Evidence | `item.evidence[]` | 근거 블록 |
| Related Documents | `item.relatedDocuments[]` | 문서 deep-link |

### Header Mapping

| UI field | API path | Notes |
| --- | --- | --- |
| 공고 제목 | `item.surface.title` | required |
| 고용 형태 | `item.metadata.employmentType` | optional |
| 오픈일 | `item.metadata.opensAt` | optional |
| 마감일 | `item.metadata.closesAt` | optional |
| 상태 | `item.metadata.status` | optional |
| 원문 링크 | `item.metadata.source.sourceUrl` | optional |

### Company Context Mapping

| UI field | API path | Notes |
| --- | --- | --- |
| 회사명 | `item.company.name` | required candidate |
| 회사 요약 | `item.company.summary` | optional but recommended |
| 주요 사업 | `item.company.mainBusiness` | optional |
| 홈페이지 | `item.company.homepageUrl` | optional |

### Qualification Mapping

| UI field | API path | Notes |
| --- | --- | --- |
| 근무 위치 | `item.qualification.locationText` | optional |
| 요구사항 | `item.qualification.requirementsText` | optional |
| 전형 절차 | `item.qualification.selectionProcessText` | optional |

### Opportunity Detail Analysis Mapping

| UI field | API path | Notes |
| --- | --- | --- |
| 적합도 점수 | `item.analysis.fitScore` | optional but recommended |
| 강점 요약 | `item.analysis.strengthsSummary` | optional |
| 리스크 요약 | `item.analysis.riskSummary` | optional |

현재 baseline 규칙:

- 적합도 점수와 요약형 분석은 stable read data로 보고 detail payload에 포함하는 것을 우선합니다.
- 생성형 면접 시나리오나 확장 코칭은 detail payload 책임이 아니라 Ask 진입으로 넘깁니다.

## 3. Ask Workspace View Model

### Source Endpoint

- `POST /api/workspace/ask`
- optional `GET /api/opportunities`

### Request Context Mapping

| UI state | API request field | Notes |
| --- | --- | --- |
| 질문 입력창 | `question` | required |
| 선택 공고 컨텍스트 | `opportunityId` | optional |
| 답변 저장 여부 | `save` | optional reserved field, current MVP no-op 가능 |

### Response Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Main answer | `answer.markdown` | 메인 분석 패널 |
| Answer meta | `answer.answerId`, `answer.generatedAt` | optional metadata |
| Evidence panel | `evidence[]` | 근거 자료 패널 |
| Related opportunities | `relatedOpportunities[]` | 컨텍스트 전환 / 상세 보기 |
| Related documents | `relatedDocuments[]` | 문서 deep-link |

### Evidence Mapping

| UI element | API path | Notes |
| --- | --- | --- |
| evidence key | `evidence[].evidenceId` | required |
| evidence kind | `evidence[].kind` | fact / interpretation / personal |
| label | `evidence[].label` | required |
| excerpt | `evidence[].excerpt` | optional |
| 문서 링크 | `evidence[].documentRef` | optional |
| provenance hint | `evidence[].provenance` | optional |

### Related Opportunities Mapping

Ask에서 쓰는 공고 카드 최소 요소:

| 카드 요소 | API path | Notes |
| --- | --- | --- |
| 공고 id | `relatedOpportunities[].opportunityRef.opportunityId` | required |
| 제목 | `relatedOpportunities[].surface.title` | required |
| 회사명 | `relatedOpportunities[].surface.companyName` | required candidate |
| 마감일 | `relatedOpportunities[].metadata.closesAt` | optional |
| why matched | `relatedOpportunities[].decoration.whyMatched` | optional but highly useful |

### Ask Local-only View Model

현재 frontend 로컬 상태로 남겨도 되는 것:

- thread message ordering
- system message
- welcome intro answer
- current selected answer index

WAS contract로 끌어오지 않는 이유:

- 현재 MVP에서는 single-turn response가 핵심이기 때문입니다.
- full conversation persistence는 현재 slice 범위 밖입니다.

## 4. Calendar View Model

### Source Endpoint

- `GET /api/calendar`

### Top-level Mapping

| UI block | API field | Usage |
| --- | --- | --- |
| Timeline list | `items[]` | 일정 리스트 |
| Month grid | `items[]` | 날짜별 그룹핑 |

### Calendar Item Mapping

| UI element | API path | Notes |
| --- | --- | --- |
| item key | `items[].calendarItemId` | required |
| 종류 | `items[].kind` | deadline / open |
| label | `items[].label` | required |
| 시작 시각 | `items[].startsAt` | required |
| 종료 시각 | `items[].endsAt` | optional |
| object anchor | `items[].objectRef` | 공고 상세 이동에 사용 |
| urgency label | `items[].decoration.urgencyLabel` | optional |
| company name | `items[].decoration.companyName` | optional |

### Calendar Derived Fields

frontend에서 계산하는 항목:

- 월간 grid grouping
- 날짜별 정렬
- today highlight
- timeline vs calendar toggle state

## 5. Local-only and Deferred Mapping

현재 MVP에서 frontend local state로 유지하는 항목:

- sidebar open/close
- selected tab
- calendar view mode
- ask input text
- Ask 환영 메시지

현재 MVP에서 Ask 또는 deferred concern으로 남기는 항목:

- persisted answer history
- user-visible answer save flow
- temporary generated interview scenario

현재 문서 범위에서 뒤로 미루는 mapping:

- document detail full surface
- tree node structure
- graph node/edge rendering
- command status to UI mapping

## API to UI Checklist

구현 전에 각 endpoint마다 아래를 확인하는 것을 권장합니다.

### `GET /api/workspace/summary`

- `profileSnapshot`만으로 Personal Snapshot이 그려지는가
- `recommendedOpportunities`만으로 메인 공고 카드가 충분한가
- `marketBrief`, `skillsGap`, `actionQueue`가 없어도 partial render가 가능한가

### `POST /api/workspace/ask`

- answer, evidence, related opportunities가 모두 없을 때의 fallback이 정의되어 있는가
- `opportunityId` 없이도 유의미한 답변이 가능한가

### `GET /api/opportunities/{opportunityId}`

- header, company context, qualification block이 모두 채워지는가
- 부족한 필드는 optional로 안전하게 빠질 수 있는가

### `GET /api/calendar`

- `objectRef`만으로 detail deep-link가 가능한가
- `urgencyLabel` 없이도 일정 UI가 동작하는가

## Relationship to Other Docs

이 문서는 아래 문서와 함께 봅니다.

- `docs/product/ui-screen-spec.md`
- `docs/product/ui-state-spec.md`
- `docs/api/mvp-api-baseline.md`

권장 읽기 순서:

1. screen spec
2. state spec
3. API baseline
4. frontend view model
