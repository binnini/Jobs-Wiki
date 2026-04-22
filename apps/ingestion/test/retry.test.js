import test from "node:test"
import assert from "node:assert/strict"

import {
  RetryExhaustedError,
  runWithRetry,
} from "../src/lib/retry.js"
import { buildFailureRunSummary } from "../src/lib/run-summary-store.js"

test("runWithRetry throws RetryExhaustedError with retry metadata", async () => {
  await assert.rejects(
    () =>
      runWithRetry(
        async ({ attempt }) => {
          const error = new Error(`attempt ${attempt} failed`)
          error.code = "temporarily_unavailable"
          error.retryable = true
          throw error
        },
        {
          maxAttempts: 3,
          delayMs: 5,
        },
      ),
    (error) => {
      assert.equal(error instanceof RetryExhaustedError, true)
      assert.equal(error.code, "temporarily_unavailable")
      assert.deepEqual(error.retry, {
        attempts: 3,
        maxAttempts: 3,
        delayMs: 5,
      })
      return true
    },
  )
})

test("buildFailureRunSummary preserves retry and orchestration context", () => {
  const error = new RetryExhaustedError({
    message: "scheduled cycle failed",
    attempts: 3,
    maxAttempts: 3,
    delayMs: 25,
    lastError: Object.assign(new Error("runtime unavailable"), {
      code: "temporarily_unavailable",
      retryable: true,
      transport: "http",
      operation: "validate_domain_proposal_batch",
    }),
  })
  error.context = {
    mode: "scheduled",
    cycleNumber: 2,
    cycles: 4,
    intervalMs: 1000,
    sourceId: "worknet.recruiting",
  }

  const summary = buildFailureRunSummary({
    runId: "retry-run-1",
    source: "worknet",
    mode: "scheduled",
    dryRun: true,
    env: {
      nodeEnv: "test",
      logLevel: "info",
      worknetConfigured: true,
      worknetKeyPresence: { employment: true },
      stratawikiConfigured: true,
      stratawikiCliWrapper: "/tmp/wrapper",
      stratawikiDomainPackPaths: ["/tmp/recruiting-pack.json"],
      stratawikiActiveDomainPacks: { recruiting: "2026-04-22" },
    },
    error,
  })

  assert.equal(summary.error.code, "temporarily_unavailable")
  assert.equal(summary.error.transport, "http")
  assert.equal(summary.error.operation, "validate_domain_proposal_batch")
  assert.deepEqual(summary.retry, {
    attempts: 3,
    maxAttempts: 3,
    delayMs: 25,
  })
  assert.deepEqual(summary.context, {
    mode: "scheduled",
    cycleNumber: 2,
    cycles: 4,
    intervalMs: 1000,
    sourceId: "worknet.recruiting",
  })
})
