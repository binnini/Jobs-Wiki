---
status: draft
working_notes:
  - dev-wiki/decisions/2026-04-16-personal-knowledge-query-slice.md
---

# Personal Knowledge Query

## Status

Draft

이 문서는 `retrieve_for_query`와 `query_personal_knowledge`의 read-side candidate contract를 정리합니다.

## Purpose

- personal page retrieval과 answer-generation input bundle 사이의 경계를 분리합니다.
- `query_personal_knowledge`를 command family로 오해하지 않도록 read orchestration boundary로 설명합니다.
- answer bundle을 실제 user-facing Personal family regeneration의 입력으로 다룹니다.

## Boundary

- `retrieve_for_query`
  - personal read authority에서 읽을 수 있는 page를 조회하고 ranking/explanation을 붙입니다.
- `query_personal_knowledge`
  - `retrieve_for_query` 위에서 answer-generation input bundle을 조립하고, 필요한 Personal family regeneration을 트리거하는 얇은 read-side wrapper입니다.
- 이 흐름은 command path가 아닙니다.
- 이 흐름은 ingestion을 수행하지 않습니다.
- 이 흐름은 MCP facade를 직접 전제하지 않습니다.

현재 draft 방향:

- `query_personal_knowledge`는 broad command orchestration boundary가 아닙니다.
- retrieval, answer bundle assembly, personal family regeneration을 묶는 좁은 read orchestration으로 둡니다.
- runtime/transport naming은 아직 final endpoint처럼 고정하지 않습니다.

## Read Path

현재 유력한 read path:

- external consumer or frontend
- WAS
- personal page read authority
- retrieval output
- answer-generation input bundle
- regenerated Personal family page

여기서 read authority는 user-visible personal page를 읽는 authoritative dependency입니다.
regeneration 결과는 같은 personal read surface에 다시 보일 수 있지만, command acceptance semantics로 설명하지 않습니다.

### Canonical Merge Rule

현재 working rule:

- 기본값은 `personal_only`입니다.
- `prefer_personal_with_canonical`일 때만 canonical evidence authority를 추가로 조회합니다.
- canonical evidence 조회는 personal retrieval을 대체하지 않습니다.
- canonical evidence는 우선 top personal candidate가 이미 가리키는 `objectRef`를 anchor로 좁게 가져옵니다.

즉 현재 단계의 결합 조건은 아래입니다.

- personal retrieval이 먼저 성공합니다.
- top candidate에서 object anchor를 모읍니다.
- object anchor가 있을 때만 canonical evidence를 보강합니다.

이 규칙은 canonical global search를 final처럼 고정하는 것이 아닙니다.
우선은 personal read path를 중심에 두고 object/relation evidence를 보강하는 조건만 고정합니다.

## Candidate Models

### Retrieval Output

retrieval은 answer generation 이전 단계의 검색 결과입니다.

유력 최소 shape:

```ts
type RetrievalOutput = {
  query: string;
  normalizedTerms: string[];
  retrievedAt: string;
  rankingVersion: string;
  candidates: Array<{
    rank: number;
    score: number;
    page: PersonalPage;
    explanation: {
      matchedTerms: string[];
      scoreBreakdown: {
        lexicalCoverage: number;
        titleMatchScore: number;
        summaryMatchScore: number;
        bodyMatchScore: number;
        freshnessBoost: number;
        familyPriorityBoost: number;
        exactPhraseBoost: number;
      };
      reasons: string[];
    };
  }>;
};
```

설명:

- retrieval output은 answer text나 final UI card를 직접 뜻하지 않습니다.
- explanation은 ranking을 디버깅하고 사용자-facing retrieval transparency를 개선하기 위한 read-side metadata입니다.

### Answer-Generation Input Bundle

answer bundle은 retrieval output 위에 올라가는 조립 단계입니다.

유력 최소 shape:

```ts
type AnswerGenerationInputBundle = {
  bundleKind: "personal_answer_input_bundle";
  query: string;
  assembledAt: string;
  retrieval: {
    rankingVersion: string;
    retrievedAt: string;
    topCandidates: RetrievalCandidate[];
    omittedCandidateCount: number;
  };
  contextBlocks: Array<{
    pageRef: PersonalPageRef;
    title: string;
    familyKey: PersonalFamilyKey;
    summary: string;
    excerpt: string;
    whyIncluded: string;
    score: number;
    objectRef?: KnowledgeObjectRef;
    relatedObjectRefs: KnowledgeObjectRef[];
    relationRefs: KnowledgeRelationRef[];
    citations: Array<{
      kind: "summary" | "excerpt" | "object_ref" | "relation_ref";
      label: string;
    }>;
  }>;
  answerIntent: {
    matchedTerms: string[];
    preferredFamilies: PersonalFamilyKey[];
  };
  citationSummary: {
    objectRefs: KnowledgeObjectRef[];
    relationRefs: KnowledgeRelationRef[];
  };
  canonicalEvidence: Array<{
    objectRef: KnowledgeObjectRef;
    summary: string;
    relationRefs: KnowledgeRelationRef[];
    matchedTerms: string[];
  }>;
};
```

원칙:

- bundle은 retrieval을 대체하지 않습니다.
- bundle은 raw page 전체를 그대로 넘기기보다 answer generation에 필요한 context block으로 절단합니다.
- bundle은 object/relation/citation anchor를 잃지 않아야 합니다.
- page-level summary/excerpt와 object/relation anchor를 같이 유지합니다.

### Citation Direction

현재 최소 citation 규칙:

- context block은 가능하면 `objectRef`를 직접 가집니다.
- relation neighborhood를 아직 full graph로 넣지 않더라도, `derived_from` 수준의 relation anchor는 유지합니다.
- top-level `citationSummary`는 bundle 전체가 어떤 object/relation을 근거로 조립됐는지 빠르게 보여줍니다.

이 단계는 canonical relation retrieval 완성이 아닙니다.
우선은 personal page가 가리키는 object anchor와 최소 relation anchor를 bundle에 보존하는 기준선입니다.

### Relation Context

현재 최소 relation 확장 규칙:

- relation ref만 남기지 않고 answer bundle용 `relationContextBlocks`를 함께 둡니다.
- 이 block은 full graph neighborhood를 대체하지 않습니다.
- relation type, source page ref, 요약, 관련 object ref 정도만 담는 좁은 context block으로 유지합니다.
- canonical evidence에서 relation anchor를 보강한 경우에는 한 줄짜리 neighborhood summary를 함께 둘 수 있습니다.

현재 판단:

- relation context를 `neighborhoodSummary` 이상으로 더 넓히는 실제 제품 수요는 아직 확인되지 않았습니다.
- 따라서 answer bundle은 relation inspection helper 수준에 머물고, graph-level neighborhood payload는 별도 projection concern으로 남겨 둡니다.
- richer neighborhood가 필요해지면 answer bundle 확장보다 graph projection 재사용 또는 별도 read shape를 먼저 검토하는 편이 맞습니다.

### Canonical Evidence

canonical evidence는 personal page retrieval과 별개인 object/relation read evidence입니다.

현재 최소 역할:

- personal page가 가리키는 object anchor를 더 직접 설명합니다.
- relation neighborhood 전체 대신 핵심 relation ref만 함께 넣습니다.
- answer bundle이 page summary만 근거로 삼지 않도록 보강합니다.

현재 이 문서가 아직 고정하지 않는 것:

- canonical lexical search와 personal retrieval의 full ranking merge
- graph neighborhood 전체 shape
- canonical evidence를 top-level response의 primary item으로 승격하는 시점

## User-Facing Personal Families

현재 최소 user-facing family 후보:

- `personal.workspace_briefing`
  - 질문에 대한 짧은 브리핑과 핵심 evidence를 보여줍니다.
- `personal.application_next_steps`
  - 질문 기준 다음 액션과 follow-up query suggestion을 정리합니다.
- `personal.evidence_map`
  - 질문에 연결된 page/object/relation 근거 지형을 정리합니다.

현재 default family set:

- `personal.workspace_briefing`
- `personal.application_next_steps`

현재 판단:

- `personal.evidence_map`는 available family이지만 default set에는 넣지 않습니다.
- 이유는 이 family가 answer-first surface보다 evidence inspection surface에 가깝기 때문입니다.
- relation/object anchor를 더 직접 훑어야 하는 consumer나 persisted regeneration 요청에서 opt-in하는 편이 맞습니다.

이 family들은 answer bundle의 실제 소비자입니다.

원칙:

- family regeneration은 read-side artifact refresh입니다.
- family naming은 사용자에게 보이는 page 역할을 우선 설명합니다.
- retrieval candidate page와 regenerated page는 같은 것이 아닐 수 있습니다.

### Regeneration Mode

현재 working policy:

- `persisted`
  - regenerated Personal family page를 read authority 쪽 저장 대상으로 취급합니다.
- `ephemeral`
  - response artifact로만 반환하고 저장하지 않습니다.

원칙:

- 두 mode 모두 command acceptance semantics로 설명하지 않습니다.
- `persisted`는 read-side refresh 결과일 뿐이며 mutation command family가 아닙니다.
- `ephemeral`은 transport/runtime 실험 단계에서 더 안전한 기본값 후보가 될 수 있습니다.

현재 transport working direction:

- `ephemeral`은 candidate GET query surface에 둡니다.
- `persisted`는 별도 regeneration POST surface에 두는 편이 맞습니다.
- 이 분리는 read path와 command path를 섞기 위한 것이 아니라, side-effecting regeneration을 GET에서 분리하기 위한 transport discipline입니다.

## Consumer-Facing Envelope

internal result와 별도로 consumer-facing envelope를 좁게 둘 수 있습니다.

유력 최소 shape:

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

원칙:

- envelope는 transport/consumer convenience concern입니다.
- retrieval raw detail과 generated page full body를 항상 한 payload에 강제하지 않습니다.
- consumer는 envelope로 high-level outcome을 읽고, 필요 시 raw retrieval/bundle로 내려갈 수 있습니다.
- current public GET candidate에서는 raw retrieval/bundle로 직접 내려가는 flag를 열지 않습니다.
- `persisted` regeneration 응답은 saved artifact ref/version을 좁게 포함할 수 있습니다.
- 별도 storage version token이 없으면 `generatedAt` 계열 시각을 candidate artifact version으로 재사용할 수 있습니다.

## Ranking and Explanation Direction

현재 최소 개선 방향:

- lexical coverage만 보지 않고 `title`, `summary`, `body`를 분리해 반영합니다.
- exact phrase match를 별도 boost로 둡니다.
- 최근 regeneration 또는 source update를 freshness boost로 반영합니다.
- truly user-facing family는 family priority를 가질 수 있습니다.
- 결과에는 score뿐 아니라 reason list를 함께 남깁니다.

현재 이 문서가 고정하지 않는 것:

- semantic/vector retrieval 도입 시점
- canonical object search와 personal page retrieval의 full ranking 통합 방식
- final HTTP endpoint path
- LLM runtime or transport contract

## Open Questions

- personal page retrieval에 canonical object/relation retrieval을 언제 결합할지
- bundle에 relation neighborhood를 언제 1급 context block으로 넣을지
- regenerated Personal page의 default mode를 `persisted`와 `ephemeral` 중 어디에 둘지
