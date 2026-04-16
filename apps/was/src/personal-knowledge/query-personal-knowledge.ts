import type {
  PersonalPage,
  PersonalFamilyKey,
  PersonalKnowledgeQueryEnvelope,
  QueryPersonalKnowledgeInput,
  QueryPersonalKnowledgeResult,
} from "./types.ts";
import type {
  PersonalPageReadAuthority,
  PersonalPageRegenerationStore,
} from "./page-authority.ts";
import type { CanonicalEvidenceAuthority } from "./canonical-evidence.ts";
import { buildAnswerGenerationInputBundle } from "./answer-bundle.ts";
import { shouldUseCanonicalEvidence } from "./canonical-evidence.ts";
import {
  DEFAULT_PERSONAL_FAMILY_SET,
  generatePersonalPages,
} from "./families.ts";
import { retrieveForQuery } from "./retrieval.ts";

export async function queryPersonalKnowledge(
  authority: PersonalPageReadAuthority,
  input: QueryPersonalKnowledgeInput,
  options: {
    regenerationStore?: PersonalPageRegenerationStore;
    canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
  } = {},
): Promise<QueryPersonalKnowledgeResult> {
  const retrieval = await retrieveForQuery(authority, input);
  const preferredFamilies = normalizePreferredFamilies(input.preferredFamilies);
  const generationMode = input.generationMode ?? "persisted";
  const evidencePolicy = input.canonicalPolicy ?? "personal_only";
  const objectRefs = retrieval.candidates
    .map((candidate) => candidate.page.pageRef.objectRef)
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
  const canonicalEvidence =
    options.canonicalEvidenceAuthority &&
    shouldUseCanonicalEvidence(input, objectRefs)
      ? await options.canonicalEvidenceAuthority.queryEvidence({
          userId: input.userId,
          query: input.query,
          objectRefs,
          limit: input.bundleLimit,
        })
      : [];
  const answerBundle = buildAnswerGenerationInputBundle(retrieval, {
    preferredFamilies,
    bundleLimit: input.bundleLimit,
    now: input.now,
    canonicalEvidence,
  });
  const generatedPages = generatePersonalPages(answerBundle, preferredFamilies).map((page) => ({
    ...page,
    generationMode,
  }));
  const savedPages: PersonalPage[] = [];

  if (options.regenerationStore && generationMode === "persisted") {
    for (const page of generatedPages) {
      savedPages.push(await options.regenerationStore.saveGeneratedPage(input.userId, page));
    }
  }

  return {
    retrieval,
    answerBundle,
    generatedPages,
    savedPages,
  };
}

export function toPersonalKnowledgeQueryEnvelope(
  result: QueryPersonalKnowledgeResult,
  input: QueryPersonalKnowledgeInput,
): PersonalKnowledgeQueryEnvelope {
  const relationRefs = dedupeRelationRefs([
    ...result.answerBundle.citationSummary.relationRefs,
    ...result.answerBundle.relationContextBlocks.map((entry) => entry.relationRef),
    ...result.answerBundle.canonicalEvidence.flatMap((entry) => entry.relationRefs),
  ]);

  return {
    kind: "personal_knowledge_query_result",
    query: input.query,
    assembledAt: result.answerBundle.assembledAt,
    generationMode: input.generationMode ?? "persisted",
    evidencePolicy: input.canonicalPolicy ?? "personal_only",
    retrieval: {
      rankingVersion: result.retrieval.rankingVersion,
      candidateCount: result.retrieval.candidates.length,
    },
    evidence: {
      personalContextCount: result.answerBundle.contextBlocks.length,
      canonicalEvidenceCount: result.answerBundle.canonicalEvidence.length,
      relationContextCount: result.answerBundle.relationContextBlocks.length,
      objectRefs: result.answerBundle.citationSummary.objectRefs,
      relationRefs,
    },
    generatedPages: result.generatedPages.map((page) => ({
      pageRef: page.pageRef,
      title: page.title,
      summary: page.summary,
      generationMode: page.generationMode,
    })),
    ...(result.savedPages.length > 0
      ? {
          savedArtifacts: result.savedPages.map((page) => ({
            pageRef: page.pageRef,
            artifactVersion: page.generatedAt,
            savedAt: page.generatedAt,
            visibility: page.visibility,
          })),
        }
      : {}),
  };
}

function normalizePreferredFamilies(
  preferredFamilies?: PersonalFamilyKey[],
): PersonalFamilyKey[] {
  if (!preferredFamilies || preferredFamilies.length === 0) {
    return DEFAULT_PERSONAL_FAMILY_SET;
  }

  return [...new Set(preferredFamilies)];
}

function dedupeRelationRefs(
  relationRefs: QueryPersonalKnowledgeResult["answerBundle"]["citationSummary"]["relationRefs"],
): QueryPersonalKnowledgeResult["answerBundle"]["citationSummary"]["relationRefs"] {
  const seen = new Set<string>();

  return relationRefs.filter((relationRef) => {
    if (seen.has(relationRef.relationId)) {
      return false;
    }

    seen.add(relationRef.relationId);
    return true;
  });
}
