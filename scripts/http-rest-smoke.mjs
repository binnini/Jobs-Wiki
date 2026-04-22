import { randomUUID } from "node:crypto"
import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createStratawikiHttpClient } from "../packages/integrations/stratawiki-http/client.js"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_DATABASE_URL =
  "postgresql://stratawiki:stratawiki@localhost:5432/stratawiki_jobswiki"

function loadRootEnv() {
  try {
    process.loadEnvFile?.(resolve(REPO_ROOT, ".env"))
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error
    }
  }
}

function assertEnv(name) {
  const value = process.env[name]

  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return String(value).trim()
}

function summarize(result) {
  return JSON.stringify(result, null, 2)
}

function loadProposalBatch() {
  const batchId = `jobs-wiki-http-smoke-${randomUUID().slice(0, 8)}`

  return {
    batch_id: batchId,
    domain: "recruiting",
    producer: "jobs-wiki-http-smoke",
    pack_version: "2026-04-22",
    facts: [],
    relations: [],
  }
}

function runPsqlQuery(connectionString, sql) {
  const result = spawnSync(
    "psql",
    [
      connectionString,
      "-X",
      "-q",
      "-t",
      "-A",
      "-F",
      "\t",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql,
    ],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
    },
  )

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || "psql query failed")
  }

  return result.stdout.trim()
}

function resolveLiveFactTarget(connectionString) {
  const output = runPsqlQuery(
    connectionString,
    `
      SELECT
        p.fact_snapshot_id,
        r.canonical_key
      FROM ops.snapshot_pointer AS p
      JOIN fact.record_envelopes AS r
        ON r.domain = p.domain
       AND r.scope = 'shared'
       AND r.entity_type = 'job_posting'
      WHERE p.layer = 'fact'
        AND p.domain = 'recruiting'
        AND r.canonical_key NOT LIKE 'job_posting:EMP-%'
        AND r.canonical_key NOT LIKE 'job_posting:SMOKE-%'
        AND COALESCE(r.provenance_json::text, '') NOT LIKE '%jobs-wiki-http-smoke-%'
      ORDER BY r.updated_at DESC
      LIMIT 1
    `,
  )

  const [factSnapshotId, canonicalKey] = output.split("\t")

  if (!factSnapshotId || !canonicalKey) {
    throw new Error(
      "HTTP smoke could not find a live recruiting fact target. Run real ingestion first.",
    )
  }

  return {
    factSnapshotId,
    factId: `fact:${canonicalKey}`,
  }
}

function resolveCurrentFactPointer(connectionString) {
  const output = runPsqlQuery(
    connectionString,
    `
      SELECT current_snapshot_id, fact_snapshot_id
      FROM ops.snapshot_pointer
      WHERE layer = 'fact'
        AND domain = 'recruiting'
      LIMIT 1
    `,
  )

  const [currentSnapshotId, factSnapshotId] = output.split("\t")
  return {
    currentSnapshotId: currentSnapshotId || null,
    factSnapshotId: factSnapshotId || null,
  }
}

function restoreFactPointer(connectionString, factSnapshotId) {
  if (!factSnapshotId) {
    return
  }

  const escapedSnapshotId = factSnapshotId.replace(/'/g, "''")
  runPsqlQuery(
    connectionString,
    `
      UPDATE ops.snapshot_pointer
      SET current_snapshot_id = '${escapedSnapshotId}',
          fact_snapshot_id = '${escapedSnapshotId}',
          updated_at = NOW()
      WHERE layer = 'fact'
        AND domain = 'recruiting'
    `,
  )
}

async function pollJob(client, jobId, { attempts = 120, intervalMs = 1000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const status = await client.getJobStatus({
      jobId,
      requestId: `jobs-wiki-http-smoke-job-${attempt}`,
    })
    const state = status?.job?.state ?? status?.state

    if (["succeeded", "completed", "processed", "failed", "cancelled"].includes(String(state))) {
      return status
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs))
  }

  throw new Error(`Timed out waiting for background job ${jobId}.`)
}

async function main() {
  loadRootEnv()

  const baseUrl = assertEnv("STRATAWIKI_BASE_URL")
  const databaseUrl = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL
  const apiToken = process.env.STRATAWIKI_API_TOKEN ?? null
  const jobPollAttempts = Number.parseInt(process.env.STRATAWIKI_HTTP_SMOKE_JOB_ATTEMPTS ?? "120", 10)
  const jobPollIntervalMs = Number.parseInt(
    process.env.STRATAWIKI_HTTP_SMOKE_JOB_INTERVAL_MS ?? "1000",
    10,
  )
  const interpretationExecutionMode = (
    process.env.STRATAWIKI_HTTP_SMOKE_EXECUTION_MODE ?? "inline"
  )
    .trim()
    .toLowerCase()
  const previousFactPointer = resolveCurrentFactPointer(databaseUrl)
  const liveFactTarget = resolveLiveFactTarget(databaseUrl)
  const client = createStratawikiHttpClient({
    baseUrl,
    apiToken,
    timeoutMs: Number.parseInt(process.env.STRATAWIKI_HTTP_TIMEOUT_MS ?? "30000", 10),
  })

  const tenantId = `jobswiki-smoke-${randomUUID().slice(0, 8)}`
  const userId = `profile-${randomUUID().slice(0, 8)}`
  const profileVersion = `profile:${Date.now()}`
  const interpretationSegment = `jobs-wiki-http-smoke-${randomUUID().slice(0, 8)}`

  try {
    const health = await client.healthz()
    console.info(`[smoke:http] healthz\n${summarize(health.result)}`)

    const ready = await client.readyz()
    console.info(`[smoke:http] readyz\n${summarize(ready.result)}`)

    const batch = loadProposalBatch()
    const validate = await client.validateDomainProposalBatch({
      batch,
      requestId: "jobs-wiki-http-validate",
      idempotencyKey: `jobs-wiki-http-validate:${batch.batch_id}`,
    })
    console.info(`[smoke:http] validate\n${summarize(validate)}`)

    const ingest = await client.ingestDomainProposalBatch({
      batch,
      requestId: "jobs-wiki-http-ingest",
      idempotencyKey: `jobs-wiki-http-ingest:${batch.batch_id}`,
    })
    console.info(`[smoke:http] ingest\n${summarize(ingest)}`)

    const snapshot = await client.getSnapshotStatus({
      domain: "recruiting",
      requestId: "jobs-wiki-http-snapshot",
    })
    console.info(`[smoke:http] snapshot-status\n${summarize(snapshot)}`)
    console.info(`[smoke:http] live-fact-target\n${summarize(liveFactTarget)}`)

    const profile = await client.upsertProfileContext({
      tenantId,
      userId,
      profileContext: {
        domain: "recruiting",
        profile_version: profileVersion,
        goals: ["find backend roles"],
        preferences: {
          target_role: "Backend Engineer",
        },
        attributes: {
          skills: ["Node.js", "REST API"],
        },
      },
      requestId: "jobs-wiki-http-profile",
      idempotencyKey: `jobs-wiki-http-profile:${tenantId}:${userId}`,
    })
    console.info(`[smoke:http] profile-sync\n${summarize(profile)}`)

    const personal = await client.queryPersonalKnowledge({
      payload: {
        domain: "recruiting",
        tenant_id: tenantId,
        user_id: userId,
        question: "What should I emphasize next for backend recruiting?",
        profile_version: profileVersion,
        fact_snapshot: liveFactTarget.factSnapshotId,
        model_profile: "balanced_default",
        save: false,
      },
      requestId: "jobs-wiki-http-personal-query",
    })
    console.info(`[smoke:http] personal-query\n${summarize(personal)}`)

    const build = await client.buildInterpretationSnapshot({
      payload: {
        domain: "recruiting",
        partition: {
          family: "market_trends",
          segment: interpretationSegment,
        },
        fact_ids: [liveFactTarget.factId],
        fact_snapshot: liveFactTarget.factSnapshotId,
        model_profile: "balanced_default",
        publish: true,
        execution_mode: interpretationExecutionMode,
      },
      requestId: "jobs-wiki-http-build",
      idempotencyKey: `jobs-wiki-http-build:${batch.batch_id}`,
    })
    console.info(`[smoke:http] interpretation-build\n${summarize(build)}`)

    if (build.job_id) {
      const job = await pollJob(client, build.job_id, {
        attempts: jobPollAttempts,
        intervalMs: jobPollIntervalMs,
      })
      console.info(`[smoke:http] job-status\n${summarize(job)}`)
    }

    const cacheRecordId = Array.isArray(personal?.personal_records_used)
      ? personal.personal_records_used[0]
      : null

    if (cacheRecordId) {
      const cache = await client.getCacheStatus({
        domain: "recruiting",
        tenantId,
        userId,
        recordId: cacheRecordId,
        requestId: "jobs-wiki-http-cache",
      })
      console.info(`[smoke:http] cache-status\n${summarize(cache)}`)

      const explanation = await client.getExplanation({
        domain: "recruiting",
        layer: "personal",
        recordId: cacheRecordId,
        tenantId,
        userId,
        requestId: "jobs-wiki-http-explanation",
      })
      console.info(`[smoke:http] explanation\n${summarize(explanation)}`)
    }
  } finally {
    restoreFactPointer(databaseUrl, previousFactPointer.factSnapshotId)
  }
}

main().catch((error) => {
  console.error(`[smoke:http] failed: ${error.message}`)
  process.exitCode = 1
})
