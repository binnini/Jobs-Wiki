import { spawn } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Readable } from "node:stream"
import { createApp } from "../apps/was/src/app.js"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_READ_DATABASE_URL =
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

async function spawnAndCapture(command, args, { cwd = REPO_ROOT } = {}) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })

    child.on("error", rejectPromise)
    child.on("close", (code) => {
      resolvePromise({
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      })
    })
  })
}

async function runStep(label, command, args, options) {
  process.stdout.write(`\n[smoke] ${label}\n`)
  const result = await spawnAndCapture(command, args, options)

  if (result.stdout) {
    process.stdout.write(`${result.stdout}\n`)
  }

  if (result.code !== 0) {
    const suffix = result.stderr || result.stdout || `${command} ${args.join(" ")} failed`
    throw new Error(`[${label}] ${suffix}`)
  }

  return result
}

function createMockResponse() {
  const headers = new Map()

  return {
    headersSent: false,
    statusCode: 200,
    body: "",
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value)
    },
    getHeader(name) {
      return headers.get(name.toLowerCase())
    },
    end(chunk = "") {
      this.body = typeof chunk === "string" ? chunk : chunk.toString("utf8")
      this.headersSent = true
    },
  }
}

async function invokeApp(app, { method = "GET", url = "/", headers = {}, body } = {}) {
  const chunks =
    body === undefined
      ? []
      : [typeof body === "string" ? body : JSON.stringify(body)]

  const req = Readable.from(chunks)
  req.method = method
  req.url = url
  req.headers = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

  const res = createMockResponse()

  await app(req, res)

  return {
    status: res.statusCode,
    body: JSON.parse(res.body || "{}"),
  }
}

function parseJsonLinesOutput(rawText) {
  const trimmed = rawText.trim()

  if (!trimmed) {
    return null
  }

  const blockStart = trimmed.lastIndexOf("\n{")
  const candidate = (blockStart === -1 ? trimmed : trimmed.slice(blockStart + 1)).trim()

  return JSON.parse(candidate)
}

async function queryDatabaseSummary(connectionString) {
  const result = await spawnAndCapture("psql", [
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
    [
      "SELECT",
      "(SELECT count(*) FROM fact.record_envelopes) AS fact_records,",
      "(SELECT count(*) FROM fact.relation_envelopes) AS relation_records,",
      "(SELECT count(*) FROM ops.snapshot_pointer) AS snapshot_pointers,",
      "(SELECT count(*) FROM ops.snapshot_publication) AS snapshot_publications,",
      "(SELECT count(*) FROM ops.outbox_event) AS outbox_events;",
    ].join(" "),
  ])

  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || "Failed to query smoke DB summary.")
  }

  const [factRecords, relationRecords, snapshotPointers, snapshotPublications, outboxEvents] =
    result.stdout.split("\t").map((value) => Number.parseInt(value, 10))

  return {
    factRecords,
    relationRecords,
    snapshotPointers,
    snapshotPublications,
    outboxEvents,
  }
}

async function runWasSmoke() {
  const app = createApp({
    env: {
      WAS_SERVICE_NAME: "jobs-wiki-was-live-smoke",
      WAS_DATA_MODE: "real",
      WAS_LOG_LEVEL: "silent",
      WAS_PORT: "0",
      STRATAWIKI_CLI_WRAPPER: process.env.STRATAWIKI_CLI_WRAPPER,
      STRATAWIKI_READ_DATABASE_URL:
        process.env.STRATAWIKI_READ_DATABASE_URL ?? process.env.DATABASE_URL,
      STRATAWIKI_READ_PSQL_BIN: process.env.STRATAWIKI_READ_PSQL_BIN ?? "psql",
      STRATAWIKI_READ_DOMAIN: process.env.STRATAWIKI_READ_DOMAIN ?? "recruiting",
      STRATAWIKI_READ_SCOPE: process.env.STRATAWIKI_READ_SCOPE ?? "shared",
    },
  })

  const summary = await invokeApp(app, {
    url: "/api/workspace/summary",
  })

  if (summary.status !== 200) {
    throw new Error(`workspace summary smoke failed: ${JSON.stringify(summary.body)}`)
  }

  const opportunityList = await invokeApp(app, {
    url: "/api/opportunities?limit=2",
  })

  if (opportunityList.status !== 200 || !opportunityList.body.items?.length) {
    throw new Error(`opportunity list smoke failed: ${JSON.stringify(opportunityList.body)}`)
  }

  const opportunityId = opportunityList.body.items[0]?.opportunityRef?.opportunityId

  if (!opportunityId) {
    throw new Error(
      `opportunity list smoke returned no opportunityRef id: ${JSON.stringify(
        opportunityList.body,
      )}`,
    )
  }

  const detail = await invokeApp(app, {
    url: `/api/opportunities/${encodeURIComponent(opportunityId)}`,
  })

  if (detail.status !== 200) {
    throw new Error(`opportunity detail smoke failed: ${JSON.stringify(detail.body)}`)
  }

  const genericAsk = await invokeApp(app, {
    method: "POST",
    url: "/api/workspace/ask",
    headers: {
      "content-type": "application/json",
      "x-workspace-id": process.env.VITE_JOBS_WIKI_WORKSPACE_ID ?? "workspace_demo",
      "x-profile-id": process.env.VITE_JOBS_WIKI_PROFILE_ID ?? "profile_demo_backend",
    },
    body: {
      question: "현재 스냅샷 기준으로 먼저 봐야 할 공고와 보완 포인트를 정리해 줘.",
    },
  })

  if (genericAsk.status !== 200) {
    throw new Error(`generic ask smoke failed: ${JSON.stringify(genericAsk.body)}`)
  }

  const scopedAsk = await invokeApp(app, {
    method: "POST",
    url: "/api/workspace/ask",
    headers: {
      "content-type": "application/json",
      "x-workspace-id": process.env.VITE_JOBS_WIKI_WORKSPACE_ID ?? "workspace_demo",
      "x-profile-id": process.env.VITE_JOBS_WIKI_PROFILE_ID ?? "profile_demo_backend",
    },
    body: {
      question: "이 공고에 맞춰 어떤 점을 강조해야 할까?",
      opportunityId,
    },
  })

  if (scopedAsk.status !== 200) {
    throw new Error(`scoped ask smoke failed: ${JSON.stringify(scopedAsk.body)}`)
  }

  const sync = await invokeApp(app, {
    url: "/api/workspace/sync",
  })

  if (sync.status !== 200) {
    throw new Error(`workspace sync smoke failed: ${JSON.stringify(sync.body)}`)
  }

  return {
    summaryVisibility: summary.body.sync?.visibility ?? null,
    opportunityCount: opportunityList.body.items.length,
    opportunityId,
    askEvidenceCount: genericAsk.body.evidence?.length ?? 0,
    askRelatedCount: genericAsk.body.relatedOpportunities?.length ?? 0,
    scopedAskEvidenceCount: scopedAsk.body.evidence?.length ?? 0,
    syncProjections: sync.body.projections?.map((projection) => projection.projection) ?? [],
  }
}

async function main() {
  loadRootEnv()

  const wrapperPath = assertEnv("STRATAWIKI_CLI_WRAPPER")
  const connectionString =
    process.env.STRATAWIKI_READ_DATABASE_URL ??
    process.env.DATABASE_URL ??
    DEFAULT_READ_DATABASE_URL

  await runStep("StrataWiki wrapper tool listing", wrapperPath, ["list-tools"])

  const dryRunResult = await runStep("Jobs-Wiki dry-run ingestion", "npm", [
    "--prefix",
    "apps/ingestion",
    "run",
    "ingest:worknet",
  ])
  const dryRunSummary = parseJsonLinesOutput(dryRunResult.stdout)

  const applyResult = await runStep("Jobs-Wiki apply ingestion", "npm", [
    "--prefix",
    "apps/ingestion",
    "run",
    "ingest:worknet:apply",
  ])
  const applySummary = parseJsonLinesOutput(applyResult.stdout)

  const wasSmoke = await runWasSmoke()
  const databaseSummary = await queryDatabaseSummary(connectionString)

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "ok",
        wrapperPath,
        dryRun: dryRunSummary
          ? {
              status: dryRunSummary.status,
              fetchedSources: dryRunSummary.summary?.fetchedSources,
              validatedBatches: dryRunSummary.summary?.validatedBatches,
            }
          : null,
        apply: applySummary
          ? {
              status: applySummary.status,
              ingestedBatches: applySummary.summary?.ingestedBatches,
              persistedSummaryPath: applySummary.persistedSummaryPath,
            }
          : null,
        wasSmoke,
        databaseSummary,
      },
      null,
      2,
    )}\n`,
  )
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        message: error.message,
      },
      null,
      2,
    ),
  )
  process.exitCode = 1
})
