export type ProjectionVisibility =
  | "applied"
  | "pending"
  | "partial"
  | "unknown"
  | "stale";

export type PersonalFamilyKey =
  | "personal.workspace_briefing"
  | "personal.application_next_steps"
  | "personal.evidence_map";

export type KnowledgeObjectRef = {
  objectId: string;
  objectKind: string;
  title?: string;
};

export type KnowledgeRelationRef = {
  relationId: string;
  relationType?: string;
  fromObjectId?: string;
  toObjectId?: string;
};

export type PersonalPageRef = {
  pageId: string;
  familyKey: PersonalFamilyKey;
  objectRef?: KnowledgeObjectRef;
};

export type PersonalPage = {
  pageRef: PersonalPageRef;
  ownerUserId: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  generatedAt: string;
  sourceUpdatedAt?: string;
  visibility?: ProjectionVisibility;
  tags?: string[];
};

export type RetrievalScoreBreakdown = {
  lexicalCoverage: number;
  titleMatchScore: number;
  summaryMatchScore: number;
  bodyMatchScore: number;
  freshnessBoost: number;
  familyPriorityBoost: number;
  exactPhraseBoost: number;
};

export type RetrievalExplanation = {
  matchedTerms: string[];
  scoreBreakdown: RetrievalScoreBreakdown;
  reasons: string[];
};

export type RetrievalCandidate = {
  rank: number;
  score: number;
  page: PersonalPage;
  explanation: RetrievalExplanation;
};

export type RetrievalOutput = {
  query: string;
  normalizedTerms: string[];
  retrievedAt: string;
  rankingVersion: string;
  candidates: RetrievalCandidate[];
};

export type AnswerBundleContextBlock = {
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
};

export type AnswerGenerationInputBundle = {
  bundleKind: "personal_answer_input_bundle";
  query: string;
  assembledAt: string;
  retrieval: {
    rankingVersion: string;
    retrievedAt: string;
    topCandidates: RetrievalCandidate[];
    omittedCandidateCount: number;
  };
  contextBlocks: AnswerBundleContextBlock[];
  answerIntent: {
    matchedTerms: string[];
    preferredFamilies: PersonalFamilyKey[];
  };
  citationSummary: {
    objectRefs: KnowledgeObjectRef[];
    relationRefs: KnowledgeRelationRef[];
  };
  relationContextBlocks: Array<{
    relationRef: KnowledgeRelationRef;
    sourcePageRef?: PersonalPageRef;
    summary: string;
    objectRefs: KnowledgeObjectRef[];
    neighborhoodSummary?: string;
  }>;
  canonicalEvidence: Array<{
    objectRef: KnowledgeObjectRef;
    summary: string;
    relationRefs: KnowledgeRelationRef[];
    matchedTerms: string[];
  }>;
};

export type GeneratedPersonalPage = {
  pageRef: PersonalPageRef;
  title: string;
  summary: string;
  bodyMarkdown: string;
  generatedAt: string;
  sourcePageRefs: PersonalPageRef[];
  generationMode: "persisted" | "ephemeral";
};

export type PersonalFamilyDefinition = {
  familyKey: PersonalFamilyKey;
  label: string;
  description: string;
  generate: (bundle: AnswerGenerationInputBundle) => GeneratedPersonalPage;
};

export type RetrieveForQueryInput = {
  userId: string;
  query: string;
  limit?: number;
  now?: string;
};

export type QueryPersonalKnowledgeInput = RetrieveForQueryInput & {
  preferredFamilies?: PersonalFamilyKey[];
  bundleLimit?: number;
  generationMode?: "persisted" | "ephemeral";
  canonicalPolicy?: "personal_only" | "prefer_personal_with_canonical";
};

export type QueryPersonalKnowledgeResult = {
  retrieval: RetrievalOutput;
  answerBundle: AnswerGenerationInputBundle;
  generatedPages: GeneratedPersonalPage[];
  savedPages: PersonalPage[];
};

export type PersonalKnowledgeQueryEnvelope = {
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
