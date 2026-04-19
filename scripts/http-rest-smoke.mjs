import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createStratawikiHttpClient } from "../packages/integrations/stratawiki-http/client.js"
import { createStratawikiRecruitingProposalBatch } from "../apps/ingestion/src/mappers/stratawiki-domain-proposal-batch.js"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

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

async function loadProposalBatch() {
  const sourceFixturePath = resolve(
    REPO_ROOT,
    "tests/domain-packs/fixtures/worknet-open-recruitment-source.json",
  )
  const sourcePayload = JSON.parse(await readFile(sourceFixturePath, "utf8"))
  const batchId = `jobs-wiki-http-smoke-${randomUUID().slice(0, 8)}`

  return createStratawikiRecruitingProposalBatch(sourcePayload, {
    batchId,
    packVersion: "2026-04-18",
  }).batch
}

function pickFactSnapshot(result) {
  return (
    result?.fact_snapshot_id ??
    result?.fact_snapshot ??
    result?.audit?.fact_snapshot_id ??
    result?.audit?.fact_snapshot ??
    null
  )
}

function pickAffectedFactIds(result) {
  if (Array.isArray(result?.affected_fact_ids)) {
    return result.affected_fact_ids
  }

  if (Array.isArray(result?.audit?.affected_fact_ids)) {
    return result.audit.affected_fact_ids
  }

  return []
}

async function pollJob(client, jobId, { attempts = 20, intervalMs = 500 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const status = await client.getJobStatus({
      jobId,
      requestId: `jobs-wiki-http-smoke-job-${attempt}`,
    })
    const state = status?.job?.state ?? status?.state

    if (["succeeded", "completed", "failed", "cancelled"].includes(String(state))) {
      return status
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs))
  }

  throw new Error(`Timed out waiting for background job ${jobId}.`)
}

async function main() {
  loadRootEnv()

  const baseUrl = assertEnv("STRATAWIKI_BASE_URL")
  const apiToken = process.env.STRATAWIKI_API_TOKEN ?? null
  const client = createStratawikiHttpClient({
    baseUrl,
    apiToken,
    timeoutMs: Number.parseInt(process.env.STRATAWIKI_HTTP_TIMEOUT_MS ?? "10000", 10),
  })

  const tenantId = `jobswiki-smoke-${randomUUID().slice(0, 8)}`
  const userId = `profile-${randomUUID().slice(0, 8)}`
  const profileVersion = `profile:${Date.now()}`

  const health = await client.healthz()
  console.info(`[smoke:http] healthz\n${summarize(health.result)}`)

  const ready = await client.readyz()
  console.info(`[smoke:http] readyz\n${summarize(ready.result)}`)

  const batch = await loadProposalBatch()
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
      model_profile: "balanced_default",
      save: false,
    },
    requestId: "jobs-wiki-http-personal-query",
  })
  console.info(`[smoke:http] personal-query\n${summarize(personal)}`)

  const factSnapshot = pickFactSnapshot(ingest) ?? snapshot?.fact_snapshot
  const affectedFactIds = pickAffectedFactIds(ingest)

  if (!factSnapshot || affectedFactIds.length === 0) {
    throw new Error("HTTP smoke could not resolve fact snapshot or affected fact ids.")
  }

  const build = await client.buildInterpretationSnapshot({
    payload: {
      domain: "recruiting",
      partition: {
        family: "market_trends",
        segment: "jobs-wiki-http-smoke",
      },
      fact_ids: [affectedFactIds[0]],
      fact_snapshot: factSnapshot,
      model_profile: "balanced_default",
      publish: true,
      execution_mode: "background",
    },
    requestId: "jobs-wiki-http-build",
    idempotencyKey: `jobs-wiki-http-build:${batch.batch_id}`,
  })
  console.info(`[smoke:http] interpretation-build\n${summarize(build)}`)

  if (!build.job_id) {
    throw new Error("Background interpretation build did not return a job_id.")
  }

  const job = await pollJob(client, build.job_id)
  console.info(`[smoke:http] job-status\n${summarize(job)}`)

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
}

main().catch((error) => {
  console.error(`[smoke:http] failed: ${error.message}`)
  process.exitCode = 1
})
