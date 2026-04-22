import test from "node:test"
import assert from "node:assert/strict"

import { runWorknetIngestion } from "../src/jobs/run-worknet-ingestion.js"

function createNoopLogger() {
  return {
    info() {},
    warn() {},
    error() {},
    debug() {},
  }
}

function createRecruitingPayload(sourceId) {
  return {
    payloadVersion: "recruiting-source-payload/v1",
    source: {
      provider: "worknet",
      kind: "open_recruitment",
      sourceId,
      fetchedAt: "2026-04-19T00:00:00.000Z",
      sourceUrl: `https://example.com/${sourceId}`,
    },
    posting: {
      title: "Backend Engineer",
      companyName: "Jobs Wiki",
      summary: "Production AI delivery role",
    },
    company: {
      sourceCompanyId: "COMP-1",
      name: "Jobs Wiki",
      companyType: "startup",
    },
    jobs: [
      {
        sourceCode: "J001",
        name: "Backend Engineer",
      },
    ],
    recruitmentSections: [],
    selectionSteps: [],
    attachments: [],
  }
}

test("runWorknetIngestion validates proposal batches in dry-run mode", async () => {
  const calls = []

  const summary = await runWorknetIngestion({
    env: {
      nodeEnv: "test",
      logLevel: "debug",
      worknetFetchPage: 1,
      worknetFetchSize: 1,
      worknetKeys: {
        employment: "test-key",
      },
      worknetConfigured: true,
      worknetKeyPresence: {
        employment: true,
      },
      stratawikiConfigured: true,
      stratawikiCliWrapper: "/tmp/fake-wrapper",
      stratawikiDomainPackPaths: ["/tmp/recruiting-pack.json"],
      stratawikiActiveDomainPacks: {
        recruiting: "2026-04-22",
      },
      stratawikiRecruitingPackVersion: "2026-04-22",
    },
    logger: createNoopLogger(),
    dryRun: true,
    sourceId: "worknet.recruiting",
    runId: "run-1",
    clients: {
      stratawiki: {
        wrapperPath: "/tmp/fake-wrapper",
        async assertWriteRuntimeConfig() {},
        async validateDomainProposalBatch({ batch }) {
          calls.push({ name: "validate", batch })
          return {
            ok: true,
            dry_run: true,
            fact_decisions: [{ action: "create" }],
            relation_decisions: [{ action: "create" }],
            rejections: [],
          }
        },
      },
      worknetRecruiting: {
        async listRecruitingSources() {
          return {
            total: 1,
            page: 1,
            size: 1,
            items: [
              {
                sourceId: "EMP-1",
                title: "Backend Engineer",
                companyName: "Jobs Wiki",
              },
            ],
          }
        },
        async getRecruitingSource() {
          return createRecruitingPayload("EMP-1")
        },
      },
    },
  })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, "validate")
  assert.equal(calls[0].batch.domain, "recruiting")
  assert.equal(summary.status, "validated")
  assert.equal(summary.stages[0].status, "completed")
  assert.equal(summary.stages[2].status, "validated")
  assert.equal(summary.summary.validatedBatches, 1)
  assert.equal(summary.summary.ingestedBatches, 0)
  assert.equal(summary.batches[0].validation.ok, true)
})

test("runWorknetIngestion ingests validated proposal batches in apply mode", async () => {
  const calls = []

  const summary = await runWorknetIngestion({
    env: {
      nodeEnv: "test",
      logLevel: "debug",
      worknetFetchPage: 1,
      worknetFetchSize: 1,
      worknetKeys: {
        employment: "test-key",
      },
      worknetConfigured: true,
      worknetKeyPresence: {
        employment: true,
      },
      stratawikiConfigured: true,
      stratawikiCliWrapper: "/tmp/fake-wrapper",
      stratawikiDomainPackPaths: ["/tmp/recruiting-pack.json"],
      stratawikiActiveDomainPacks: {
        recruiting: "2026-04-22",
      },
      stratawikiRecruitingPackVersion: "2026-04-22",
    },
    logger: createNoopLogger(),
    dryRun: false,
    sourceId: "worknet.recruiting",
    runId: "run-2",
    clients: {
      stratawiki: {
        wrapperPath: "/tmp/fake-wrapper",
        async assertWriteRuntimeConfig() {},
        async validateDomainProposalBatch() {
          calls.push("validate")
          return {
            ok: true,
            dry_run: true,
            fact_decisions: [{ action: "create" }],
            relation_decisions: [],
            rejections: [],
          }
        },
        async ingestDomainProposalBatch() {
          calls.push("ingest")
          return {
            ok: true,
            committed: true,
            fact_snapshot_id: "fact-snapshot-1",
          }
        },
      },
      worknetRecruiting: {
        async listRecruitingSources() {
          return {
            total: 1,
            page: 1,
            size: 1,
            items: [
              {
                sourceId: "EMP-2",
                title: "Backend Engineer",
                companyName: "Jobs Wiki",
              },
            ],
          }
        },
        async getRecruitingSource() {
          return createRecruitingPayload("EMP-2")
        },
      },
    },
  })

  assert.deepEqual(calls, ["validate", "ingest"])
  assert.equal(summary.status, "ingested")
  assert.equal(summary.summary.ingestedBatches, 1)
  assert.equal(summary.batches[0].ingest.committed, true)
})
