import test from "node:test"
import assert from "node:assert/strict"

import { runScheduledIngestion } from "../src/jobs/run-scheduled-ingestion.js"
import { runWorknetBackfill } from "../src/jobs/run-worknet-backfill.js"

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
  assert.equal(summary.summary.pagesProcessed, 3)
  assert.equal(summary.summary.fetchedSources, 9)
  assert.equal(summary.summary.ingestedBatches, 3)
  assert.deepEqual(
    pages.map((entry) => entry.fetchPage),
    [2, 3, 4],
  )
})
