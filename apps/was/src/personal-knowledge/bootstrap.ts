import type {
  PersonalKnowledgeQueryEnvelope,
  QueryPersonalKnowledgeInput,
  QueryPersonalKnowledgeResult,
  RetrieveForQueryInput,
  RetrievalOutput,
} from "./types.ts";
import type {
  PersonalPageReadAuthority,
  PersonalPageRegenerationStore,
} from "./page-authority.ts";
import type { CanonicalEvidenceAuthority } from "./canonical-evidence.ts";
import {
  queryPersonalKnowledge,
  toPersonalKnowledgeQueryEnvelope,
} from "./query-personal-knowledge.ts";
import { retrieveForQuery } from "./retrieval.ts";

type ToolHandler<Input, Output> = (input: Input) => Promise<Output>;

export class PersonalKnowledgeToolRegistry {
  readonly #tools = new Map<string, ToolHandler<unknown, unknown>>();

  register<Input, Output>(name: string, handler: ToolHandler<Input, Output>): void {
    this.#tools.set(name, handler as ToolHandler<unknown, unknown>);
  }

  async invoke<Input, Output>(name: string, input: Input): Promise<Output> {
    const tool = this.#tools.get(name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return (await tool(input as unknown)) as Output;
  }

  listTools(): string[] {
    return [...this.#tools.keys()].sort();
  }
}

export function registerPersonalKnowledgeTools(
  registry: PersonalKnowledgeToolRegistry,
  authority: PersonalPageReadAuthority,
  options: {
    regenerationStore?: PersonalPageRegenerationStore;
    canonicalEvidenceAuthority?: CanonicalEvidenceAuthority;
  } = {},
): PersonalKnowledgeToolRegistry {
  registry.register<RetrieveForQueryInput, RetrievalOutput>(
    "retrieve_for_query",
    (input) => retrieveForQuery(authority, input),
  );
  registry.register<QueryPersonalKnowledgeInput, QueryPersonalKnowledgeResult>(
    "query_personal_knowledge",
    (input) =>
      queryPersonalKnowledge(authority, input, {
        regenerationStore: options.regenerationStore,
        canonicalEvidenceAuthority: options.canonicalEvidenceAuthority,
      }),
  );
  registry.register<QueryPersonalKnowledgeInput, PersonalKnowledgeQueryEnvelope>(
    "present_query_personal_knowledge",
    async (input) =>
      toPersonalKnowledgeQueryEnvelope(
        await queryPersonalKnowledge(authority, input, {
          regenerationStore: options.regenerationStore,
          canonicalEvidenceAuthority: options.canonicalEvidenceAuthority,
        }),
        input,
      ),
  );

  return registry;
}
