import test from "node:test"
import assert from "node:assert/strict"

import { runScheduledIngestion } from "../src/jobs/run-scheduled-ingestion.js"
import { runWorknetBackfill } from "../src/jobs/run-worknet-backfill.js"
import { runWorknetIncremental } from "../src/jobs/run-worknet-incremental.js"

function createNoopLogger() {
  return {
    info() {},
    warn() {},
    error() {},
    debug() {},
  }
}

test("runScheduledIngestion retries and aggregates cycle summaries", async () => {
  const attempts = []
  const sleeps = []

  const summary = await runScheduledIngestion({
    env: {
      ingestScheduleCycles: 2,
      ingestScheduleIntervalMs: 25,
      ingestMaxAttempts: 3,
      ingestRetryDelayMs: 10,
    },
    logger: createNoopLogger(),
    dryRun: true,
    sourceId: "worknet.recruiting",
    runId: "schedule-run",
    clients: {},
    retry: async (task) => {
      const first = await task({ attempt: 1 })
      return {
        attempt: 1,
        result: first,
      }
    },
    runIngestion: async ({ attempt, runId }) => {
      attempts.push({ attempt, runId })
      return {
        runId,
        status: "validated",
        summary: {
          fetchedSources: 1,
          validatedBatches: 1,
          ingestedBatches: 0,
        },
        fetchWindow: {
          page: 1,
          size: 5,
          attempt,
        },
      }
    },
    sleep: async (durationMs) => {
      sleeps.push(durationMs)
    },
  })

  assert.equal(summary.mode, "scheduled_dry_run")
  assert.equal(summary.schedule.cycles, 2)
  assert.equal(summary.schedule.intervalMs, 25)
  assert.equal(summary.retryPolicy.maxAttempts, 3)
  assert.equal(summary.retryPolicy.delayMs, 10)
  assert.equal(summary.summary.cyclesCompleted, 2)
  assert.equal(summary.summary.fetchedSources, 2)
  assert.equal(summary.cycles.length, 2)
  assert.equal(attempts.length, 2)
  assert.deepEqual(sleeps, [25])
})

test("runWorknetBackfill aggregates sequential page windows", async () => {
  const pages = []

  const summary = await runWorknetBackfill({
    env: {
      worknetBackfillStartPage: 2,
      worknetBackfillPages: 3,
      worknetFetchSize: 10,
      ingestMaxAttempts: 2,
      ingestRetryDelayMs: 1,
    },
    logger: createNoopLogger(),
    dryRun: false,
    sourceId: "worknet.recruiting",
    runId: "backfill-run",
    clients: {},
    retry: async (task) => {
      const result = await task({ attempt: 1 })
      return {
        attempt: 1,
        result,
      }
    },
    runIngestion: async ({ fetchPage, fetchSize, runId }) => {
      pages.push({ fetchPage, fetchSize, runId })
      return {
        runId,
        status: "ingested",
        summary: {
          fetchedSources: fetchPage,
          validatedBatches: 1,
          ingestedBatches: 1,
        },
        fetchWindow: {
          page: fetchPage,
          size: fetchSize,
          attempt: 1,
        },
      }
    },
  })

  assert.equal(summary.mode, "backfill_apply")
  assert.equal(summary.backfill.startPage, 2)
  assert.equal(summary.backfill.pages, 3)
  assert.equal(summary.backfill.fetchSize, 10)
  assert.equal(summary.retryPolicy.maxAttempts, 2)
  assert.equal(summary.retryPolicy.delayMs, 1)
  assert.equal(summary.summary.pagesProcessed, 3)
  assert.equal(summary.summary.fetchedSources, 9)
  assert.equal(summary.summary.ingestedBatches, 3)
  assert.deepEqual(
    pages.map((entry) => entry.fetchPage),
    [2, 3, 4],
  )
})

test("runWorknetIncremental ingests only unseen fingerprints and persists state", async () => {
  const writes = []

  const summary = await runWorknetIncremental({
    env: {
      worknetFetchSize: 5,
      ingestIncrementalMaxPages: 3,
      ingestIncrementalStopAfterSeenPages: 1,
      ingestIncrementalRecentFingerprintLimit: 10,
      ingestIncrementalStateDir: "/tmp/jobs-wiki-state",
    },
    logger: createNoopLogger(),
    dryRun: false,
    sourceId: "worknet.recruiting",
    runId: "incremental-run",
    clients: {},
    readState: async () => ({
      schemaVersion: 1,
      sourceId: "worknet.recruiting",
      recentFingerprints: ["EMP-1:hash-a"],
      recentSourceIds: ["EMP-1"],
      lastSuccessfulRun: null,
      updatedAt: null,
    }),
    writeState: async (payload) => {
      writes.push(payload)
      return {
        path: "/tmp/jobs-wiki-state/worknet.recruiting.json",
      }
    },
    fetchSources: async ({ fetchPage }) => ({
      fetchWindow: { page: fetchPage, size: 5, attempt: 1 },
      sourcePage: { total: 2 },
      sourceRefs: [
        { sourceId: fetchPage === 1 ? "EMP-2" : "EMP-1" },
      ],
      sourcePayloads: [
        {
          sourceRef: { sourceId: fetchPage === 1 ? "EMP-2" : "EMP-1" },
          payload: {
            source: {
              sourceId: fetchPage === 1 ? "EMP-2" : "EMP-1",
              contentHash: fetchPage === 1 ? "hash-b" : "hash-a",
            },
          },
        },
      ],
      sourceReports: [
        {
          sourceId: fetchPage === 1 ? "EMP-2" : "EMP-1",
          status: "fetched",
        },
      ],
      summary: {
        listedSources: 1,
        fetchedSources: 1,
        failedSources: 0,
        totalAvailableSources: 2,
      },
    }),
    runIngestion: async ({ prefetchedFetchResult, fetchPage }) => ({
      status: "ingested",
      summary: {
        fetchedSources: prefetchedFetchResult.summary.fetchedSources,
        validatedBatches: prefetchedFetchResult.sourceRefs.length,
        ingestedBatches: prefetchedFetchResult.sourceRefs.length,
      },
      fetchWindow: {
        page: fetchPage,
        size: 5,
        attempt: 1,
      },
    }),
  })

  assert.equal(summary.mode, "incremental_apply")
  assert.equal(summary.incremental.pagesScanned, 2)
  assert.equal(summary.incremental.newSources, 1)
  assert.equal(summary.incremental.stopReason, "seen_only_page_reached")
  assert.equal(summary.summary.ingestedBatches, 1)
  assert.equal(summary.pages[0].status, "ingested")
  assert.equal(summary.pages[1].status, "seen_only")
  assert.equal(writes.length, 1)
  assert.deepEqual(writes[0].state.recentFingerprints.slice(0, 2), [
    "EMP-2:hash-b",
    "EMP-1:hash-a",
  ])
})
