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
};
```

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

## Runtime Binding Direction

현재 구현 기준선:

- transport-neutral HTTP handler가 존재합니다.
- GET query endpoint와 POST regeneration endpoint용 candidate route binding module도 존재합니다.
- 하지만 실제 서버 프레임워크나 global router runtime은 아직 고정하지 않습니다.

## Open Questions

- candidate route binding을 실제 WAS runtime에 언제 연결할지
- POST regeneration surface를 언제 더 넓은 external consumer 범위로 열지
