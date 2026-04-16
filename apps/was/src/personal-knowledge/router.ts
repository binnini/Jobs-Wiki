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

export type WasRouteBinding =
  | {
      method: "GET";
      path: "/workspace/personal-knowledge/query";
      purpose: "candidate_read_endpoint";
      handler: (request: PersonalKnowledgeHttpRequest) => Promise<PersonalKnowledgeHttpResponse>;
    }
  | {
      method: "POST";
      path: "/workspace/personal-knowledge/regenerations";
      purpose: "candidate_regeneration_endpoint";
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
      handler: (request) =>
        handleRegeneratePersonalKnowledge(request, {
          readAuthority: dependencies.readAuthority,
          regenerationStore: dependencies.regenerationStore,
          canonicalEvidenceAuthority: dependencies.canonicalEvidenceAuthority,
        }),
    },
  ];
}
