import { mkdir, readFile, writeFile } from "node:fs/promises"
import { basename, join, resolve } from "node:path"

const STATE_SCHEMA_VERSION = 1

function sanitizeSourceId(value) {
  return String(value ?? "worknet.recruiting")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
}

export function resolveIncrementalStateDir(directory) {
  return resolve(String(directory).trim())
}

export function resolveIncrementalStatePath({ directory, sourceId }) {
  const targetDirectory = resolveIncrementalStateDir(directory)
  return join(targetDirectory, `${sanitizeSourceId(sourceId)}.json`)
}

export async function readIncrementalState({ directory, sourceId }) {
  const path = resolveIncrementalStatePath({ directory, sourceId })

  try {
    const raw = await readFile(path, "utf-8")
    const parsed = JSON.parse(raw)
    return normalizeIncrementalState(parsed, { sourceId })
  } catch (error) {
    if (error?.code === "ENOENT") {
      return normalizeIncrementalState({}, { sourceId })
    }
    throw error
  }
}

export async function writeIncrementalState({ directory, sourceId, state }) {
  const targetDirectory = resolveIncrementalStateDir(directory)
  const path = resolveIncrementalStatePath({ directory, sourceId })
  await mkdir(targetDirectory, { recursive: true })
  await writeFile(path, JSON.stringify(state, null, 2), "utf-8")
  return {
    directory: targetDirectory,
    path,
    fileName: basename(path),
  }
}

export function normalizeIncrementalState(rawState, { sourceId }) {
  const recentFingerprints = Array.isArray(rawState?.recentFingerprints)
    ? rawState.recentFingerprints
        .map((value) => String(value).trim())
        .filter(Boolean)
    : []
  const recentSourceIds = Array.isArray(rawState?.recentSourceIds)
    ? rawState.recentSourceIds
        .map((value) => String(value).trim())
        .filter(Boolean)
    : []

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    sourceId: String(sourceId).trim(),
    recentFingerprints,
    recentSourceIds,
    lastSuccessfulRun: rawState?.lastSuccessfulRun ?? null,
    updatedAt: typeof rawState?.updatedAt === "string" ? rawState.updatedAt : null,
  }
}

export function updateIncrementalState({
  previousState,
  sourceId,
  processedEntries,
  recentFingerprintLimit,
  run,
}) {
  const nextFingerprints = [
    ...processedEntries.map((entry) => entry.fingerprint),
    ...previousState.recentFingerprints,
  ]
  const nextSourceIds = [
    ...processedEntries.map((entry) => entry.sourceId),
    ...previousState.recentSourceIds,
  ]

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    sourceId,
    recentFingerprints: uniqueTrimmed(nextFingerprints).slice(0, recentFingerprintLimit),
    recentSourceIds: uniqueTrimmed(nextSourceIds).slice(0, recentFingerprintLimit),
    lastSuccessfulRun: run,
    updatedAt: new Date().toISOString(),
  }
}

function uniqueTrimmed(values) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  )
}
