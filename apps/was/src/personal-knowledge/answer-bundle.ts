import type {
  AnswerBundleContextBlock,
  AnswerGenerationInputBundle,
  KnowledgeObjectRef,
  KnowledgeRelationRef,
  PersonalFamilyKey,
  RetrievalCandidate,
  RetrievalOutput,
} from "./types.ts";
import type { CanonicalEvidence } from "./canonical-evidence.ts";

export function buildAnswerGenerationInputBundle(
  retrieval: RetrievalOutput,
  options: {
    preferredFamilies?: PersonalFamilyKey[];
    bundleLimit?: number;
    now?: string;
    canonicalEvidence?: CanonicalEvidence[];
  } = {},
): AnswerGenerationInputBundle {
  const topCandidates = retrieval.candidates.slice(0, options.bundleLimit ?? 3);
  const matchedTerms = [...new Set(topCandidates.flatMap((candidate) => candidate.explanation.matchedTerms))];
  const preferredFamilies = options.preferredFamilies ?? [
    "personal.workspace_briefing",
    "personal.application_next_steps",
  ];

  return {
    bundleKind: "personal_answer_input_bundle",
    query: retrieval.query,
    assembledAt: options.now ?? new Date().toISOString(),
    retrieval: {
      rankingVersion: retrieval.rankingVersion,
      retrievedAt: retrieval.retrievedAt,
      topCandidates,
      omittedCandidateCount: Math.max(retrieval.candidates.length - topCandidates.length, 0),
    },
    contextBlocks: topCandidates.map(toContextBlock),
    answerIntent: {
      matchedTerms,
      preferredFamilies,
    },
    citationSummary: {
      objectRefs: uniqueObjectRefs(topCandidates),
      relationRefs: uniqueRelationRefs(topCandidates),
    },
    relationContextBlocks: buildRelationContextBlocks(topCandidates, options.canonicalEvidence ?? []),
    canonicalEvidence: (options.canonicalEvidence ?? []).map((entry) => ({
      objectRef: entry.objectRef,
      summary: entry.summary,
      relationRefs: entry.relationRefs ?? [],
      matchedTerms: entry.matchedTerms ?? [],
    })),
  };
}

function toContextBlock(candidate: RetrievalCandidate): AnswerBundleContextBlock {
  const objectRef = candidate.page.pageRef.objectRef;
  const relatedObjectRefs = objectRef ? [objectRef] : [];
  const relationRefs = objectRef
    ? [
        {
          relationId: `derived-from:${candidate.page.pageRef.pageId}:${objectRef.objectId}`,
          relationType: "derived_from",
          toObjectId: objectRef.objectId,
        },
      ]
    : [];

  return {
    pageRef: candidate.page.pageRef,
    title: candidate.page.title,
    familyKey: candidate.page.pageRef.familyKey,
    summary: candidate.page.summary,
    excerpt: firstMeaningfulLines(candidate.page.bodyMarkdown),
    whyIncluded: candidate.explanation.reasons[0] ?? "high-ranking retrieved page",
    score: candidate.score,
    objectRef,
    relatedObjectRefs,
    relationRefs,
    citations: [
      {
        kind: "summary",
        label: candidate.page.summary,
      },
      {
        kind: "excerpt",
        label: firstMeaningfulLines(candidate.page.bodyMarkdown),
      },
      ...(objectRef
        ? [
            {
              kind: "object_ref" as const,
              label: `${objectRef.objectKind}:${objectRef.objectId}`,
            },
          ]
        : []),
      ...relationRefs.map((relationRef) => ({
        kind: "relation_ref" as const,
        label: `${relationRef.relationType ?? "related"}:${relationRef.relationId}`,
      })),
    ],
  };
}

function uniqueObjectRefs(candidates: RetrievalCandidate[]): KnowledgeObjectRef[] {
  const seen = new Set<string>();
  const refs: KnowledgeObjectRef[] = [];

  for (const candidate of candidates) {
    const objectRef = candidate.page.pageRef.objectRef;

    if (!objectRef) {
      continue;
    }

    const key = `${objectRef.objectKind}:${objectRef.objectId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    refs.push(objectRef);
  }

  return refs;
}

function uniqueRelationRefs(candidates: RetrievalCandidate[]): KnowledgeRelationRef[] {
  const seen = new Set<string>();
  const refs: KnowledgeRelationRef[] = [];

  for (const candidate of candidates) {
    const objectRef = candidate.page.pageRef.objectRef;

    if (!objectRef) {
      continue;
    }

    const relationRef: KnowledgeRelationRef = {
      relationId: `derived-from:${candidate.page.pageRef.pageId}:${objectRef.objectId}`,
      relationType: "derived_from",
      toObjectId: objectRef.objectId,
    };

    if (seen.has(relationRef.relationId)) {
      continue;
    }

    seen.add(relationRef.relationId);
    refs.push(relationRef);
  }

  return refs;
}

function buildRelationContextBlocks(
  candidates: RetrievalCandidate[],
  canonicalEvidence: CanonicalEvidence[],
): AnswerGenerationInputBundle["relationContextBlocks"] {
  const blocks: AnswerGenerationInputBundle["relationContextBlocks"] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const objectRef = candidate.page.pageRef.objectRef;

    if (!objectRef) {
      continue;
    }

    const relationRef: KnowledgeRelationRef = {
      relationId: `derived-from:${candidate.page.pageRef.pageId}:${objectRef.objectId}`,
      relationType: "derived_from",
      toObjectId: objectRef.objectId,
    };

    if (!seen.has(relationRef.relationId)) {
      seen.add(relationRef.relationId);
      blocks.push({
        relationRef,
        sourcePageRef: candidate.page.pageRef,
        summary: `${candidate.page.title}가 ${objectRef.objectKind}:${objectRef.objectId} 문맥에서 파생됨`,
        objectRefs: [objectRef],
        neighborhoodSummary: `${objectRef.objectKind}:${objectRef.objectId} anchor only`,
      });
    }
  }

  for (const entry of canonicalEvidence) {
    for (const relationRef of entry.relationRefs ?? []) {
      if (seen.has(relationRef.relationId)) {
        continue;
      }

      seen.add(relationRef.relationId);
      blocks.push({
        relationRef,
        summary: entry.summary,
        objectRefs: [entry.objectRef],
        neighborhoodSummary: summarizeNeighborhood(entry.objectRef, entry.relationRefs ?? []),
      });
    }
  }

  return blocks;
}

function firstMeaningfulLines(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .slice(0, 2)
    .join(" ")
    .slice(0, 220);
}

function summarizeNeighborhood(
  objectRef: KnowledgeObjectRef,
  relationRefs: KnowledgeRelationRef[],
): string {
  if (relationRefs.length === 0) {
    return `${objectRef.objectKind}:${objectRef.objectId} without canonical relation anchors`;
  }

  const relationTypes = [...new Set(relationRefs.map((entry) => entry.relationType ?? "related"))];
  return `${objectRef.objectKind}:${objectRef.objectId} with ${relationRefs.length} canonical relation anchor(s): ${relationTypes.join(", ")}`;
}
