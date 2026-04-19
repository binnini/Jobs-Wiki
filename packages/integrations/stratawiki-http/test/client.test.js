import test from "node:test"
import assert from "node:assert/strict"
import {
  StratawikiHttpError,
  createStratawikiHttpClient,
} from "../client.js"

function createJsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  })
}

test("http client sends bearer auth, request id, and domain proposal payloads", async () => {
  const calls = []
  const client = createStratawikiHttpClient({
    baseUrl: "http://127.0.0.1:8080",
    apiToken: "test-token",
    requestIdFactory: () => "req-http-1",
    fetchImpl: async (url, options) => {
      calls.push({
        url,
        method: options.method,
        headers: Object.fromEntries(options.headers.entries()),
        body: options.body ? JSON.parse(options.body) : undefined,
      })

      return createJsonResponse({
        ok: true,
        request_id: "req-http-1",
        result: {
          ok: true,
          committed: false,
        },
      })
    },
  })

  const result = await client.validateDomainProposalBatch({
    batch: {
      batch_id: "jobs-wiki-batch-001",
      domain: "recruiting",
      producer: "jobs-wiki",
      facts: [],
      relations: [],
    },
    idempotencyKey: "idemp-1",
  })

  assert.deepEqual(result, {
    ok: true,
    committed: false,
  })
  assert.equal(calls[0].url, "http://127.0.0.1:8080/api/v1/domain-proposals/validate")
  assert.equal(calls[0].method, "POST")
  assert.equal(calls[0].headers.authorization, "Bearer test-token")
  assert.equal(calls[0].headers["x-request-id"], "req-http-1")
  assert.equal(calls[0].headers["idempotency-key"], "idemp-1")
  assert.equal(calls[0].body.batch.domain, "recruiting")
})

test("http client maps profile sync, personal query, and background build endpoints", async () => {
  const calls = []
  const client = createStratawikiHttpClient({
    baseUrl: "http://127.0.0.1:8080",
    requestIdFactory: () => "req-http-2",
    fetchImpl: async (url, options) => {
      calls.push({
        url,
        method: options.method,
        body: options.body ? JSON.parse(options.body) : undefined,
      })

      if (url.endsWith("/api/v1/profile-contexts/tenant-1/user-1")) {
        return createJsonResponse({
          ok: true,
          request_id: "req-http-2",
          result: {
            profile_context: {
              tenant_id: "tenant-1",
              user_id: "user-1",
              profile_version: "profile:v1",
            },
          },
        })
      }

      if (url.endsWith("/api/v1/personal-queries")) {
        return createJsonResponse({
          ok: true,
          request_id: "req-http-2",
          result: {
            answer_markdown: "## Strategy",
          },
        })
      }

      return createJsonResponse(
        {
          ok: true,
          request_id: "req-http-2",
          result: {
            status: "queued",
            job_id: "job-123",
          },
        },
        { status: 202 },
      )
    },
  })

  const profile = await client.upsertProfileContext({
    tenantId: "tenant-1",
    userId: "user-1",
    profileContext: {
      domain: "recruiting",
      tenant_id: "tenant-1",
      user_id: "user-1",
      profile_version: "profile:v1",
      goals: ["find backend roles"],
      preferences: {},
      attributes: {},
    },
  })
  const personal = await client.queryPersonalKnowledge({
    payload: {
      domain: "recruiting",
      tenant_id: "tenant-1",
      user_id: "user-1",
      question: "What should I do next?",
      profile_version: "profile:v1",
      model_profile: "balanced_default",
      save: false,
    },
  })
  const build = await client.buildInterpretationSnapshot({
    payload: {
      domain: "recruiting",
      partition: {
        family: "market_trends",
        segment: "backend-japan-midlevel",
      },
      fact_ids: ["fact:job:1"],
      fact_snapshot: "fact_snap:seed",
      model_profile: "balanced_default",
      publish: true,
      execution_mode: "background",
    },
  })

  assert.equal(profile.profile_context.user_id, "user-1")
  assert.equal(personal.answer_markdown, "## Strategy")
  assert.equal(build.job_id, "job-123")
  assert.equal(build.httpStatus, 202)
  assert.equal(calls[0].method, "PUT")
  assert.equal(calls[1].method, "POST")
  assert.equal(calls[2].method, "POST")
})

test("http client maps snapshot, cache, explanation, and tool-call reads", async () => {
  const client = createStratawikiHttpClient({
    baseUrl: "http://127.0.0.1:8080",
    requestIdFactory: () => "req-http-3",
    fetchImpl: async (url) => {
      if (url.includes("/api/v1/snapshot-status")) {
        return createJsonResponse({
          ok: true,
          request_id: "req-http-3",
          result: { fact_snapshot: "fact_snap:seed" },
        })
      }

      if (url.includes("/api/v1/cache-status/")) {
        return createJsonResponse({
          ok: true,
          request_id: "req-http-3",
          result: { cache_state: "fresh" },
        })
      }

      if (url.includes("/api/v1/explanations/")) {
        return createJsonResponse({
          ok: true,
          request_id: "req-http-3",
          result: { layer: "personal" },
        })
      }

      return createJsonResponse({
        ok: true,
        request_id: "req-http-3",
        result: { status: "ok" },
      })
    },
  })

  const snapshot = await client.getSnapshotStatus({ domain: "recruiting" })
  const cache = await client.getCacheStatus({
    domain: "recruiting",
    tenantId: "tenant-1",
    userId: "user-1",
    recordId: "personal:1",
  })
  const explanation = await client.getExplanation({
    domain: "recruiting",
    layer: "personal",
    recordId: "personal:1",
    tenantId: "tenant-1",
    userId: "user-1",
  })
  const tool = await client.callTool({
    name: "get_profile_context",
    arguments: {
      domain: "recruiting",
      tenant_id: "tenant-1",
      user_id: "user-1",
    },
  })

  assert.equal(snapshot.fact_snapshot, "fact_snap:seed")
  assert.equal(cache.cache_state, "fresh")
  assert.equal(explanation.layer, "personal")
  assert.equal(tool.status, "ok")
})

test("http client raises StratawikiHttpError for non-2xx envelopes", async () => {
  const client = createStratawikiHttpClient({
    baseUrl: "http://127.0.0.1:8080",
    fetchImpl: async () =>
      createJsonResponse(
        {
          ok: false,
          request_id: "req-http-4",
          error: {
            code: "validation_error",
            message: "Requested profile_version does not match the current stored profile context.",
          },
        },
        { status: 422 },
      ),
  })

  await assert.rejects(
    () =>
      client.queryPersonalKnowledge({
        payload: {
          domain: "recruiting",
          tenant_id: "tenant-1",
          user_id: "user-1",
          question: "What should I do next?",
          profile_version: "profile:v1",
          model_profile: "balanced_default",
        },
      }),
    (error) => {
      assert.ok(error instanceof StratawikiHttpError)
      assert.equal(error.status, 422)
      assert.equal(error.code, "validation_error")
      return true
    },
  )
})
