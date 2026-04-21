import test from "node:test"
import assert from "node:assert/strict"

import { readCliOptions } from "../src/lib/cli.js"

test("readCliOptions parses scheduled mode and retry controls", () => {
  const options = readCliOptions([
    "--source",
    "worknet",
    "--apply",
    "--mode",
    "scheduled",
    "--retry-attempts",
    "4",
    "--retry-delay-ms",
    "1500",
    "--cycles",
    "2",
  ])

  assert.equal(options.source, "worknet")
  assert.equal(options.dryRun, false)
  assert.equal(options.mode, "scheduled")
  assert.equal(options.retryAttempts, 4)
  assert.equal(options.retryDelayMs, 1500)
  assert.equal(options.cycles, 2)
})

test("readCliOptions parses backfill page window overrides", () => {
  const options = readCliOptions([
    "--source",
    "worknet",
    "--mode",
    "backfill",
    "--dry-run",
    "--backfill-start-page",
    "3",
    "--backfill-pages",
    "5",
    "--size",
    "20",
  ])

  assert.equal(options.mode, "backfill")
  assert.equal(options.dryRun, true)
  assert.equal(options.backfillStartPage, 3)
  assert.equal(options.backfillPages, 5)
  assert.equal(options.size, 20)
})

test("readCliOptions parses incremental options", () => {
  const options = readCliOptions([
    "--source",
    "worknet",
    "--apply",
    "--mode",
    "incremental",
    "--max-pages",
    "4",
    "--state-dir",
    "/tmp/jobs-wiki-state",
  ])

  assert.equal(options.mode, "incremental")
  assert.equal(options.dryRun, false)
  assert.equal(options.maxPages, 4)
  assert.equal(options.stateDir, "/tmp/jobs-wiki-state")
})
