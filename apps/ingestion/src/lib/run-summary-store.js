import { mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const DEFAULT_RUN_SUMMARY_DIR = join(tmpdir(), "jobs-wiki-ingestion-runs")

function sanitizeRunId(value) {
  const normalized = String(value ?? "unknown-run")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")

  return normalized === "" ? "unknown-run" : normalized
}

export function resolveRunSummaryDir(directory) {
  const target = directory && String(directory).trim() !== ""
    ? String(directory).trim()
    : DEFAULT_RUN_SUMMARY_DIR

  return resolve(target)
}

export async function persistRunSummary(summary, { directory } = {}) {
  if (!summary || typeof summary !== "object") {
    throw new Error("Run summary persistence requires a summary object.")
  }

  const targetDirectory = resolveRunSummaryDir(directory)
  await mkdir(targetDirectory, { recursive: true })

  const filePath = join(
    targetDirectory,
    `${sanitizeRunId(summary.runId)}.json`,
  )

  await writeFile(filePath, JSON.stringify(summary, null, 2), "utf-8")

  return {
    directory: targetDirectory,
    path: filePath,
  }
}

export function buildFailureRunSummary({
  runId,
  source,
  dryRun,
  env,
  error,
}) {
  return {
    runId,
    source,
    mode: dryRun ? "dry_run" : "apply",
    status: "failed",
    error: {
      name: error?.name ?? "Error",
      message: error?.message ?? "Unknown ingestion failure",
    },
    env: env
      ? {
          nodeEnv: env.nodeEnv,
          logLevel: env.logLevel,
          worknetConfigured: env.worknetConfigured,
          worknetKeyPresence: env.worknetKeyPresence,
          stratawikiConfigured: env.stratawikiConfigured,
          stratawikiCliWrapper: env.stratawikiCliWrapper,
          stratawikiDomainPackPaths: env.stratawikiDomainPackPaths,
          stratawikiActiveDomainPacks: env.stratawikiActiveDomainPacks,
        }
      : undefined,
    completedAt: new Date().toISOString(),
  }
}
