import test from "node:test"
import assert from "node:assert/strict"
import { createStratawikiPersonalKnowledgeClient } from "../src/adapters/ask/stratawiki-personal-knowledge-client.js"

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
    recordId: "personal:1",
  })
  await client.getExplanation({
    layer: "personal",
    recordId: "personal:1",
    tenantId: "tenant-1",
    userId: "user-1",
  })
  const build = await client.buildInterpretationSnapshot({
    payload: {
      domain: "recruiting",
      partition: { family: "market_trends", segment: "backend-mid" },
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
})
