import test from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"
import {
  loadNearestEnvFile,
  resolveEnvCandidatePaths,
} from "../src/config/env.js"

test("resolveEnvCandidatePaths includes cwd and repo-root candidates", () => {
  const cwd = "/tmp/jobs-wiki/apps/was"
  const candidates = resolveEnvCandidatePaths(cwd)

  assert.deepEqual(candidates, [
    resolve(cwd, ".env"),
    resolve("/Users/yebin/workSpace/Ontology/Jobs-Wiki", ".env"),
  ])
})

test("loadNearestEnvFile loads the first existing candidate", () => {
  const loaded = []

  const resolved = loadNearestEnvFile({
    cwd: "/tmp/jobs-wiki/apps/was",
    existsSyncImpl(candidate) {
      return candidate === "/Users/yebin/workSpace/Ontology/Jobs-Wiki/.env"
    },
    loadEnvFileImpl(candidate) {
      loaded.push(candidate)
    },
  })

  assert.equal(resolved, "/Users/yebin/workSpace/Ontology/Jobs-Wiki/.env")
  assert.deepEqual(loaded, ["/Users/yebin/workSpace/Ontology/Jobs-Wiki/.env"])
})

test("loadNearestEnvFile returns undefined when no candidate exists", () => {
  const resolved = loadNearestEnvFile({
    cwd: "/tmp/jobs-wiki/apps/was",
    existsSyncImpl() {
      return false
    },
    loadEnvFileImpl() {
      throw new Error("should not be called")
    },
  })

  assert.equal(resolved, undefined)
})
