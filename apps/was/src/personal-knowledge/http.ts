import type { CanonicalEvidenceAuthority } from "./canonical-evidence.ts";
import type {
  PersonalKnowledgeQueryEnvelope,
  QueryPersonalKnowledgeInput,
} from "./types.ts";
import type {
  PersonalPageReadAuthority,
  PersonalPageRegenerationStore,
} from "./page-authority.ts";
import {
  queryPersonalKnowledge,
  toPersonalKnowledgeQueryEnvelope,
} from "./query-personal-knowledge.ts";

export type PersonalKnowledgeHttpQuery = {
  q: string;
  preferredFamilies?: string;
  bundleLimit?: string;
  generationMode?: string;
  canonicalPolicy?: string;
  includeDebug?: string;
};

export type PersonalKnowledgeHttpRequest = {
  auth: {
    userId: string;
  };
  query: PersonalKnowledgeHttpQuery;
};

export type PersonalKnowledgeRegenerationRequest = {
  auth: {
    userId: string;
  };
  body: {
    q: string;
    preferredFamilies?: PersonalKnowledgeHttpQuery["preferredFamilies"];
    bundleLimit?: PersonalKnowledgeHttpQuery["bundleLimit"];
    canonicalPolicy?: PersonalKnowledgeHttpQuery["canonicalPolicy"];
  };
};

export type PersonalKnowledgeHttpResponse = {
  status: number;
  body: PersonalKnowledgeQueryEnvelope | { error: string };
};

export async function handlePresentQueryPersonalKnowledge(
  request: PersonalKnowledgeHttpRequest,
  dependencies: {
    readAuthority: PersonalPageReadAuthority;
    regenerationStore?: PersonalPageRegenerationStore;
    canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
    now?: string;
  },
): Promise<PersonalKnowledgeHttpResponse> {
  if (!request.query.q?.trim()) {
    return {
      status: 400,
      body: { error: "query `q` is required" },
    };
  }

  if (request.query.generationMode === "persisted") {
    return {
      status: 400,
      body: { error: "GET personal knowledge query only supports generationMode=ephemeral" },
    };
  }

  if (request.query.includeDebug === "true") {
    return {
      status: 400,
      body: { error: "public GET personal knowledge query does not expose raw debug payloads" },
    };
  }

  const input = normalizeHttpQuery(request);
  const result = await queryPersonalKnowledge(dependencies.readAuthority, input, {
    regenerationStore: dependencies.regenerationStore,
    canonicalEvidenceAuthority: dependencies.canonicalEvidenceAuthority,
  });

  return {
    status: 200,
    body: toPersonalKnowledgeQueryEnvelope(result, input),
  };
}

export async function handleRegeneratePersonalKnowledge(
  request: PersonalKnowledgeRegenerationRequest,
  dependencies: {
    readAuthority: PersonalPageReadAuthority;
    regenerationStore?: PersonalPageRegenerationStore;
    canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
    now?: string;
  },
): Promise<PersonalKnowledgeHttpResponse> {
  if (!request.body.q?.trim()) {
    return {
      status: 400,
      body: { error: "body `q` is required" },
    };
  }

  if (!dependencies.regenerationStore) {
    return {
      status: 503,
      body: { error: "persisted regeneration store is unavailable" },
    };
  }

  const input = normalizeRegenerationRequest(request, dependencies.now);
  const result = await queryPersonalKnowledge(dependencies.readAuthority, input, {
    regenerationStore: dependencies.regenerationStore,
    canonicalEvidenceAuthority: dependencies.canonicalEvidenceAuthority,
  });

  return {
    status: 200,
    body: toPersonalKnowledgeQueryEnvelope(result, input),
  };
}

function normalizeHttpQuery(
  request: PersonalKnowledgeHttpRequest,
): QueryPersonalKnowledgeInput {
  return {
    userId: request.auth.userId,
    query: request.query.q,
    preferredFamilies: parseFamilies(request.query.preferredFamilies),
    bundleLimit: parseOptionalInteger(request.query.bundleLimit),
    generationMode: "ephemeral",
    canonicalPolicy:
      request.query.canonicalPolicy === "prefer_personal_with_canonical"
        ? "prefer_personal_with_canonical"
        : "personal_only",
  };
}

function normalizeRegenerationRequest(
  request: PersonalKnowledgeRegenerationRequest,
  now?: string,
): QueryPersonalKnowledgeInput {
  return {
    userId: request.auth.userId,
    query: request.body.q,
    preferredFamilies: parseFamilies(request.body.preferredFamilies),
    bundleLimit: parseOptionalInteger(request.body.bundleLimit),
    generationMode: "persisted",
    canonicalPolicy:
      request.body.canonicalPolicy === "prefer_personal_with_canonical"
        ? "prefer_personal_with_canonical"
        : "personal_only",
    now,
  };
}

function parseFamilies(
  value?: string,
): QueryPersonalKnowledgeInput["preferredFamilies"] {
  if (!value?.trim()) {
    return undefined;
  }

  const families = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (
        item,
      ): item is NonNullable<QueryPersonalKnowledgeInput["preferredFamilies"]>[number] =>
        item === "personal.workspace_briefing" ||
        item === "personal.application_next_steps" ||
        item === "personal.evidence_map",
    );

  return families.length > 0 ? families : undefined;
}

function parseOptionalInteger(value?: string): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
