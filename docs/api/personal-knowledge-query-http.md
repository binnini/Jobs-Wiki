---
status: draft
working_notes:
  - dev-wiki/decisions/2026-04-16-personal-knowledge-query-slice.md
---

# Personal Knowledge Query HTTP

## Status

Draft

이 문서는 `present_query_personal_knowledge`를 HTTP candidate response로 노출할 때의 최소 contract를 정리합니다.

## Purpose

- internal retrieval/bundle/generation result를 consumer-facing HTTP shape로 감쌉니다.
- final transport를 고정하지 않으면서도, frontend나 external consumer가 어떤 결과를 기대할지 좁게 맞춥니다.
- read path와 command path를 섞지 않습니다.

## Candidate Endpoints

- `GET /workspace/personal-knowledge/query`
- `POST /workspace/personal-knowledge/regenerations`

현재 draft 규칙:

- 이 endpoint는 read endpoint입니다.
- `retrieve_for_query` raw 결과보다 `present_query_personal_knowledge` envelope를 우선 반환합니다.
- GET에서는 `generationMode=ephemeral`만 허용합니다.
- `persisted` regeneration은 이 candidate GET endpoint 범위에 두지 않습니다.
- `persisted` regeneration은 별도 POST candidate surface로 분리하는 편이 맞습니다.
- 이 분리는 command path 승격이 아니라, side effect가 있는 read-side artifact refresh를 GET과 분리하기 위한 transport rule입니다.
- GET envelope은 frontend와 selected external consumer가 공유할 수 있는 workspace-facing draft read shape로 둡니다.
- POST regeneration surface는 더 좁은 candidate surface로 두고, broad external stabilization은 아직 보류합니다.

현재 external opening 판단:

- `GET /workspace/personal-knowledge/query`
  - frontend와 selected external consumer까지 공유 가능한 candidate read surface로 둡니다.
- `POST /workspace/personal-knowledge/regenerations`
  - frontend와 tightly scoped internal/approved consumer까지만 여는 편이 맞습니다.
  - broad external consumer 기본 공개는 현재 단계에서 보류합니다.

이유:

- POST surface는 command family는 아니지만 persisted artifact refresh를 발생시킵니다.
- 따라서 read-only query GET보다 access policy와 quota policy를 더 보수적으로 잡는 편이 맞습니다.
- 현재 단계에서는 capability tier보다 endpoint semantics를 먼저 안정화하는 것이 우선입니다.

### Approved Consumer Gate

frontend 밖 consumer에 이 POST surface를 열 수 있으려면, 최소한 아래 조건이 먼저 충족되어야 합니다.

- auth
  - caller identity가 명시적으로 식별되어야 합니다.
  - user-scoped access인지 service-to-service access인지 구분할 수 있어야 합니다.
  - userId injection을 runtime이 임의 추론하지 않고 authenticated principal과 연결할 수 있어야 합니다.
- capability
  - caller가 `workspace.personal_knowledge.regenerate` 수준의 좁은 capability를 가져야 합니다.
  - GET query read 권한만 있는 consumer가 POST regeneration까지 자동으로 갖는 구조는 피하는 편이 맞습니다.
  - allowed family set, canonical evidence 사용 여부 같은 세부 capability를 추가로 좁힐 수 있어야 합니다.
- quota
  - caller별 또는 user별 regeneration 호출량 제한을 둘 수 있어야 합니다.
  - broad polling이나 burst regeneration을 막을 수 있는 최소 rate control이 있어야 합니다.
  - failure/retry가 생겨도 persisted refresh가 무한 반복되지 않도록 재시도 정책을 별도로 둘 수 있어야 합니다.

현재 단계에서는 위 gate를 만족하는 frontend와 tightly scoped approved consumer만 candidate 대상으로 보고, 그 외 external consumer 기본 공개는 보류합니다.

## Query Parameters

- `q`
  - required
  - 사용자 질의
- `preferredFamilies`
  - optional
  - comma-separated family keys
- `bundleLimit`
  - optional
  - 상위 context block 수
- `generationMode`
  - optional
  - public GET에서는 `ephemeral`만 허용
- `canonicalPolicy`
  - optional
  - `personal_only` 또는 `prefer_personal_with_canonical`
- `includeDebug`
  - optional
  - public GET에서는 지원하지 않음

현재 draft direction:

- query string만으로 설명 가능한 좁은 read endpoint로 유지합니다.
- 복잡한 transport body나 command envelope는 지금 단계에서 도입하지 않습니다.
- default evidence policy는 `personal_only`로 둡니다.
- public GET에서는 raw retrieval/bundle debug payload를 열지 않습니다.

## Regeneration Request Body

- `q`
  - required
  - 사용자 질의
- `preferredFamilies`
  - optional
  - comma-separated family keys
- `bundleLimit`
  - optional
  - 상위 context block 수
- `canonicalPolicy`
  - optional
  - `personal_only` 또는 `prefer_personal_with_canonical`

현재 draft direction:

- POST regeneration은 `generationMode=persisted`를 body 밖에서 고정합니다.
- command acceptance envelope를 만들지 않고, regenerated result envelope를 바로 반환합니다.
- regeneration store가 없으면 narrow failure로 degrade합니다.
- family를 생략하면 current default set인 `personal.workspace_briefing`, `personal.application_next_steps`를 사용합니다.
- `personal.evidence_map`는 opt-in family로 유지합니다.

## Candidate Response

성공 응답:

```ts
type PersonalKnowledgeQueryEnvelope = {
  kind: "personal_knowledge_query_result";
  query: string;
  assembledAt: string;
  generationMode: "persisted" | "ephemeral";
  evidencePolicy: "personal_only" | "prefer_personal_with_canonical";
  retrieval: {
    rankingVersion: string;
    candidateCount: number;
  };
  evidence: {
    personalContextCount: number;
    canonicalEvidenceCount: number;
    relationContextCount: number;
    objectRefs: KnowledgeObjectRef[];
    relationRefs: KnowledgeRelationRef[];
  };
  generatedPages: Array<{
    pageRef: PersonalPageRef;
    title: string;
    summary: string;
    generationMode: "persisted" | "ephemeral";
  }>;
  savedArtifacts?: Array<{
    pageRef: PersonalPageRef;
    artifactVersion: string;
    savedAt: string;
  }>;
};
```

현재 최소 규칙:

- `savedArtifacts`는 `persisted` regeneration에서만 선택적으로 포함합니다.
- 이 block은 command receipt가 아니라, read authority 쪽에 다시 보일 artifact anchor를 좁게 알려주기 위한 것입니다.
- 별도 persisted page version token이 아직 없으므로 현재 최소 구현에서는 `artifactVersion`을 saved artifact의 `generatedAt` 기반 후보 토큰으로 사용합니다.
- `ephemeral` GET 응답에서는 `savedArtifacts`를 기본적으로 포함하지 않습니다.

에러 응답 최소 후보:

```ts
type ErrorResponse = {
  error: string;
};
```

현재 최소 validation 규칙:

- `q`가 비어 있으면 `400`
- family key가 일부 잘못돼도, 유효한 key만 남겨 좁게 처리
- `bundleLimit`가 비정상이면 기본값으로 degrade
- `generationMode=persisted`이면 `400`
- `includeDebug=true`이면 `400`
- POST regeneration에 persistence backing store가 없으면 `503`

## Semantics

- envelope는 retrieval debug 전체를 다 반환하지 않습니다.
- consumer는 high-level outcome, evidence anchor, generated page summary를 먼저 읽습니다.
- raw retrieval candidate와 answer bundle full detail은 internal tool/debug surface로 남길 수 있습니다.
- relation context는 raw graph neighborhood 전체가 아니라 answer bundle용 context block count와 anchor 중심으로 제한합니다.
- relation context block은 필요 시 canonical neighborhood summary 한 줄을 함께 포함할 수 있습니다.
- POST regeneration 응답은 필요 시 saved artifact ref/version을 함께 돌려주되, broad command/status envelope로 확장하지는 않습니다.
- 현재 기준으로 relation context의 richer neighborhood 확장은 보류하며, graph-level payload는 별도 projection concern으로 남깁니다.

## Runtime Binding Direction

현재 구현 기준선:

- transport-neutral HTTP handler가 존재합니다.
- GET query endpoint와 POST regeneration endpoint용 candidate route binding module도 존재합니다.
- 하지만 실제 서버 프레임워크나 global router runtime은 아직 고정하지 않습니다.

### Uplift Conditions

candidate route binding을 실제 WAS runtime에 연결하는 조건은 아래처럼 좁게 둡니다.

- runtime이 request auth, error normalization, logging을 공통 계층으로 처리할 수 있어야 합니다.
- runtime이 read authority와 optional regeneration store를 route별로 명시 주입할 수 있어야 합니다.
- GET `ephemeral` / POST `persisted` transport discipline이 runtime binding 이후에도 바뀌지 않아야 합니다.
- GET query surface가 broad debug/read dump endpoint로 확장되지 않아야 합니다.
- POST regeneration surface가 command acceptance/status endpoint처럼 오해되지 않아야 합니다.
- runtime binding은 candidate route를 실제 요청 경로에 올리는 것일 뿐, public stable 승격을 자동으로 뜻하지 않아야 합니다.

현재 문서 기준으로는 위 조건이 충족되기 전까지 candidate handler와 route module만 유지하는 편이 맞습니다.

현재 최소 composition entrypoint 후보:

```ts
type PersonalKnowledgeRuntimeDependencies = {
  readAuthority: PersonalPageReadAuthority;
  regenerationStore?: PersonalPageRegenerationStore;
  canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
};

type PersonalKnowledgeRuntimeModule = {
  moduleKey: "personal_knowledge";
  routeBindings: WasRouteBinding[];
};

type WasRuntimeRegistrar = {
  registerRoute(binding: WasRouteBinding): void;
};
```

이 shape는 실제 server bootstrap을 뜻하지 않습니다.
의미는 "candidate route를 runtime에 붙일 때 route-local dependency를 어디까지 명시해야 하는가"를 좁게 고정하는 것입니다.

registration 방향:

- runtime module은 framework-neutral `routeBindings`를 노출합니다.
- 상위 runtime은 `registerRoute(binding)` 수준의 좁은 registrar만 구현하면 됩니다.
- framework router, middleware chain, handler adapter 세부는 registrar 구현 쪽으로 둡니다.

현재 최소 global runtime concern 후보:

```ts
type WasRequestContext = {
  requestId: string;
  authenticatedPrincipal?: {
    principalType: "user" | "service";
    principalId: string;
    userId?: string;
  };
};

type WasCapabilityResolver = {
  has(capability: string, context: WasRequestContext): boolean;
};

type WasErrorNormalizer = {
  normalize(error: unknown): {
    status: number;
    body: { error: string };
  };
};
```

personal knowledge query runtime 기준선:

- GET query는 read capability만 있으면 충분할 수 있지만, POST regeneration은 별도 regenerate capability를 요구하는 편이 맞습니다.
- route handler는 principal parsing이나 capability store lookup을 직접 하지 않고, 상위 runtime concern 결과를 받는 편이 맞습니다.
- `requestId`는 logging과 failure correlation을 위한 공통 context로 두는 편이 맞습니다.

## Open Questions

- selected external consumer beyond frontend에 POST regeneration surface를 언제 열지
- approved consumer gate를 auth/capability/quota 문서 수준에서 어디까지 더 세분화할지
