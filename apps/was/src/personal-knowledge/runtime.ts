import type { CanonicalEvidenceAuthority } from "./canonical-evidence.ts";
import type {
  PersonalKnowledgeAuthorizedInput,
  PersonalKnowledgeHttpRequest,
  PersonalKnowledgeRegenerationRequest,
} from "./http.ts";
import type {
  PersonalPageReadAuthority,
  PersonalPageRegenerationStore,
} from "./page-authority.ts";
import {
  createPersonalKnowledgeRouteBindings,
  type PersonalKnowledgeRouteAccessPolicy,
  type WasRouteBinding,
} from "./router.ts";
import type { PersonalFamilyKey } from "./types.ts";

export type WasAuthenticatedPrincipal = {
  principalType: "user" | "service";
  principalId: string;
  userId?: string;
};

export type WasRequestContext = {
  requestId: string;
  authenticatedPrincipal?: WasAuthenticatedPrincipal;
};

export type WasCapabilityName =
  | "workspace.personal_knowledge.query"
  | "workspace.personal_knowledge.regenerate";

export type WasCapabilityResolver = {
  has(capability: WasCapabilityName, context: WasRequestContext): boolean;
};

export type WasQuotaDecision = {
  allowed: boolean;
  reason?: string;
};

export type WasQuotaDescriptor = {
  quotaScope: "principal" | "user" | "family_set";
  quotaKeyParts: string[];
};

export type WasQuotaPolicy = {
  evaluate(
    routeBinding: WasRouteBinding,
    context: WasRequestContext,
    descriptor: WasQuotaDescriptor,
  ): WasQuotaDecision;
};

export type WasRouteAuthorizationResult =
  | {
      allowed: true;
      targetUserId: string;
      requestedFamilies?: PersonalFamilyKey[];
      canonicalPolicy: "personal_only" | "prefer_personal_with_canonical";
      quotaDescriptor: WasQuotaDescriptor;
    }
  | {
      allowed: false;
      status: 403 | 429;
      body: { error: string };
    };

export type PersonalKnowledgeHandlerExecutionContext = {
  requestId: string;
  routePath: WasRouteBinding["path"];
  authenticatedPrincipal: WasAuthenticatedPrincipal;
  requiredCapability: WasCapabilityName;
  authorizedInput: PersonalKnowledgeAuthorizedInput;
  quotaDescriptor: WasQuotaDescriptor;
};

export type PreparedPersonalKnowledgeRouteExecution =
  | {
      ok: true;
      request:
        | PersonalKnowledgeHttpRequest
        | PersonalKnowledgeRegenerationRequest;
      executionContext: PersonalKnowledgeHandlerExecutionContext;
    }
  | {
      ok: false;
      response: {
        status: 403 | 429;
        body: { error: string };
      };
    };

export type PersonalKnowledgeHandlerEnvelope =
  | {
      method: "GET";
      request: PersonalKnowledgeHttpRequest;
      executionContext: PersonalKnowledgeHandlerExecutionContext;
    }
  | {
      method: "POST";
      request: PersonalKnowledgeRegenerationRequest;
      executionContext: PersonalKnowledgeHandlerExecutionContext;
    };

export type PersonalKnowledgeRuntimeDependencies = {
  readAuthority: PersonalPageReadAuthority;
  regenerationStore?: PersonalPageRegenerationStore;
  canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
};

export type PersonalKnowledgeRuntimeModule = {
  moduleKey: "personal_knowledge";
  routeBindings: WasRouteBinding[];
};

export type WasRuntimeRegistrar = {
  registerRoute(binding: WasRouteBinding): void;
};

export function createPersonalKnowledgeRuntimeModule(
  dependencies: PersonalKnowledgeRuntimeDependencies,
): PersonalKnowledgeRuntimeModule {
  return {
    moduleKey: "personal_knowledge",
    routeBindings: createPersonalKnowledgeRouteBindings(dependencies),
  };
}

export function registerPersonalKnowledgeRuntimeModule(
  module: PersonalKnowledgeRuntimeModule,
  registrar: WasRuntimeRegistrar,
): void {
  for (const binding of module.routeBindings) {
    registrar.registerRoute(binding);
  }
}

export function authorizePersonalKnowledgeRouteRequest(
  routeBinding: WasRouteBinding,
  request: PersonalKnowledgeHttpRequest | PersonalKnowledgeRegenerationRequest,
  context: WasRequestContext,
  policies: {
    capabilityResolver: WasCapabilityResolver;
    quotaPolicy?: WasQuotaPolicy;
  },
): WasRouteAuthorizationResult {
  const principal = context.authenticatedPrincipal;

  if (!principal) {
    return forbidden("authenticated principal is required");
  }

  const targetUserId = request.auth.userId;

  if (!targetUserId?.trim()) {
    return forbidden("target user scope is required");
  }

  if (
    principal.principalType === "user" &&
    principal.userId &&
    principal.userId !== targetUserId
  ) {
    return forbidden("authenticated user does not match requested user scope");
  }

  if (!policies.capabilityResolver.has(routeBinding.accessPolicy.requiredCapability, context)) {
    return forbidden("required capability is missing");
  }

  const requestedFamilies = getRequestedFamilies(routeBinding.accessPolicy, request);
  const canonicalPolicy = getRequestedCanonicalPolicy(request);
  const quotaDescriptor = buildQuotaDescriptor(
    routeBinding.accessPolicy,
    principal,
    targetUserId,
    requestedFamilies,
  );

  const quotaDecision = policies.quotaPolicy?.evaluate(routeBinding, context, quotaDescriptor);

  if (quotaDecision && !quotaDecision.allowed) {
    return {
      allowed: false,
      status: 429,
      body: {
        error: quotaDecision.reason ?? "quota exceeded for personal knowledge route",
      },
    };
  }

  return {
    allowed: true,
    targetUserId,
    requestedFamilies,
    canonicalPolicy,
    quotaDescriptor,
  };
}

export function preparePersonalKnowledgeRouteExecution(
  routeBinding: WasRouteBinding,
  request: PersonalKnowledgeHttpRequest | PersonalKnowledgeRegenerationRequest,
  context: WasRequestContext,
  policies: {
    capabilityResolver: WasCapabilityResolver;
    quotaPolicy?: WasQuotaPolicy;
  },
): PreparedPersonalKnowledgeRouteExecution {
  const authorization = authorizePersonalKnowledgeRouteRequest(
    routeBinding,
    request,
    context,
    policies,
  );

  if (!authorization.allowed) {
    return {
      ok: false,
      response: {
        status: authorization.status,
        body: authorization.body,
      },
    };
  }

  const principal = context.authenticatedPrincipal;

  if (!principal) {
    return {
      ok: false,
      response: {
        status: 403,
        body: { error: "authenticated principal is required" },
      },
    };
  }

  return {
    ok: true,
    request,
    executionContext: {
      requestId: context.requestId,
      routePath: routeBinding.path,
      authenticatedPrincipal: principal,
      requiredCapability: routeBinding.accessPolicy.requiredCapability,
      authorizedInput: {
        userId: authorization.targetUserId,
        preferredFamilies: authorization.requestedFamilies,
        canonicalPolicy: authorization.canonicalPolicy,
      },
      quotaDescriptor: authorization.quotaDescriptor,
    },
  };
}

export function toPersonalKnowledgeHandlerEnvelope(
  routeBinding: WasRouteBinding,
  prepared: Extract<PreparedPersonalKnowledgeRouteExecution, { ok: true }>,
): PersonalKnowledgeHandlerEnvelope {
  if (routeBinding.method === "GET") {
    return {
      method: "GET",
      request: prepared.request as PersonalKnowledgeHttpRequest,
      executionContext: prepared.executionContext,
    };
  }

  return {
    method: "POST",
    request: prepared.request as PersonalKnowledgeRegenerationRequest,
    executionContext: prepared.executionContext,
  };
}

function buildQuotaDescriptor(
  accessPolicy: PersonalKnowledgeRouteAccessPolicy,
  principal: WasAuthenticatedPrincipal,
  targetUserId: string,
  requestedFamilies?: PersonalFamilyKey[],
): WasQuotaDescriptor {
  switch (accessPolicy.quotaScope) {
    case "principal":
      return {
        quotaScope: "principal",
        quotaKeyParts: [principal.principalId],
      };
    case "family_set":
      return {
        quotaScope: "family_set",
        quotaKeyParts: [
          targetUserId,
          ...(requestedFamilies && requestedFamilies.length > 0
            ? [...requestedFamilies].sort()
            : accessPolicy.allowedFamilies ?? []),
        ],
      };
    case "user":
    default:
      return {
        quotaScope: "user",
        quotaKeyParts: [targetUserId],
      };
  }
}

function getRequestedFamilies(
  accessPolicy: PersonalKnowledgeRouteAccessPolicy,
  request: PersonalKnowledgeHttpRequest | PersonalKnowledgeRegenerationRequest,
): PersonalFamilyKey[] | undefined {
  const rawFamilies =
    "query" in request ? request.query.preferredFamilies : request.body.preferredFamilies;
  const parsedFamilies = parseRequestedFamilies(rawFamilies);

  if (!parsedFamilies) {
    return accessPolicy.allowedFamilies;
  }

  if (!accessPolicy.allowedFamilies) {
    return parsedFamilies;
  }

  return parsedFamilies.filter((family) => accessPolicy.allowedFamilies?.includes(family));
}

function getRequestedCanonicalPolicy(
  request: PersonalKnowledgeHttpRequest | PersonalKnowledgeRegenerationRequest,
): "personal_only" | "prefer_personal_with_canonical" {
  const rawPolicy =
    "query" in request ? request.query.canonicalPolicy : request.body.canonicalPolicy;

  return rawPolicy === "prefer_personal_with_canonical"
    ? "prefer_personal_with_canonical"
    : "personal_only";
}

function parseRequestedFamilies(value?: string): PersonalFamilyKey[] | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const families = value
    .split(",")
    .map((item) => item.trim())
    .filter(
      (item): item is PersonalFamilyKey =>
        item === "personal.workspace_briefing" ||
        item === "personal.application_next_steps" ||
        item === "personal.evidence_map",
    );

  return families.length > 0 ? families : undefined;
}

function forbidden(error: string): WasRouteAuthorizationResult {
  return {
    allowed: false,
    status: 403,
    body: { error },
  };
}
