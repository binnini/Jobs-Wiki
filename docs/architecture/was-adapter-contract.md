---
status: draft
---

# WAS Adapter Contract

## Purpose

이 문서는 Jobs-Wiki WAS 내부에서 사용하는 adapter interface를 정의합니다.

현재 목적:

- mock adapter와 real adapter가 같은 interface를 공유하도록 고정
- service layer가 provider-specific shape를 모르도록 고정
- read authority, ask analysis, command facade 경계를 구현 친화적으로 정리

이 문서는 external dependency의 transport를 final로 고정하지 않습니다.
대신 `apps/was`가 어떤 interface를 기준으로 runtime을 짤지 정합니다.

## Scope

현재 MVP 우선 범위:

- workspace summary read
- opportunity list/detail read
- calendar read
- ask analysis

현재 문서가 뒤로 미루는 것:

- graph/tree/document full adapter
- full command family implementation
- auth-aware multi-tenant session contract

## Adapter Families

현재 WAS는 아래 네 family를 가집니다.

1. `ReadAuthorityAdapter`
2. `AskWorkspaceAdapter`
3. `CommandFacadeAdapter`
4. adapter factory

현재 MVP에서 실제 구현 우선순위는 아래입니다.

1. `ReadAuthorityAdapter`
2. `AskWorkspaceAdapter`
3. `CommandFacadeAdapter` skeleton

## Shared Rules

### 1. Service Depends on Interface Only

- service는 concrete adapter 구현을 import하지 않습니다.
- service는 factory 또는 dependency injection을 통해 interface만 받습니다.

### 2. Raw Provider Shape Must Not Escape

- adapter는 raw external payload를 그대로 service에 넘기지 않습니다.
- adapter output은 WAS 내부 normalized model이어야 합니다.

### 3. Adapter Error Must Be Normalized

- adapter는 failure를 internal normalized error shape로 반환하거나 throw합니다.
- route는 provider error code를 직접 알지 않아야 합니다.

### 4. Mock and Real Must Share Same Signature

- mock adapter는 fixture 기반이더라도 real adapter와 동일한 함수 시그니처를 가져야 합니다.

## Shared Internal Types

### Adapter Failure

```ts
type AdapterFailure = {
  code:
    | "validation_failed"
    | "conflict"
    | "not_found"
    | "forbidden"
    | "temporarily_unavailable"
    | "unknown_failure";
  message: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
};
```

### User Context

현재 MVP에서는 auth/session을 아직 고정하지 않으므로 최소 shape만 둡니다.

```ts
type UserContext = {
  workspaceId?: string;
  profileId?: string;
};
```

### Opportunity Query

```ts
type OpportunityListQuery = {
  cursor?: string;
  limit?: number;
  status?: "open" | "closing_soon" | "closed" | "unknown";
  closingWithinDays?: number;
};
```

### Calendar Query

```ts
type CalendarQuery = {
  from?: string;
  to?: string;
};
```

## 1. ReadAuthorityAdapter

### Responsibility

- summary read
- opportunity list/detail read
- calendar read

### Interface

```ts
type ReadAuthorityAdapter = {
  getWorkspaceSummary(input: {
    userContext?: UserContext;
  }): Promise<WorkspaceSummaryRecord>;

  listOpportunities(input: {
    userContext?: UserContext;
    query?: OpportunityListQuery;
  }): Promise<{
    items: OpportunityRecord[];
    nextCursor?: string;
  }>;

  getOpportunityDetail(input: {
    userContext?: UserContext;
    opportunityId: string;
  }): Promise<OpportunityDetailRecord>;

  getCalendar(input: {
    userContext?: UserContext;
    query?: CalendarQuery;
  }): Promise<CalendarRecord[]>;
};
```

### Notes

- `getWorkspaceSummary`는 summary에 필요한 조합이 read authority에서 직접 가능하면 aggregate로 받아도 됩니다.
- 불가능하면 adapter가 내부적으로 여러 provider call을 조합해도 됩니다.
- 이 선택은 adapter 내부 책임이지 route/service 책임이 아닙니다.

## 2. AskWorkspaceAdapter

### Responsibility

- 질문과 optional opportunity context를 받아 answer/evidence/related opportunities를 생성

### Interface

```ts
type AskWorkspaceAdapter = {
  askWorkspace(input: {
    userContext?: UserContext;
    question: string;
    opportunityId?: string;
    save?: boolean;
  }): Promise<AskWorkspaceRecord>;
};
```

### Notes

- ask 결과는 read adapter와 달리 단순 read projection이 아닐 수 있습니다.
- 현재 MVP에서는 별도 `AskWorkspaceAdapter`로 분리하는 편이 service 책임을 단순하게 만듭니다.

## 3. CommandFacadeAdapter

### Responsibility

- 현재 MVP에서는 optional ingest trigger 또는 future command skeleton만 담당

### Interface

```ts
type CommandFacadeAdapter = {
  triggerWorknetIngestion?(input: {
    sourceId: string;
  }): Promise<{
    commandId: string;
    acceptedAt: string;
  }>;

  getCommandStatus?(input: {
    commandId: string;
  }): Promise<{
    commandId: string;
    status:
      | "accepted"
      | "validating"
      | "queued"
      | "running"
      | "succeeded"
      | "failed"
      | "cancelled";
    projectionStates?: Array<{
      projection: string;
      visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
    }>;
  }>;
};
```

### Notes

- current MVP read slice에서는 실제 구현보다 skeleton 수준이면 충분합니다.
- 다만 interface는 지금 문서에서 먼저 고정하는 편이 안전합니다.

## Internal Normalized Records

adapter output은 아래처럼 WAS 내부 normalized record를 기준으로 합니다.

## WorkspaceSummaryRecord

```ts
type WorkspaceSummaryRecord = {
  profileSnapshot: {
    targetRole: string;
    experience: string;
    education?: string;
    location?: string;
    domain?: string;
    skills: string[];
    sourceSummary?: string[];
  };
  recommendedOpportunities: OpportunityRecord[];
  marketBrief?: {
    signals: string[];
    risingSkills?: string[];
    notableCompanies?: string[];
  };
  skillsGap?: {
    strong: string[];
    requested: string[];
    recommendedToStrengthen: string[];
  };
  actionQueue?: Array<{
    actionId: string;
    label: string;
    description?: string;
    relatedOpportunityId?: string;
  }>;
  askFollowUps?: string[];
  sync?: {
    visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
    version?: string;
    visibleAt?: string;
  };
};
```

## OpportunityRecord

```ts
type OpportunityRecord = {
  opportunityId: string;
  objectId: string;
  title: string;
  companyName?: string;
  roleLabels?: string[];
  summary?: string;
  employmentType?: string;
  opensAt?: string;
  closesAt?: string;
  status?: "open" | "closing_soon" | "closed" | "unknown";
  urgencyLabel?: string;
  closingInDays?: number;
  whyMatched?: string;
};
```

## OpportunityDetailRecord

```ts
type OpportunityDetailRecord = {
  opportunityId: string;
  objectId: string;
  title: string;
  summary?: string;
  descriptionMarkdown?: string;
  employmentType?: string;
  opensAt?: string;
  closesAt?: string;
  status?: "open" | "closing_soon" | "closed" | "unknown";
  source?: {
    provider?: string;
    sourceId?: string;
    sourceUrl?: string;
    mobileSourceUrl?: string;
  };
  company?: {
    objectId?: string;
    name: string;
    summary?: string;
    homepageUrl?: string;
    mainBusiness?: string;
  };
  roles?: Array<{
    objectId?: string;
    label: string;
  }>;
  qualification?: {
    locationText?: string;
    requirementsText?: string;
    selectionProcessText?: string;
  };
  evidence?: EvidenceRecord[];
  relatedDocuments?: RelatedDocumentRecord[];
  sync?: {
    visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
    version?: string;
    visibleAt?: string;
  };
};
```

## AskWorkspaceRecord

```ts
type AskWorkspaceRecord = {
  answer: {
    answerId?: string;
    markdown: string;
    generatedAt?: string;
  };
  evidence: EvidenceRecord[];
  relatedOpportunities?: OpportunityRecord[];
  relatedDocuments?: RelatedDocumentRecord[];
  sync?: {
    visibility: "applied" | "pending" | "partial" | "unknown" | "stale";
    version?: string;
    visibleAt?: string;
  };
};
```

## CalendarRecord

```ts
type CalendarRecord = {
  calendarItemId: string;
  kind: "opportunity_deadline" | "opportunity_open";
  label: string;
  startsAt: string;
  endsAt?: string;
  objectId: string;
  objectKind: string;
  objectTitle?: string;
  urgencyLabel?: string;
  companyName?: string;
};
```

## Evidence and Document Records

```ts
type EvidenceRecord = {
  evidenceId: string;
  kind: "fact" | "interpretation" | "personal";
  label: string;
  documentObjectId?: string;
  documentObjectKind?: string;
  documentTitle?: string;
  excerpt?: string;
  provenance?: {
    sourceVersion?: string;
    sourcePointer?: string;
  };
};

type RelatedDocumentRecord = {
  documentObjectId: string;
  documentObjectKind: string;
  documentTitle?: string;
  role?: "personal" | "interpretation" | "fact" | "note";
  excerpt?: string;
};
```

## Factory Rule

현재 권장 factory shape:

```ts
type WasAdapterBundle = {
  readAuthority: ReadAuthorityAdapter;
  askWorkspace: AskWorkspaceAdapter;
  commandFacade: CommandFacadeAdapter;
};
```

권장 생성 방식:

```ts
type CreateWasAdapterBundleInput = {
  mode: "mock" | "real";
};
```

예시:

```ts
const adapters = createWasAdapterBundle({ mode: process.env.WAS_DATA_MODE });
```

규칙:

- mode 선택은 app bootstrap에서 한 번만 일어납니다.
- service는 mode 존재를 알지 않아야 합니다.

## Timeout and Retry Rule

### ReadAuthorityAdapter

- read timeout은 짧게 유지하는 편이 좋습니다.
- broad retry보다 fail-fast + stale fallback이 현재 MVP에 더 적합합니다.

현재 권장:

- timeout: 짧게
- retry: 0~1회

### AskWorkspaceAdapter

- ask는 read보다 느릴 수 있습니다.
- 다만 request path 안에서 무한 대기를 허용하지 않습니다.

현재 권장:

- timeout: read보다 조금 길게
- retry: validation failure 없음, temporary failure에만 제한적 허용

### CommandFacadeAdapter

- command submit은 retry-safe 전제를 가져야 합니다.
- idempotency key를 transport/application boundary에서 다룰 수 있어야 합니다.

## Error Translation Rule

adapter는 provider raw error를 아래 normalized shape로 translation합니다.

- `validation_failed`
- `conflict`
- `not_found`
- `forbidden`
- `temporarily_unavailable`
- `unknown_failure`

service는 이 값을 route-level error로 그대로 전달하거나, use case 문맥에 따라 좁게 재해석할 수 있습니다.

route는 최종적으로 WAS public error shape만 응답합니다.

## Mock Implementation Rule

mock adapter는 아래 목적을 가져야 합니다.

- frontend와 실제 HTTP contract를 먼저 맞춤
- service/mapping code를 실제 구조로 검증
- later real adapter 교체 비용을 낮춤

mock adapter가 해서는 안 되는 것:

- route response shape를 직접 return
- provider raw payload를 흉내 낸다는 이유로 WAS 내부 normalized record를 우회

즉, mock도 real과 같은 interface와 같은 internal record shape를 따라야 합니다.

## Test Rule

adapter test는 아래를 우선합니다.

1. mock adapter contract test
2. real adapter contract test
3. error translation test

핵심은 "provider가 바뀌어도 service가 안 깨지는가"를 검증하는 것입니다.

## Relationship to Other Docs

이 문서는 아래 문서와 함께 봅니다.

- `docs/architecture/was.md`
- `docs/architecture/was-runtime-layout.md`
- `docs/api/was-external-boundaries.md`
- `docs/api/mvp-api-baseline.md`

