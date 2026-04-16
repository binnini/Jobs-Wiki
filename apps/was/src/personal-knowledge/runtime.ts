import type { CanonicalEvidenceAuthority } from "./canonical-evidence.ts";
import type {
  PersonalPageReadAuthority,
  PersonalPageRegenerationStore,
} from "./page-authority.ts";
import {
  createPersonalKnowledgeRouteBindings,
  type WasRouteBinding,
} from "./router.ts";

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
