import test from "node:test"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { createStratawikiPersonalKnowledgeClient } from "../src/adapters/ask/stratawiki-personal-knowledge-client.js"
import { createStratawikiPersonalDocumentAdapter } from "../src/adapters/personal-document/stratawiki-personal-document-adapter.js"

const PROFILE_CATALOG_PATH = fileURLToPath(
  new URL("../src/fixtures/profile-context-catalog.json", import.meta.url),
)

test("personal knowledge client uses HTTP-first resource endpoints when configured", async () => {
  const calls = []
  const client = createStratawikiPersonalKnowledgeClient({
    env: {
      stratawikiBaseUrl: "http://127.0.0.1:8080",
      stratawikiIntegrationMode: "http",
      readDomain: "recruiting",
      personalQueryModelProfile: "balanced_default",
      getProfileContextTool: "get_profile_context",
      upsertProfileContextTool: "upsert_profile_context",
      personalQueryTool: "query_personal_knowledge",
      getPersonalRecordTool: "get_personal_record",
      getInterpretationRecordTool: "get_interpretation_record",
      getFactRecordTool: "get_fact_record",
    },
    httpClient: {
      async callTool(payload) {
        calls.push({ kind: "tool", payload })
        return { status: "ok" }
      },
      async upsertProfileContext(payload) {
        calls.push({ kind: "profile", payload })
        return { profile_context: { user_id: payload.userId } }
      },
      async queryPersonalKnowledge(payload) {
        calls.push({ kind: "personal_query", payload })
        return { answer_markdown: "## Strategy" }
      },
      async getSnapshotStatus(payload) {
        calls.push({ kind: "snapshot", payload })
        return { fact_snapshot: "fact_snap:seed" }
      },
      async getCacheStatus(payload) {
        calls.push({ kind: "cache", payload })
        return { cache_state: "fresh" }
      },
      async getExplanation(payload) {
        calls.push({ kind: "explanation", payload })
        return { layer: payload.layer }
      },
      async buildInterpretationSnapshot(payload) {
        calls.push({ kind: "build", payload })
        return { status: "queued", job_id: "job-123" }
      },
      async getJobStatus(payload) {
        calls.push({ kind: "job", payload })
        return { job: { id: payload.jobId, state: "pending" } }
      },
    },
  })

  await client.getProfileContext({
    tenantId: "tenant-1",
    userId: "user-1",
  })
  const upserted = await client.upsertProfileContext({
    profileContext: {
      tenant_id: "tenant-1",
      user_id: "user-1",
      profile_version: "profile:v1",
      goals: [],
      preferences: {},
      attributes: {},
    },
  })
  const personal = await client.queryPersonalKnowledge({
    tenantId: "tenant-1",
    userId: "user-1",
    question: "What should I do next?",
    profileVersion: "profile:v1",
  })
  await client.getPersonalRecord({
    tenantId: "tenant-1",
    userId: "user-1",
    personalId: "personal:1",
  })
  await client.getInterpretationRecord({
    interpretationId: "interp:1",
  })
  await client.getFactRecord({
    factId: "fact:1",
  })
  await client.getSnapshotStatus()
  await client.getCacheStatus({
    tenantId: "tenant-1",
    userId: "user-1",
    recordId: "pdoc_raw_1",
  })
  await client.getExplanation({
    layer: "personal_wiki",
    recordId: "pdoc_wiki_1",
    tenantId: "tenant-1",
    userId: "user-1",
  })
  const build = await client.buildInterpretationSnapshot({
    payload: {
      domain: "recruiting",
      subject: {
        type: "market_segment",
        id: "backend-mid",
        label: "Backend Mid",
      },
      family: "market_trends",
      fact_ids: ["fact:1"],
      fact_snapshot: "fact_snap:seed",
      model_profile: "balanced_default",
      publish: true,
      execution_mode: "background",
    },
  })
  const job = await client.getJobStatus({ jobId: "job-123" })

  assert.equal(upserted.profile_context.user_id, "user-1")
  assert.equal(personal.answer_markdown, "## Strategy")
  assert.equal(build.job_id, "job-123")
  assert.equal(job.job.state, "pending")
  assert.equal(calls[0].kind, "tool")
  assert.equal(calls[1].kind, "profile")
  assert.equal(calls[2].kind, "personal_query")
  assert.equal(calls[3].payload.name, "get_personal_record")
  assert.equal(calls.find((entry) => entry.kind === "explanation").payload.layer, "personal")
  assert.deepEqual(calls.find((entry) => entry.kind === "build").payload.payload.selection, {
    family: "market_trends",
    subject_type: "market_segment",
    subject_id: "backend-mid",
    subject_label: "Backend Mid",
  })
})

test("personal knowledge client rejects legacy non-http integration modes", () => {
  assert.throws(
    () =>
      createStratawikiPersonalKnowledgeClient({
        env: {
          stratawikiBaseUrl: "http://127.0.0.1:8080",
          stratawikiIntegrationMode: "wrapper",
        },
        httpClient: {},
      }),
    /STRATAWIKI_INTEGRATION_MODE=http/,
  )
})

test("personal knowledge client uses dedicated HTTP methods for personal CRUD, generation, and link flows", async () => {
  const calls = []
  const client = createStratawikiPersonalKnowledgeClient({
    env: {
      stratawikiBaseUrl: "http://127.0.0.1:8080",
      stratawikiIntegrationMode: "http",
      readDomain: "recruiting",
      personalQueryModelProfile: "balanced_default",
      getProfileContextTool: "get_profile_context",
      upsertProfileContextTool: "upsert_profile_context",
      personalQueryTool: "query_personal_knowledge",
      getPersonalRecordTool: "get_personal_record",
      listPersonalDocumentsTool: "list_personal_documents",
      getPersonalDocumentTool: "get_personal_document",
      createPersonalDocumentTool: "create_personal_document",
      updatePersonalDocumentTool: "update_personal_document",
      deletePersonalDocumentTool: "delete_personal_document",
      registerPersonalAssetTool: "register_personal_asset",
      summarizePersonalDocumentToWikiTool: "summarize_personal_document_to_wiki",
      rewritePersonalDocumentToWikiTool: "rewrite_personal_document_to_wiki",
      structurePersonalDocumentToWikiTool: "structure_personal_document_to_wiki",
      suggestPersonalWikiLinksTool: "suggest_personal_wiki_links",
      attachPersonalWikiLinksTool: "attach_personal_wiki_links",
    },
    httpClient: {
      async callTool(payload) {
        calls.push({ kind: "tool", payload })
        if (payload.name !== "get_profile_context" && payload.name !== "get_personal_record") {
          throw new Error(`unexpected tool call: ${payload.name}`)
        }
        return { ok: true, payload }
      },
      async listPersonalDocuments(payload) {
        calls.push({ kind: "list", payload })
        return { documents: [] }
      },
      async getPersonalDocument(payload) {
        calls.push({ kind: "get", payload })
        return {
          document: {
            document_id: payload.documentId,
            title: "Doc",
            version: 1,
            subspace: "raw",
            kind: "note",
            asset_refs: [],
          },
        }
      },
      async createPersonalDocument(payload) {
        calls.push({ kind: "create", payload })
        return {
          document: {
            document_id: "pdoc_raw_1",
            title: payload.payload.title,
            version: 1,
          },
        }
      },
      async updatePersonalDocument(payload) {
        calls.push({ kind: "update", payload })
        return {
          document: {
            document_id: payload.documentId,
            title: payload.payload.title,
            version: 2,
          },
        }
      },
      async deletePersonalDocument(payload) {
        calls.push({ kind: "delete", payload })
        return {
          document: {
            document_id: payload.documentId,
            status: "deleted",
            version: 3,
          },
        }
      },
      async registerPersonalAsset(payload) {
        calls.push({ kind: "asset", payload })
        return {
          asset: {
            asset_id: "passet_1",
            filename: payload.payload.filename,
          },
        }
      },
      async summarizePersonalDocumentToWiki(payload) {
        calls.push({ kind: "summarize", payload })
        return {
          document: {
            document_id: "pdoc_wiki_1",
            title: "Summary",
            version: 1,
            updated_at: "2026-04-21T00:00:00.000Z",
          },
          trace: [{ step: "summary" }],
        }
      },
      async rewritePersonalDocumentToWiki(payload) {
        calls.push({ kind: "rewrite", payload })
        return {
          document: {
            document_id: "pdoc_wiki_2",
            title: "Rewrite",
            version: 1,
            updated_at: "2026-04-21T00:00:00.000Z",
          },
        }
      },
      async structurePersonalDocumentToWiki(payload) {
        calls.push({ kind: "structure", payload })
        return {
          document: {
            document_id: "pdoc_wiki_3",
            title: "Structure",
            version: 1,
            updated_at: "2026-04-21T00:00:00.000Z",
          },
        }
      },
      async suggestPersonalWikiLinks(payload) {
        calls.push({ kind: "suggest", payload })
        return {
          suggestions: [{ layer: "fact", id: "fact:1" }],
        }
      },
      async attachPersonalWikiLinks(payload) {
        calls.push({ kind: "attach", payload })
        return {
          attached: [{ layer: "fact", id: "fact:1" }],
        }
      },
      async upsertProfileContext(payload) {
        calls.push({ kind: "profile", payload })
        return { profile_context: { user_id: payload.userId } }
      },
      async queryPersonalKnowledge(payload) {
        calls.push({ kind: "personal_query", payload })
        return { answer_markdown: "## Strategy" }
      },
      async getSnapshotStatus(payload) {
        calls.push({ kind: "snapshot", payload })
        return { fact_snapshot: "fact_snap:seed" }
      },
      async getCacheStatus(payload) {
        calls.push({ kind: "cache", payload })
        return { cache_state: "fresh" }
      },
      async getExplanation(payload) {
        calls.push({ kind: "explanation", payload })
        return { layer: payload.layer }
      },
      async buildInterpretationSnapshot(payload) {
        calls.push({ kind: "build", payload })
        return { status: "queued", job_id: "job-123" }
      },
      async getJobStatus(payload) {
        calls.push({ kind: "job", payload })
        return { job: { id: payload.jobId, state: "pending" } }
      },
    },
  })

  const list = await client.listPersonalDocuments({
    tenantId: "tenant-1",
    userId: "user-1",
    subspace: "raw",
  })
  const document = await client.getPersonalDocument({
    tenantId: "tenant-1",
    userId: "user-1",
    documentId: "pdoc_raw_1",
  })
  const created = await client.createPersonalDocument({
    tenantId: "tenant-1",
    userId: "user-1",
    profileVersion: "profile:v1",
    subspace: "raw",
    kind: "note",
    title: "Draft",
  })
  const updated = await client.updatePersonalDocument({
    tenantId: "tenant-1",
    userId: "user-1",
    documentId: "pdoc_raw_1",
    profileVersion: "profile:v1",
    ifVersion: 1,
    title: "Draft v2",
  })
  const deleted = await client.deletePersonalDocument({
    tenantId: "tenant-1",
    userId: "user-1",
    documentId: "pdoc_raw_1",
    ifVersion: 2,
  })
  const asset = await client.registerPersonalAsset({
    tenantId: "tenant-1",
    userId: "user-1",
    assetKind: "resume",
    mediaType: "application/pdf",
    filename: "resume.pdf",
    storageRef: "s3://bucket/resume.pdf",
  })
  const summarized = await client.summarizePersonalDocumentToWiki({
    tenantId: "tenant-1",
    userId: "user-1",
    sourceDocumentRef: { documentId: "pdoc_raw_1", subspace: "raw", version: 1 },
    profileVersion: "profile:v1",
    modelProfile: "balanced_default",
    saveTarget: { subspace: "wiki" },
  })
  const rewritten = await client.rewritePersonalDocumentToWiki({
    tenantId: "tenant-1",
    userId: "user-1",
    sourceDocumentRef: { documentId: "pdoc_raw_1", subspace: "raw", version: 1 },
    profileVersion: "profile:v1",
    modelProfile: "balanced_default",
    saveTarget: { subspace: "wiki" },
  })
  const structured = await client.structurePersonalDocumentToWiki({
    tenantId: "tenant-1",
    userId: "user-1",
    sourceDocumentRef: { documentId: "pdoc_raw_1", subspace: "raw", version: 1 },
    profileVersion: "profile:v1",
    modelProfile: "balanced_default",
    saveTarget: { subspace: "wiki" },
  })
  const suggestions = await client.suggestPersonalWikiLinks({
    tenantId: "tenant-1",
    userId: "user-1",
    wikiDocumentId: "pdoc_wiki_1",
    wikiDocumentVersion: 1,
    profileVersion: "profile:v1",
    modelProfile: "balanced_default",
  })
  const attached = await client.attachPersonalWikiLinks({
    tenantId: "tenant-1",
    userId: "user-1",
    wikiDocumentId: "pdoc_wiki_1",
    wikiDocumentVersion: 1,
    attachments: [{ layer: "fact", id: "fact:1" }],
  })

  assert.deepEqual(list, { documents: [] })
  assert.equal(document.document.document_id, "pdoc_raw_1")
  assert.equal(created.document.document_id, "pdoc_raw_1")
  assert.equal(updated.document.version, 2)
  assert.equal(deleted.document.status, "deleted")
  assert.equal(asset.asset.asset_id, "passet_1")
  assert.equal(summarized.document.document_id, "pdoc_wiki_1")
  assert.equal(rewritten.document.document_id, "pdoc_wiki_2")
  assert.equal(structured.document.document_id, "pdoc_wiki_3")
  assert.equal(suggestions.suggestions.length, 1)
  assert.equal(attached.attached[0].id, "fact:1")
  assert.equal(calls.some((entry) => entry.kind === "tool"), false)
  assert.deepEqual(calls[6].payload.payload.source_document_ref, {
    document_id: "pdoc_raw_1",
    subspace: "raw",
    version: 1,
  })
})

test("personal document adapter routes generation and link flows through the dedicated HTTP client methods", async () => {
  const calls = []
  const personalKnowledgeClient = {
    async callTool(payload) {
      calls.push({ kind: "tool", payload })
      if (payload.name !== "get_profile_context") {
        throw new Error(`unexpected tool call: ${payload.name}`)
      }
      return {
        profile_context: {
          tenant_id: "workspace_demo",
          user_id: "profile_demo_backend",
          profile_version: "profile:v1",
        },
      }
    },
    async getProfileContext(payload) {
      calls.push({ kind: "get_profile_context", payload })
      return {
        profile_context: {
          tenant_id: "workspace_demo",
          user_id: "profile_demo_backend",
          profile_version: "profile:v1",
        },
      }
    },
    async upsertProfileContext(payload) {
      calls.push({ kind: "upsert_profile_context", payload })
      return {
        profile_context: payload.profileContext,
      }
    },
    async getPersonalDocument(payload) {
      calls.push({ kind: "get_personal_document", payload })
      return {
        document: {
          document_id: payload.documentId,
          title: "Source",
          version: 1,
          subspace: "raw",
          kind: "note",
          asset_refs: [],
        },
      }
    },
    async summarizePersonalDocumentToWiki(payload) {
      calls.push({ kind: "summarize", payload })
      return {
        document: {
          document_id: "pdoc_wiki_1",
          title: "Summary",
          body_markdown: "# Summary",
          version: 1,
          updated_at: "2026-04-21T00:00:00.000Z",
        },
        trace: [{ step: "summary" }],
      }
    },
    async suggestPersonalWikiLinks(payload) {
      calls.push({ kind: "suggest", payload })
      return {
        suggestions: [{ layer: "fact", id: "fact:1" }],
      }
    },
    async attachPersonalWikiLinks(payload) {
      calls.push({ kind: "attach", payload })
      return {
        attached: [{ layer: "fact", id: "fact:1" }],
        wiki_document_version: payload.wikiDocumentVersion + 1,
      }
    },
  }

  const adapter = createStratawikiPersonalDocumentAdapter({
    env: {
      readDomain: "recruiting",
      profileContextCatalogPath: PROFILE_CATALOG_PATH,
      personalQueryModelProfile: "balanced_default",
    },
    personalKnowledgeClient,
  })

  const generated = await adapter.generatePersonalWikiDocument({
    userContext: {
      profileId: "profile_demo_backend",
      workspaceId: "workspace_demo",
    },
    documentId: "personal_raw:source-1",
    input: {
      operation: "summarize",
      summaryStyle: "brief",
    },
  })
  const suggestions = await adapter.suggestPersonalWikiLinks({
    userContext: {
      profileId: "profile_demo_backend",
      workspaceId: "workspace_demo",
    },
    documentId: "personal_wiki:pdoc_wiki_1",
    input: {
      maxSuggestions: 1,
    },
  })
  const attached = await adapter.attachPersonalWikiLinks({
    userContext: {
      profileId: "profile_demo_backend",
      workspaceId: "workspace_demo",
    },
    documentId: "personal_wiki:pdoc_wiki_1",
    input: {
      wikiDocumentVersion: 1,
      attachments: [{ layer: "fact", id: "fact:1" }],
    },
  })

  assert.equal(generated.generation.operation, "summarize")
  assert.equal(generated.generation.provider, "stratawiki")
  assert.equal(generated.document_id, "pdoc_wiki_1")
  assert.deepEqual(calls.find((entry) => entry.kind === "summarize").payload.sourceDocumentRef, {
    documentId: "source-1",
    subspace: "raw",
    version: 1,
    kind: "note",
    assetRefs: [],
  })
  assert.equal(suggestions.suggestions.length, 1)
  assert.equal(attached.attached.length, 1)
  assert.equal(
    calls.some((entry) => entry.kind === "summarize" || entry.kind === "suggest" || entry.kind === "attach"),
    true,
  )
  assert.equal(
    calls.some((entry) => entry.kind === "tool" && entry.payload.name !== "get_profile_context"),
    false,
  )
})
