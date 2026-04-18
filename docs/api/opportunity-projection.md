---
status: draft
---

# Opportunity Projection

## Purpose

이 문서는 Jobs-Wiki 웹 서비스가 `opportunity`를 어떤 사용자-facing read projection으로 보여줄지 정리합니다.

여기서 `opportunity`는 canonical entity 이름이 아니라 product-facing projection 언어입니다.
현재 recruiting domain pack의 canonical entity `job_posting`이,
웹에서는 `opportunity`라는 사용자 경험 단위로 번역된다고 보는 편이 맞습니다.

이 문서는 아래를 정리합니다.

- opportunity list item
- opportunity detail
- evidence block
- company / role block
- calendar와 ask flow에서의 deep-link 방식

이 문서는 canonical pack schema를 대체하지 않습니다.
canonical baseline은 여전히 `docs/domain/recruiting-domain-pack.md`와 pack artifact를 source of truth로 둡니다.

## Why Opportunity Instead of Job Posting

웹 서비스 관점에서 사용자는 `job_posting`이라는 내부 이름보다 아래 질문에 더 가깝게 사고합니다.

- 지금 지원할 만한 기회가 무엇인가
- 이 공고는 어떤 회사와 직무를 의미하는가
- 언제 마감되는가
- 왜 나와 관련 있는가

그래서 WAS와 frontend에서는 `job_posting`을 그대로 노출하기보다,
아래 성격을 가진 `opportunity` projection으로 번역하는 편이 좋습니다.

- action-oriented
- deadline-aware
- company / role context 포함
- evidence / document deep-link 친화적

## Canonical Source

현재 recruiting pack v1 기준에서 opportunity projection의 canonical source는 아래입니다.

- entity
  - `job_posting`
  - `company`
  - `role`
- relation
  - `posted_by`
  - `for_role`

즉, opportunity는 새 canonical object를 도입하는 것이 아니라,
`job_posting`을 중심으로 `company`, `role`, temporal attributes를 엮어 보여주는 read model입니다.

## Projection Roles

### Opportunity List

사용 목적:

- 홈 화면
- closing soon block
- ask 결과 내 related opportunity
- 리스트 탐색 화면

원칙:

- 빠르게 스캔 가능해야 함
- 마감, 회사, 역할, 상태가 먼저 보여야 함
- 본문 전체보다 action context를 우선함

### Opportunity Detail

사용 목적:

- 공고 상세 이해
- 회사/직무 맥락 이해
- evidence / related documents 이동
- 이후 apply action 또는 note 작성의 anchor

원칙:

- canonical fact를 그대로 노출하지 않고 product surface로 재구성
- source text와 user-facing summary를 함께 보여줄 수 있어야 함
- provenance와 sync 상태를 detail shell에서 설명 가능해야 함

## Candidate Shapes

### Opportunity Ref

```ts
type OpportunityRef = {
  opportunityId: string;
  title?: string;
};
```

### Opportunity Status

```ts
type OpportunityStatus =
  | "open"
  | "closing_soon"
  | "closed"
  | "unknown";
```

### Opportunity List Item

```ts
type OpportunityListItem = {
  opportunityRef: OpportunityRef;
  objectRef: {
    objectId: string;
    objectKind: "opportunity";
    title?: string;
  };
  surface: {
    title: string;
    companyName?: string;
    roleLabels?: string[];
    summary?: string;
  };
  metadata?: {
    employmentType?: string;
    opensAt?: string;
    closesAt?: string;
    status?: OpportunityStatus;
  };
  decoration?: {
    urgencyLabel?: string;
    closingInDays?: number;
    sourceLabel?: string;
  };
};
```

### Opportunity Detail

```ts
type OpportunityDetail = {
  opportunityRef: OpportunityRef;
  objectRef: {
    objectId: string;
    objectKind: "opportunity";
    title?: string;
  };
  surface: {
    title: string;
    summary?: string;
    descriptionMarkdown?: string;
  };
  metadata?: {
    employmentType?: string;
    opensAt?: string;
    closesAt?: string;
    status?: OpportunityStatus;
    source?: {
      provider?: string;
      sourceId?: string;
      sourceUrl?: string;
      mobileSourceUrl?: string;
    };
  };
  company?: OpportunityCompanyBlock;
  roles?: OpportunityRoleBlock[];
  qualification?: {
    locationText?: string;
    requirementsText?: string;
    selectionProcessText?: string;
  };
  evidence?: OpportunityEvidenceItem[];
  relatedDocuments?: OpportunityRelatedDocument[];
};
```

### Company Block

```ts
type OpportunityCompanyBlock = {
  companyRef?: {
    objectId: string;
    objectKind: "company";
    title?: string;
  };
  name: string;
  summary?: string;
  homepageUrl?: string;
  mainBusiness?: string;
};
```

### Role Block

```ts
type OpportunityRoleBlock = {
  roleRef?: {
    objectId: string;
    objectKind: "role";
    title?: string;
  };
  label: string;
};
```

### Evidence Item

```ts
type OpportunityEvidenceItem = {
  evidenceId: string;
  kind: "fact" | "interpretation" | "personal";
  label: string;
  documentRef?: {
    objectId: string;
    objectKind: string;
    title?: string;
  };
  excerpt?: string;
  provenance?: {
    sourceVersion?: string;
    sourcePointer?: string;
  };
};
```

### Related Document

```ts
type OpportunityRelatedDocument = {
  documentRef: {
    objectId: string;
    objectKind: string;
    title?: string;
  };
  role?: "personal" | "interpretation" | "fact" | "note";
  excerpt?: string;
};
```

## Mapping from Canonical Pack

현재 recruiting pack v1 기준의 기본 대응은 아래처럼 두는 편이 맞습니다.

| Canonical source | Opportunity projection |
| --- | --- |
| `job_posting.title` | `surface.title` |
| `job_posting.summary` | `surface.summary` |
| `job_posting.summary` + selected text fields | `surface.descriptionMarkdown` 후보 |
| `job_posting.employment_type` | `metadata.employmentType` |
| `job_posting.opens_at` | `metadata.opensAt` |
| `job_posting.closes_at` | `metadata.closesAt` |
| `job_posting.source_url` | `metadata.source.sourceUrl` |
| `job_posting.mobile_source_url` | `metadata.source.mobileSourceUrl` |
| `job_posting.location_text` | `qualification.locationText` |
| `job_posting.requirements_text` | `qualification.requirementsText` |
| `job_posting.selection_process_text` | `qualification.selectionProcessText` |
| `posted_by -> company` | `company` block |
| `for_role -> role[]` | `roles[]` block |

중요한 점:

- `location`, `skill`, `selection_step`는 v1에서 standalone fact가 아닙니다.
- 따라서 opportunity projection에서는 별도 sub-resource보다 `qualification` text block으로 보여주는 편이 맞습니다.

## Ask Flow Integration

`Ask Workspace` 결과에서 opportunity는 아래 역할을 가집니다.

- answer 본문에서 언급된 action anchor
- evidence에서 deep-link되는 source-backed object
- related documents를 여는 context root

권장 연결 방식:

- answer panel
  - markdown answer
- evidence panel
  - `OpportunityEvidenceItem[]`
- related opportunities panel
  - `OpportunityListItem[]`

즉, ask 결과는 opportunity detail을 직접 대체하지 않고,
opportunity detail로 이동하는 personalized briefing entry 역할을 하는 편이 좋습니다.

## Calendar Integration

현재 recruiting pack v1에서 calendar에 가장 자연스럽게 올라오는 temporal field는 아래입니다.

- `opens_at`
- `closes_at`

따라서 opportunity projection은 calendar에서 최소 두 종류의 item source가 됩니다.

- `opportunity_open`
- `opportunity_deadline`

calendar item은 event 자체를 detail root로 삼기보다,
opportunity detail로 이동하는 temporal projection item으로 다루는 편이 맞습니다.

## Detail Rendering Guidance

Opportunity detail 화면에서 우선순위는 아래처럼 두는 편이 좋습니다.

1. title / company / deadline
2. summary
3. qualification block
4. related role block
5. evidence / related documents
6. source / provenance / sync metadata

이 순서가 좋은 이유:

- 사용자는 먼저 "지원할 가치가 있는가"를 판단하고
- 다음에 "왜 그렇게 보였는가"를 확인하며
- 마지막에 provenance와 raw source를 참고하기 때문입니다.

## Explicit Non-Goals

이 문서는 아래를 고정하지 않습니다.

- opportunity를 새 canonical object로 승격하는 것
- 지원 버튼/저장 버튼 같은 action UX 세부
- 회사 상세와 opportunity detail의 최종 경계
- full public resource API shape

## Open Questions

- opportunity list에 `company summary`를 얼마나 넣을지
- `descriptionMarkdown`을 `summary`와 분리할지
- closed opportunity를 기본 list에 포함할지
- ask 결과에서 related opportunities를 몇 개까지 우선 노출할지
- company detail을 opportunity detail에서 inline으로 얼마나 보여줄지

## Decision Summary

현재 단계에서 opportunity projection은 다음처럼 이해하는 것이 가장 자연스럽습니다.

- canonical `job_posting`을 사용자-facing `opportunity`로 번역한다
- `company`와 `role`은 detail 맥락 block으로 붙인다
- `location`, `requirements`, `selection_process`는 v1에서는 text qualification block으로 유지한다
- ask, list, detail, calendar를 모두 이어주는 중심 읽기 모델로 사용한다
