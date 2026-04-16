import type {
  PersonalFamilyKey,
  PersonalPage,
  RetrieveForQueryInput,
  RetrievalCandidate,
  RetrievalOutput,
} from "./types.ts";
import type { PersonalPageReadAuthority } from "./page-authority.ts";

const RANKING_VERSION = "personal_retrieval_v1";

const FAMILY_PRIORITY: Record<PersonalFamilyKey, number> = {
  "personal.workspace_briefing": 0.08,
  "personal.application_next_steps": 0.12,
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "how",
  "i",
  "in",
  "is",
  "me",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "with",
]);

export async function retrieveForQuery(
  authority: PersonalPageReadAuthority,
  input: RetrieveForQueryInput,
): Promise<RetrievalOutput> {
  const pages = await authority.listReadablePages(input.userId);
  const normalizedTerms = normalizeTerms(input.query);
  const retrievedAt = input.now ?? new Date().toISOString();
  const limit = input.limit ?? 5;

  const candidates = pages
    .map((page) => scorePage(input.query, normalizedTerms, page, retrievedAt))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

  return {
    query: input.query,
    normalizedTerms,
    retrievedAt,
    rankingVersion: RANKING_VERSION,
    candidates,
  };
}

function scorePage(
  rawQuery: string,
  normalizedTerms: string[],
  page: PersonalPage,
  retrievedAt: string,
): RetrievalCandidate {
  const title = page.title.toLowerCase();
  const summary = page.summary.toLowerCase();
  const body = page.bodyMarkdown.toLowerCase();
  const fullText = `${title}\n${summary}\n${body}`;

  const matchedTerms = normalizedTerms.filter((term) => fullText.includes(term));
  const lexicalCoverage =
    normalizedTerms.length === 0 ? 0 : matchedTerms.length / normalizedTerms.length;
  const titleMatchScore = boundedCount(title, matchedTerms, 2) * 0.18;
  const summaryMatchScore = boundedCount(summary, matchedTerms, 2) * 0.12;
  const bodyMatchScore = boundedCount(body, matchedTerms, 4) * 0.05;
  const exactPhraseBoost = fullText.includes(rawQuery.trim().toLowerCase()) ? 0.18 : 0;
  const freshnessBoost = computeFreshnessBoost(page, retrievedAt);
  const familyPriorityBoost = FAMILY_PRIORITY[page.pageRef.familyKey] ?? 0;
  const score =
    lexicalCoverage * 0.45 +
    titleMatchScore +
    summaryMatchScore +
    bodyMatchScore +
    freshnessBoost +
    familyPriorityBoost +
    exactPhraseBoost;

  const reasons: string[] = [];

  if (matchedTerms.length > 0) {
    reasons.push(`matched ${matchedTerms.length} query term(s): ${matchedTerms.join(", ")}`);
  }

  if (exactPhraseBoost > 0) {
    reasons.push("contains the exact query phrase");
  }

  if (freshnessBoost >= 0.08) {
    reasons.push("recently regenerated personal page");
  }

  if (familyPriorityBoost > 0) {
    reasons.push(`preferred personal family: ${page.pageRef.familyKey}`);
  }

  return {
    rank: 0,
    score: round(score),
    page,
    explanation: {
      matchedTerms,
      scoreBreakdown: {
        lexicalCoverage: round(lexicalCoverage * 0.45),
        titleMatchScore: round(titleMatchScore),
        summaryMatchScore: round(summaryMatchScore),
        bodyMatchScore: round(bodyMatchScore),
        freshnessBoost: round(freshnessBoost),
        familyPriorityBoost: round(familyPriorityBoost),
        exactPhraseBoost: round(exactPhraseBoost),
      },
      reasons,
    },
  };
}

function normalizeTerms(query: string): string[] {
  return [...new Set(query.toLowerCase().split(/[^a-z0-9가-힣]+/u).filter((term) => term && !STOP_WORDS.has(term)))];
}

function boundedCount(text: string, matchedTerms: string[], maxTerms: number): number {
  let count = 0;

  for (const term of matchedTerms) {
    if (text.includes(term)) {
      count += 1;
    }
  }

  return Math.min(count, maxTerms);
}

function computeFreshnessBoost(page: PersonalPage, retrievedAt: string): number {
  const timestamp = page.sourceUpdatedAt ?? page.generatedAt;
  const ageMs = Date.parse(retrievedAt) - Date.parse(timestamp);

  if (Number.isNaN(ageMs) || ageMs < 0) {
    return 0;
  }

  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= 3) {
    return 0.12;
  }

  if (ageDays <= 14) {
    return 0.06;
  }

  return 0;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
