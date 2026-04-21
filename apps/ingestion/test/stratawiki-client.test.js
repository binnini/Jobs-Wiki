import test from "node:test"
import assert from "node:assert/strict"
import { StratawikiHttpError } from "../../../packages/integrations/stratawiki-http/client.js"
import {
  StratawikiWriteError,
  createStratawikiWriteClient,
} from "../src/clients/stratawiki-write-client.js"

test("ingestion client uses HTTP proposal endpoints", async () => {
  const calls = []
  const client = createStratawikiWriteClient(
    {
      stratawikiBaseUrl: "http://127.0.0.1:8080",
      stratawikiIntegrationMode: "http",
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

test("write client rejects legacy non-http integration modes", async () => {
  assert.throws(
    () =>
      createStratawikiWriteClient({
        stratawikiIntegrationMode: "wrapper",
        stratawikiBaseUrl: "http://127.0.0.1:8080",
      }),
    (error) => {
      assert.equal(error instanceof StratawikiWriteError, true)
      assert.equal(error.code, "configuration_invalid")
      assert.equal(error.transport, "http")
      assert.equal(error.operation, "create_client")
      return true
    },
  )
})

test("write client surfaces HTTP failures without wrapper fallback", async () => {
  const client = createStratawikiWriteClient(
    {
      stratawikiBaseUrl: "http://127.0.0.1:8080",
      stratawikiIntegrationMode: "http",
    },
    {
      httpClient: {
        async validateDomainProposalBatch() {
          throw new StratawikiHttpError({
            status: 503,
            code: "not_ready",
            message: "StrataWiki HTTP runtime is not ready.",
            retryable: true,
          })
        },
      },
    },
  )

  await assert.rejects(
    () =>
      client.validateDomainProposalBatch({
        batch: {
          batch_id: "jobs-wiki-batch-002",
          domain: "recruiting",
          producer: "jobs-wiki",
          facts: [],
          relations: [],
        },
      }),
    (error) => {
      assert.equal(error instanceof StratawikiWriteError, true)
      assert.equal(error.transport, "http")
      assert.equal(error.operation, "validate_domain_proposal_batch")
      assert.equal(error.retryable, true)
      return true
    },
  )
})
