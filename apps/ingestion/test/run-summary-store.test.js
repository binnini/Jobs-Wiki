import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  buildFailureRunSummary,
  persistRunSummary,
  resolveRunSummaryDir,
} from "../src/lib/run-summary-store.js"

test("persistRunSummary writes summary json to the requested directory", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-run-summary-"))
  const summary = {
    runId: "run-summary-1",
    status: "validated",
    source: "worknet",
  }

  const persisted = await persistRunSummary(summary, {
    directory: tempDir,
  })
  const raw = await readFile(persisted.path, "utf-8")
  const saved = JSON.parse(raw)

  assert.equal(resolveRunSummaryDir(tempDir), persisted.directory)
  assert.equal(saved.runId, "run-summary-1")
  assert.equal(saved.status, "validated")

  await rm(tempDir, { recursive: true, force: true })
})

test("buildFailureRunSummary captures the failure envelope without secrets", () => {
  const summary = buildFailureRunSummary({
    runId: "run-failure-1",
    source: "worknet",
    dryRun: false,
    env: {
      nodeEnv: "test",
      logLevel: "debug",
      worknetConfigured: true,
      worknetKeyPresence: { employment: true },
      stratawikiConfigured: true,
      stratawikiCliWrapper: "/tmp/wrapper",
      stratawikiDomainPackPaths: ["/tmp/recruiting-pack.json"],
      stratawikiActiveDomainPacks: { recruiting: "2026-04-18" },
    },
    error: new Error("runtime unavailable"),
  })

  assert.equal(summary.status, "failed")
  assert.equal(summary.mode, "apply")
  assert.equal(summary.error.message, "runtime unavailable")
  assert.equal(summary.error.code, "unknown_failure")
  assert.equal(summary.error.retryable, false)
  assert.equal(summary.error.status, null)
  assert.equal(summary.env.worknetConfigured, true)
  assert.equal(summary.env.stratawikiCliWrapper, "/tmp/wrapper")
})
