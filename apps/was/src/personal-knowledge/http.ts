import type { CanonicalEvidenceAuthority } from "./canonical-evidence.ts";
import type {
  PersonalFamilyKey,
  PersonalKnowledgeQueryEnvelope,
  QueryPersonalKnowledgeInput,
} from "./types.ts";
import type {
  PersonalKnowledgeHandlerEnvelope,
} from "./runtime.ts";
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

export type PersonalKnowledgeValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      response: PersonalKnowledgeHttpResponse;
    };

export type PersonalKnowledgeAuthorizedInput = {
  userId: string;
  preferredFamilies?: PersonalFamilyKey[];
  canonicalPolicy: "personal_only" | "prefer_personal_with_canonical";
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
  const validation = validatePresentQueryRequest(request);
  if (!validation.ok) {
    return validation.response;
  }

  return executePresentQueryPersonalKnowledgeEnvelope(
    toDirectPresentQueryEnvelope(request),
    dependencies,
  );
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
  const validation = validateRegeneratePersonalKnowledgeRequest(
    request,
    dependencies.regenerationStore,
  );
  if (!validation.ok) {
    return validation.response;
  }

  return executeRegeneratePersonalKnowledgeEnvelope(
    toDirectRegeneratePersonalKnowledgeEnvelope(request),
    dependencies,
  );
}

export function toDirectPresentQueryEnvelope(
  request: PersonalKnowledgeHttpRequest,
): Extract<PersonalKnowledgeHandlerEnvelope, { method: "GET" }> {
  return {
    method: "GET",
    request,
    executionContext: {
      requestId: "http-direct",
      routePath: "/workspace/personal-knowledge/query",
      authenticatedPrincipal: {
        principalType: "user",
        principalId: request.auth.userId,
        userId: request.auth.userId,
      },
      requiredCapability: "workspace.personal_knowledge.query",
      authorizedInput: {
        userId: request.auth.userId,
        canonicalPolicy:
          request.query.canonicalPolicy === "prefer_personal_with_canonical"
            ? "prefer_personal_with_canonical"
            : "personal_only",
        preferredFamilies: parseFamilies(request.query.preferredFamilies),
      },
      quotaDescriptor: {
        quotaScope: "user",
        quotaKeyParts: [request.auth.userId],
      },
    },
  };
}

export function toDirectRegeneratePersonalKnowledgeEnvelope(
  request: PersonalKnowledgeRegenerationRequest,
): Extract<PersonalKnowledgeHandlerEnvelope, { method: "POST" }> {
  return {
    method: "POST",
    request,
    executionContext: {
      requestId: "http-direct",
      routePath: "/workspace/personal-knowledge/regenerations",
      authenticatedPrincipal: {
        principalType: "user",
        principalId: request.auth.userId,
        userId: request.auth.userId,
      },
      requiredCapability: "workspace.personal_knowledge.regenerate",
      authorizedInput: {
        userId: request.auth.userId,
        canonicalPolicy:
          request.body.canonicalPolicy === "prefer_personal_with_canonical"
            ? "prefer_personal_with_canonical"
            : "personal_only",
        preferredFamilies: parseFamilies(request.body.preferredFamilies),
      },
      quotaDescriptor: {
        quotaScope: "user",
        quotaKeyParts: [request.auth.userId],
      },
    },
  };
}

export async function executePresentQueryPersonalKnowledgeEnvelope(
  envelope: Extract<PersonalKnowledgeHandlerEnvelope, { method: "GET" }>,
  dependencies: {
    readAuthority: PersonalPageReadAuthority;
    regenerationStore?: PersonalPageRegenerationStore;
    canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
    now?: string;
  },
): Promise<PersonalKnowledgeHttpResponse> {
  const input = normalizeAuthorizedHttpQuery(
    envelope.request,
    envelope.executionContext.authorizedInput,
  );
  const result = await queryPersonalKnowledge(dependencies.readAuthority, input, {
    regenerationStore: dependencies.regenerationStore,
    canonicalEvidenceAuthority: dependencies.canonicalEvidenceAuthority,
  });

  return {
    status: 200,
    body: toPersonalKnowledgeQueryEnvelope(result, input),
  };
}

export async function executeRegeneratePersonalKnowledgeEnvelope(
  envelope: Extract<PersonalKnowledgeHandlerEnvelope, { method: "POST" }>,
  dependencies: {
    readAuthority: PersonalPageReadAuthority;
    regenerationStore?: PersonalPageRegenerationStore;
    canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
    now?: string;
  },
): Promise<PersonalKnowledgeHttpResponse> {
  const input = normalizeAuthorizedRegenerationRequest(
    envelope.request,
    envelope.executionContext.authorizedInput,
    dependencies.now,
  );
  const result = await queryPersonalKnowledge(dependencies.readAuthority, input, {
    regenerationStore: dependencies.regenerationStore,
    canonicalEvidenceAuthority: dependencies.canonicalEvidenceAuthority,
  });

  return {
    status: 200,
    body: toPersonalKnowledgeQueryEnvelope(result, input),
  };
}

export function validatePresentQueryRequest(
  request: PersonalKnowledgeHttpRequest,
): PersonalKnowledgeValidationResult {
  if (!request.query.q?.trim()) {
    return invalid(400, "query `q` is required");
  }

  if (request.query.generationMode === "persisted") {
    return invalid(
      400,
      "GET personal knowledge query only supports generationMode=ephemeral",
    );
  }

  if (request.query.includeDebug === "true") {
    return invalid(
      400,
      "public GET personal knowledge query does not expose raw debug payloads",
    );
  }

  return { ok: true };
}

export function validateRegeneratePersonalKnowledgeRequest(
  request: PersonalKnowledgeRegenerationRequest,
  regenerationStore?: PersonalPageRegenerationStore,
): PersonalKnowledgeValidationResult {
  if (!request.body.q?.trim()) {
    return invalid(400, "body `q` is required");
  }

  if (!regenerationStore) {
    return invalid(503, "persisted regeneration store is unavailable");
  }

  return { ok: true };
}

export function normalizeAuthorizedHttpQuery(
  request: PersonalKnowledgeHttpRequest,
  authorizedInput: PersonalKnowledgeAuthorizedInput,
): QueryPersonalKnowledgeInput {
  return {
    userId: authorizedInput.userId,
    query: request.query.q,
    preferredFamilies: authorizedInput.preferredFamilies,
    bundleLimit: parseOptionalInteger(request.query.bundleLimit),
    generationMode: "ephemeral",
    canonicalPolicy: authorizedInput.canonicalPolicy,
  };
}

export function normalizeAuthorizedRegenerationRequest(
  request: PersonalKnowledgeRegenerationRequest,
  authorizedInput: PersonalKnowledgeAuthorizedInput,
  now?: string,
): QueryPersonalKnowledgeInput {
  return {
    userId: authorizedInput.userId,
    query: request.body.q,
    preferredFamilies: authorizedInput.preferredFamilies,
    bundleLimit: parseOptionalInteger(request.body.bundleLimit),
    generationMode: "persisted",
    canonicalPolicy: authorizedInput.canonicalPolicy,
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

function invalid(
  status: 400 | 503,
  error: string,
): PersonalKnowledgeValidationResult {
  return {
    ok: false,
    response: {
      status,
      body: { error },
    },
  };
}
