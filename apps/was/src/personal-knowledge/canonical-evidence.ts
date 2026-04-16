import type {
  KnowledgeObjectRef,
  KnowledgeRelationRef,
  QueryPersonalKnowledgeInput,
} from "./types.ts";

export type CanonicalEvidence = {
  objectRef: KnowledgeObjectRef;
  summary: string;
  relationRefs?: KnowledgeRelationRef[];
  matchedTerms?: string[];
};

export interface CanonicalEvidenceAuthority {
  queryEvidence(input: {
    userId: string;
    query: string;
    objectRefs: KnowledgeObjectRef[];
    limit?: number;
  }): Promise<CanonicalEvidence[]>;
}

export class InMemoryCanonicalEvidenceAuthority implements CanonicalEvidenceAuthority {
  readonly #evidence: CanonicalEvidence[];

  constructor(evidence: CanonicalEvidence[] = []) {
    this.#evidence = evidence;
  }

  async queryEvidence(input: {
    userId: string;
    query: string;
    objectRefs: KnowledgeObjectRef[];
    limit?: number;
  }): Promise<CanonicalEvidence[]> {
    const queryTerms = normalizeTerms(input.query);
    const refKeys = new Set(
      input.objectRefs.map((objectRef) => `${objectRef.objectKind}:${objectRef.objectId}`),
    );

    return this.#evidence
      .map((entry) => {
        const text = `${entry.objectRef.title ?? ""}\n${entry.summary}`.toLowerCase();
        const matchedTerms = queryTerms.filter((term) => text.includes(term));
        const objectKey = `${entry.objectRef.objectKind}:${entry.objectRef.objectId}`;
        const anchoredBoost = refKeys.has(objectKey) ? 0.3 : 0;
        const lexicalScore =
          queryTerms.length === 0 ? 0 : matchedTerms.length / queryTerms.length;

        return {
          ...entry,
          matchedTerms,
          score: lexicalScore + anchoredBoost,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, input.limit ?? 3)
      .map(({ score: _score, ...entry }) => entry);
  }
}

export function shouldUseCanonicalEvidence(
  input: QueryPersonalKnowledgeInput,
  objectRefs: KnowledgeObjectRef[],
): boolean {
  const policy = input.canonicalPolicy ?? "personal_only";

  if (policy === "personal_only") {
    return false;
  }

  return objectRefs.length > 0;
}

function normalizeTerms(query: string): string[] {
  return [...new Set(query.toLowerCase().split(/[^a-z0-9가-힣]+/u).filter(Boolean))];
}
