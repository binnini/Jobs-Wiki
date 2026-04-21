import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  readIncrementalState,
  resolveIncrementalStatePath,
  updateIncrementalState,
  writeIncrementalState,
} from "../src/lib/incremental-state-store.js"

test("incremental state store reads missing state as an empty baseline", async () => {
  const directory = await mkdtemp(join(tmpdir(), "jobs-wiki-ingest-state-"))

  const state = await readIncrementalState({
    directory,
    sourceId: "worknet.recruiting",
  })

  assert.equal(state.sourceId, "worknet.recruiting")
  assert.deepEqual(state.recentFingerprints, [])
  assert.deepEqual(state.recentSourceIds, [])
  assert.equal(state.lastSuccessfulRun, null)
})

test("incremental state store persists and updates fingerprints in recency order", async () => {
  const directory = await mkdtemp(join(tmpdir(), "jobs-wiki-ingest-state-"))
  const previousState = await readIncrementalState({
    directory,
    sourceId: "worknet.recruiting",
  })

  const nextState = updateIncrementalState({
    previousState,
    sourceId: "worknet.recruiting",
    processedEntries: [
      { sourceId: "EMP-2", fingerprint: "EMP-2:hash-b" },
      { sourceId: "EMP-1", fingerprint: "EMP-1:hash-a" },
    ],
    recentFingerprintLimit: 3,
    run: {
      runId: "run-001",
      mode: "incremental_apply",
    },
  })

  const receipt = await writeIncrementalState({
    directory,
    sourceId: "worknet.recruiting",
    state: nextState,
  })
  const reread = await readIncrementalState({
    directory,
    sourceId: "worknet.recruiting",
  })

  assert.equal(receipt.path, resolveIncrementalStatePath({
    directory,
    sourceId: "worknet.recruiting",
  }))
  assert.deepEqual(reread.recentFingerprints, ["EMP-2:hash-b", "EMP-1:hash-a"])
  assert.deepEqual(reread.recentSourceIds, ["EMP-2", "EMP-1"])
  assert.equal(reread.lastSuccessfulRun.runId, "run-001")
})
