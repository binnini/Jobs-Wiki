import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PERSONAL_FAMILY_SET,
  createPersonalKnowledgeRuntimeModule,
  createPersonalKnowledgeRouteBindings,
  handleRegeneratePersonalKnowledge,
  handlePresentQueryPersonalKnowledge,
  InMemoryCanonicalEvidenceAuthority,
  InMemoryPersonalPageAuthority,
  PersonalKnowledgeToolRegistry,
  queryPersonalKnowledge,
  registerPersonalKnowledgeRuntimeModule,
  registerPersonalKnowledgeTools,
  retrieveForQuery,
  toPersonalKnowledgeQueryEnvelope,
} from "../../apps/was/src/index.ts";
import type { PersonalPage } from "../../apps/was/src/index.ts";

const seedPages: PersonalPage[] = [
  {
    ownerUserId: "user-1",
    pageRef: {
      pageId: "briefing-1",
      familyKey: "personal.workspace_briefing",
      objectRef: {
        objectId: "recruitment-1",
        objectKind: "recruitment",
        title: "Platform Engineer Hiring",
      },
    },
    title: "Backend platform application briefing",
    summary: "지원 우선순위와 면접 준비 포인트를 정리한 브리핑",
    bodyMarkdown:
      "플랫폼 엔지니어 지원 전략과 resume tailoring 메모. 면접 대비 질문과 회사별 비교가 정리되어 있다.",
    generatedAt: "2026-04-15T10:00:00.000Z",
    sourceUpdatedAt: "2026-04-15T09:00:00.000Z",
    visibility: "applied",
    tags: ["backend", "platform"],
  },
  {
    ownerUserId: "user-1",
    pageRef: {
      pageId: "next-steps-1",
      familyKey: "personal.application_next_steps",
      objectRef: {
        objectId: "activity-1",
        objectKind: "activity",
        title: "Interview follow-up",
      },
    },
    title: "Application next steps for backend roles",
    summary: "이력서 수정, 포트폴리오 링크 정리, 면접 질문 준비",
    bodyMarkdown:
      "이번 주 안에 resume bullet을 업데이트하고 platform incidents 사례를 정리한다. 지원 마감과 follow-up 메일 일정도 확인한다.",
    generatedAt: "2026-04-16T08:00:00.000Z",
    sourceUpdatedAt: "2026-04-16T07:30:00.000Z",
    visibility: "applied",
    tags: ["resume", "interview"],
  },
  {
    ownerUserId: "user-1",
    pageRef: {
      pageId: "other-1",
      familyKey: "personal.workspace_briefing",
    },
    title: "Training comparison note",
    summary: "부트캠프와 직업훈련 과정을 비교한 메모",
    bodyMarkdown: "데이터 분석 훈련 위주 메모",
    generatedAt: "2026-03-10T10:00:00.000Z",
    visibility: "applied",
  },
];

const canonicalEvidence = [
  {
    objectRef: {
      objectId: "recruitment-1",
      objectKind: "recruitment",
      title: "Platform Engineer Hiring",
    },
    summary: "마감이 임박한 backend platform recruitment이며 resume tailoring과 incident 경험 강조가 중요하다.",
    relationRefs: [
      {
        relationId: "offered-by:recruitment-1:company-1",
        relationType: "offered_by",
        fromObjectId: "recruitment-1",
        toObjectId: "company-1",
      },
    ],
  },
];

test("retrieve_for_query ranks recent direct matches higher and explains why", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const result = await retrieveForQuery(authority, {
    userId: "user-1",
    query: "backend resume",
    now: "2026-04-16T10:00:00.000Z",
  });

  assert.equal(result.candidates[0]?.page.pageRef.pageId, "next-steps-1");
  assert.deepEqual(result.candidates[0]?.explanation.matchedTerms, ["backend", "resume"]);
  assert.match(
    result.candidates[0]?.explanation.reasons.join(" "),
    /recently regenerated personal page/,
  );
});

test("query_personal_knowledge builds answer bundle and generates user-facing families", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const result = await queryPersonalKnowledge(authority, {
    userId: "user-1",
    query: "backend resume",
    now: "2026-04-16T10:00:00.000Z",
    bundleLimit: 2,
  });

  assert.equal(result.answerBundle.bundleKind, "personal_answer_input_bundle");
  assert.equal(result.answerBundle.contextBlocks.length, 2);
  assert.equal(result.answerBundle.citationSummary.objectRefs.length, 2);
  assert.equal(result.answerBundle.citationSummary.relationRefs.length, 2);
  assert.equal(result.generatedPages.length, 2);
  assert.deepEqual(DEFAULT_PERSONAL_FAMILY_SET, [
    "personal.workspace_briefing",
    "personal.application_next_steps",
  ]);
  assert.equal(result.generatedPages[0]?.pageRef.familyKey, "personal.workspace_briefing");
  assert.equal(result.generatedPages[0]?.generationMode, "persisted");
  assert.match(result.generatedPages[1]?.bodyMarkdown ?? "", /Next Actions/);
  assert.equal(
    result.generatedPages.some((page) => page.pageRef.familyKey === "personal.evidence_map"),
    false,
  );
  assert.match(
    result.answerBundle.relationContextBlocks[0]?.neighborhoodSummary ?? "",
    /anchor|canonical relation anchor/,
  );
});

test("query_personal_knowledge optionally merges canonical evidence when policy allows it", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const canonicalAuthority = new InMemoryCanonicalEvidenceAuthority(canonicalEvidence);
  const result = await queryPersonalKnowledge(
    authority,
    {
      userId: "user-1",
      query: "backend resume",
      now: "2026-04-16T10:00:00.000Z",
      bundleLimit: 2,
      canonicalPolicy: "prefer_personal_with_canonical",
      generationMode: "ephemeral",
    },
    { canonicalEvidenceAuthority: canonicalAuthority },
  );

  assert.equal(result.answerBundle.canonicalEvidence.length, 1);
  assert.ok(result.answerBundle.relationContextBlocks.length >= 2);
  assert.equal(
    result.answerBundle.canonicalEvidence[0]?.objectRef.objectId,
    "recruitment-1",
  );
  assert.match(result.generatedPages[1]?.bodyMarkdown ?? "", /Canonical Evidence/);
});

test("bootstrap registry wires retrieve_for_query and query_personal_knowledge", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const registry = registerPersonalKnowledgeTools(
    new PersonalKnowledgeToolRegistry(),
    authority,
    {
      regenerationStore: authority,
      canonicalEvidenceAuthority: new InMemoryCanonicalEvidenceAuthority(canonicalEvidence),
    },
  );

  assert.deepEqual(registry.listTools(), [
    "present_query_personal_knowledge",
    "query_personal_knowledge",
    "retrieve_for_query",
  ]);

  await registry.invoke("query_personal_knowledge", {
    userId: "user-1",
    query: "resume",
    now: "2026-04-16T10:00:00.000Z",
  });

  const stored = await authority.readPage({
    pageId: "application-next-steps",
    familyKey: "personal.application_next_steps",
  });
  assert.ok(stored);
  assert.equal(stored?.ownerUserId, "user-1");
});

test("runtime module exposes candidate route bindings with explicit dependencies", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const runtimeModule = createPersonalKnowledgeRuntimeModule({
    readAuthority: authority,
    regenerationStore: authority,
    canonicalEvidenceAuthority: new InMemoryCanonicalEvidenceAuthority(canonicalEvidence),
  });

  assert.equal(runtimeModule.moduleKey, "personal_knowledge");
  assert.deepEqual(
    runtimeModule.routeBindings.map((binding) => ({
      method: binding.method,
      path: binding.path,
      purpose: binding.purpose,
    })),
    [
      {
        method: "GET",
        path: "/workspace/personal-knowledge/query",
        purpose: "candidate_read_endpoint",
      },
      {
        method: "POST",
        path: "/workspace/personal-knowledge/regenerations",
        purpose: "candidate_regeneration_endpoint",
      },
    ],
  );
});

test("runtime module can register route bindings through framework-neutral registrar", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const runtimeModule = createPersonalKnowledgeRuntimeModule({
    readAuthority: authority,
    regenerationStore: authority,
  });
  const registered: Array<{ method: string; path: string; purpose: string }> = [];

  registerPersonalKnowledgeRuntimeModule(runtimeModule, {
    registerRoute(binding) {
      registered.push({
        method: binding.method,
        path: binding.path,
        purpose: binding.purpose,
      });
    },
  });

  assert.deepEqual(registered, [
    {
      method: "GET",
      path: "/workspace/personal-knowledge/query",
      purpose: "candidate_read_endpoint",
    },
    {
      method: "POST",
      path: "/workspace/personal-knowledge/regenerations",
      purpose: "candidate_regeneration_endpoint",
    },
  ]);
});

test("present_query_personal_knowledge returns consumer-facing envelope", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const canonicalAuthority = new InMemoryCanonicalEvidenceAuthority(canonicalEvidence);
  const raw = await queryPersonalKnowledge(
    authority,
    {
      userId: "user-1",
      query: "backend resume",
      now: "2026-04-16T10:00:00.000Z",
      canonicalPolicy: "prefer_personal_with_canonical",
      generationMode: "ephemeral",
    },
    { canonicalEvidenceAuthority: canonicalAuthority },
  );
  const envelope = toPersonalKnowledgeQueryEnvelope(raw, {
    userId: "user-1",
    query: "backend resume",
    now: "2026-04-16T10:00:00.000Z",
    canonicalPolicy: "prefer_personal_with_canonical",
    generationMode: "ephemeral",
  });

  assert.equal(envelope.kind, "personal_knowledge_query_result");
  assert.equal(envelope.evidencePolicy, "prefer_personal_with_canonical");
  assert.equal(envelope.evidence.canonicalEvidenceCount, 1);
  assert.ok(envelope.evidence.relationContextCount >= 1);
  assert.equal(envelope.generatedPages[0]?.generationMode, "ephemeral");
  assert.equal(envelope.savedArtifacts, undefined);
});

test("HTTP handler normalizes query params into present_query_personal_knowledge envelope", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const canonicalAuthority = new InMemoryCanonicalEvidenceAuthority(canonicalEvidence);
  const response = await handlePresentQueryPersonalKnowledge(
    {
      auth: { userId: "user-1" },
      query: {
        q: "backend resume",
        preferredFamilies:
          "personal.workspace_briefing,personal.application_next_steps",
        bundleLimit: "2",
        generationMode: "ephemeral",
        canonicalPolicy: "prefer_personal_with_canonical",
      },
    },
    {
      readAuthority: authority,
      regenerationStore: authority,
      canonicalEvidenceAuthority: canonicalAuthority,
    },
  );

  assert.equal(response.status, 200);
  if ("error" in response.body) {
    assert.fail("expected successful response body");
  }
  assert.equal(response.body.evidencePolicy, "prefer_personal_with_canonical");
  assert.equal(response.body.evidence.canonicalEvidenceCount, 1);
  assert.equal(response.body.generationMode, "ephemeral");
  assert.equal(response.body.generatedPages[0]?.generationMode, "ephemeral");
  assert.equal(response.body.savedArtifacts, undefined);
});

test("POST regeneration handler persists regenerated pages on a separate candidate surface", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const canonicalAuthority = new InMemoryCanonicalEvidenceAuthority(canonicalEvidence);
  const response = await handleRegeneratePersonalKnowledge(
    {
      auth: { userId: "user-1" },
      body: {
        q: "backend resume",
        preferredFamilies: "personal.workspace_briefing,personal.evidence_map",
        bundleLimit: "2",
        canonicalPolicy: "prefer_personal_with_canonical",
      },
    },
    {
      readAuthority: authority,
      regenerationStore: authority,
      canonicalEvidenceAuthority: canonicalAuthority,
      now: "2026-04-16T10:00:00.000Z",
    },
  );

  assert.equal(response.status, 200);
  if ("error" in response.body) {
    assert.fail("expected successful response body");
  }
  assert.equal(response.body.generationMode, "persisted");
  assert.equal(response.body.generatedPages[1]?.pageRef.familyKey, "personal.evidence_map");
  assert.equal(response.body.savedArtifacts?.length, 2);
  assert.equal(
    response.body.savedArtifacts?.[0]?.pageRef.familyKey,
    "personal.workspace_briefing",
  );
  assert.equal(
    response.body.savedArtifacts?.[1]?.artifactVersion,
    "2026-04-16T10:00:00.000Z",
  );

  const stored = await authority.readPage({
    pageId: "evidence-map",
    familyKey: "personal.evidence_map",
  });
  assert.ok(stored);
  assert.match(stored?.bodyMarkdown ?? "", /Relation Neighborhoods/);
});

test("HTTP handler rejects missing query", async () => {
  const response = await handlePresentQueryPersonalKnowledge(
    {
      auth: { userId: "user-1" },
      query: {
        q: "",
      },
    },
    {
      readAuthority: new InMemoryPersonalPageAuthority(seedPages),
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "query `q` is required" });
});

test("HTTP handler rejects persisted generation on GET", async () => {
  const response = await handlePresentQueryPersonalKnowledge(
    {
      auth: { userId: "user-1" },
      query: {
        q: "backend resume",
        generationMode: "persisted",
      },
    },
    {
      readAuthority: new InMemoryPersonalPageAuthority(seedPages),
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "GET personal knowledge query only supports generationMode=ephemeral",
  });
});

test("HTTP handler rejects public debug flag", async () => {
  const response = await handlePresentQueryPersonalKnowledge(
    {
      auth: { userId: "user-1" },
      query: {
        q: "backend resume",
        includeDebug: "true",
      },
    },
    {
      readAuthority: new InMemoryPersonalPageAuthority(seedPages),
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "public GET personal knowledge query does not expose raw debug payloads",
  });
});

test("ephemeral generation mode returns artifacts without persisting regenerated pages", async () => {
  const authority = new InMemoryPersonalPageAuthority(seedPages);
  const result = await queryPersonalKnowledge(
    authority,
    {
      userId: "user-1",
      query: "backend resume",
      now: "2026-04-16T10:00:00.000Z",
      generationMode: "ephemeral",
    },
    { regenerationStore: authority },
  );

  assert.equal(result.generatedPages[0]?.generationMode, "ephemeral");
  assert.equal(result.savedPages.length, 0);

  const stored = await authority.readPage({
    pageId: "workspace-briefing",
    familyKey: "personal.workspace_briefing",
  });
  assert.equal(stored, null);
});

test("candidate route bindings expose personal knowledge GET handler without fixing a server runtime", async () => {
  const bindings = createPersonalKnowledgeRouteBindings({
    readAuthority: new InMemoryPersonalPageAuthority(seedPages),
    canonicalEvidenceAuthority: new InMemoryCanonicalEvidenceAuthority(canonicalEvidence),
  });

  assert.equal(bindings.length, 2);
  assert.equal(bindings[0]?.method, "GET");
  assert.equal(bindings[0]?.path, "/workspace/personal-knowledge/query");
  assert.equal(bindings[1]?.method, "POST");
  assert.equal(bindings[1]?.path, "/workspace/personal-knowledge/regenerations");
});
