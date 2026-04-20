import test from "node:test"
import assert from "node:assert/strict"
import { StratawikiHttpError } from "../../../packages/integrations/stratawiki-http/client.js"
import {
  StratawikiWriteError,
  createStratawikiWriteClient,
} from "../src/clients/stratawiki-write-client.js"

test("dual-mode ingestion client prefers HTTP proposal endpoints in auto mode", async () => {
  const calls = []
  const client = createStratawikiWriteClient(
    {
      stratawikiBaseUrl: "http://127.0.0.1:8080",
      stratawikiIntegrationMode: "auto",
    },
    {
      httpClient: {
        async validateDomainProposalBatch(payload) {
          calls.push({ kind: "http-validate", payload })
          return { ok: true, committed: false }
        },
        async ingestDomainProposalBatch(payload) {
          calls.push({ kind: "http-ingest", payload })
          return { ok: true, committed: true }
        },
        async listTools() {
          calls.push({ kind: "http-tools" })
          return [{ name: "validate_domain_proposal_batch" }]
        },
      },
      cliClient: {
        wrapperPath: "/tmp/fake-wrapper",
        async assertWriteRuntimeConfig() {},
        async callTool(name) {
          calls.push({ kind: "wrapper", name })
          return { ok: true }
        },
        async listTools() {
          calls.push({ kind: "wrapper-tools" })
          return []
        },
      },
    },
  )

  await client.validateDomainProposalBatch({
    batch: {
      batch_id: "jobs-wiki-batch-001",
      domain: "recruiting",
      producer: "jobs-wiki",
      facts: [],
      relations: [],
    },
  })
  await client.ingestDomainProposalBatch({
    batch: {
      batch_id: "jobs-wiki-batch-001",
      domain: "recruiting",
      producer: "jobs-wiki",
      facts: [],
      relations: [],
    },
  })
  await client.listTools()

  assert.deepEqual(
    calls.map((entry) => entry.kind),
    ["http-validate", "http-ingest", "http-tools"],
  )
})

test("dual-mode ingestion client falls back to wrapper when HTTP is temporarily unavailable", async () => {
  const calls = []
  const client = createStratawikiWriteClient(
    {
      stratawikiBaseUrl: "http://127.0.0.1:8080",
      stratawikiIntegrationMode: "auto",
      stratawikiCliWrapper: "/tmp/fake-wrapper",
    },
    {
      httpClient: {
        async validateDomainProposalBatch() {
          throw new StratawikiHttpError({
            status: 503,
            code: "not_ready",
            message: "StrataWiki HTTP runtime is not ready.",
          })
        },
      },
      cliClient: {
        wrapperPath: "/tmp/fake-wrapper",
        async assertWriteRuntimeConfig() {},
        async callTool(name, payload) {
          calls.push({ name, payload })
          return { ok: true, dry_run: true }
        },
      },
    },
  )

  const result = await client.validateDomainProposalBatch({
    batch: {
      batch_id: "jobs-wiki-batch-002",
      domain: "recruiting",
      producer: "jobs-wiki",
      facts: [],
      relations: [],
    },
  })

  assert.equal(result.ok, true)
  assert.equal(calls[0].name, "validate_domain_proposal_batch")
})

test("write client normalizes runtime configuration failures", async () => {
  const client = createStratawikiWriteClient(
    {
      stratawikiIntegrationMode: "wrapper",
      stratawikiCliWrapper: "/tmp/fake-wrapper",
    },
    {
      cliClient: {
        wrapperPath: "/tmp/fake-wrapper",
        async assertWriteRuntimeConfig() {
          throw new Error("Missing required env: JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS.")
        },
      },
    },
  )

  await assert.rejects(
    () => client.assertWriteRuntimeConfig(),
    (error) => {
      assert.equal(error instanceof StratawikiWriteError, true)
      assert.equal(error.code, "configuration_invalid")
      assert.equal(error.retryable, false)
      assert.equal(error.transport, "wrapper")
      assert.equal(error.operation, "assert_write_runtime_config")
      return true
    },
  )
})
