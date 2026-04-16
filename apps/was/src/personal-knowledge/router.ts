import type { CanonicalEvidenceAuthority } from "./canonical-evidence.ts";
import {
  handlePresentQueryPersonalKnowledge,
  handleRegeneratePersonalKnowledge,
  type PersonalKnowledgeHttpRequest,
  type PersonalKnowledgeHttpResponse,
  type PersonalKnowledgeRegenerationRequest,
} from "./http.ts";
import type {
  PersonalPageReadAuthority,
  PersonalPageRegenerationStore,
} from "./page-authority.ts";
import type { PersonalFamilyKey } from "./types.ts";

export type PersonalKnowledgeRouteAccessPolicy = {
  audience: "workspace_read_consumer" | "approved_regeneration_consumer";
  requiredCapability:
    | "workspace.personal_knowledge.query"
    | "workspace.personal_knowledge.regenerate";
  quotaScope: "principal" | "user" | "family_set";
  allowsCanonicalEvidence: boolean;
  allowedFamilies?: PersonalFamilyKey[];
};

export type WasRouteBinding =
  | {
      method: "GET";
      path: "/workspace/personal-knowledge/query";
      purpose: "candidate_read_endpoint";
      accessPolicy: PersonalKnowledgeRouteAccessPolicy;
      handler: (request: PersonalKnowledgeHttpRequest) => Promise<PersonalKnowledgeHttpResponse>;
    }
  | {
      method: "POST";
      path: "/workspace/personal-knowledge/regenerations";
      purpose: "candidate_regeneration_endpoint";
      accessPolicy: PersonalKnowledgeRouteAccessPolicy;
      handler: (
        request: PersonalKnowledgeRegenerationRequest,
      ) => Promise<PersonalKnowledgeHttpResponse>;
    };

export function createPersonalKnowledgeRouteBindings(dependencies: {
  readAuthority: PersonalPageReadAuthority;
  regenerationStore?: PersonalPageRegenerationStore;
  canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
}): WasRouteBinding[] {
  return [
    {
      method: "GET",
      path: "/workspace/personal-knowledge/query",
      purpose: "candidate_read_endpoint",
      accessPolicy: {
        audience: "workspace_read_consumer",
        requiredCapability: "workspace.personal_knowledge.query",
        quotaScope: "user",
        allowsCanonicalEvidence: true,
      },
      handler: (request) =>
        handlePresentQueryPersonalKnowledge(request, {
          readAuthority: dependencies.readAuthority,
          regenerationStore: dependencies.regenerationStore,
          canonicalEvidenceAuthority: dependencies.canonicalEvidenceAuthority,
        }),
    },
    {
      method: "POST",
      path: "/workspace/personal-knowledge/regenerations",
      purpose: "candidate_regeneration_endpoint",
      accessPolicy: {
        audience: "approved_regeneration_consumer",
        requiredCapability: "workspace.personal_knowledge.regenerate",
        quotaScope: "family_set",
        allowsCanonicalEvidence: true,
        allowedFamilies: [
          "personal.workspace_briefing",
          "personal.application_next_steps",
          "personal.evidence_map",
        ],
      },
      handler: (request) =>
        handleRegeneratePersonalKnowledge(request, {
          readAuthority: dependencies.readAuthority,
          regenerationStore: dependencies.regenerationStore,
          canonicalEvidenceAuthority: dependencies.canonicalEvidenceAuthority,
        }),
    },
  ];
}
