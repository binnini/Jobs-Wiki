import { randomUUID } from "node:crypto"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

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

function getEnv(name, fallback = undefined) {
  const value = process.env[name]

  if (typeof value === "string" && value.trim() !== "") {
    return value.trim()
  }

  return fallback
}

function assertEnv(name, fallback = undefined) {
  const value = getEnv(name, fallback)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function summarize(value) {
  return JSON.stringify(value, null, 2)
}

async function requestJson(label, url, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const rawText = await response.text()
  const parsedBody = rawText ? JSON.parse(rawText) : {}

  if (!response.ok) {
    throw new Error(
      `[${label}] ${response.status} ${response.statusText}: ${summarize(parsedBody)}`,
    )
  }

  return parsedBody
}

async function main() {
  loadRootEnv()

  const wasBaseUrl = assertEnv("JOBS_WIKI_WAS_BASE_URL", "http://127.0.0.1:4310")
  const stratawikiBaseUrl = assertEnv("STRATAWIKI_BASE_URL")
  const workspaceId = getEnv("VITE_JOBS_WIKI_WORKSPACE_ID", "workspace_demo")
  const profileId = getEnv("VITE_JOBS_WIKI_PROFILE_ID", "profile_demo_backend")
  const requestHeaders = {
    "content-type": "application/json",
    "x-workspace-id": workspaceId,
    "x-profile-id": profileId,
  }

  const jobsWikiHealth = await requestJson("jobs-wiki health", `${wasBaseUrl}/health`)
  console.info(`[smoke:cross-repo-http] jobs-wiki /health\n${summarize(jobsWikiHealth)}`)

  const stratawikiHealth = await requestJson(
    "stratawiki healthz",
    `${stratawikiBaseUrl}/healthz`,
  )
  console.info(
    `[smoke:cross-repo-http] stratawiki /healthz\n${summarize(stratawikiHealth)}`,
  )

  const createDocument = await requestJson(
    "create personal document",
    `${wasBaseUrl}/api/documents`,
    {
      method: "POST",
      headers: requestHeaders,
      body: {
        layer: "personal_raw",
        title: "cross-repo http smoke",
        bodyMarkdown: "## Smoke\n\nCross-repo HTTP baseline verification.",
        workspacePath: {
          segments: ["smoke", "cross-repo-http"],
        },
      },
    },
  )

  const createdDocumentId = createDocument?.item?.documentRef?.objectId
  const createdVersion = createDocument?.item?.metadata?.version

  if (!createdDocumentId || !createdVersion) {
    throw new Error(
      `create personal document returned an unexpected payload: ${summarize(createDocument)}`,
    )
  }

  console.info(
    `[smoke:cross-repo-http] personal document create\n${summarize({
      documentId: createdDocumentId,
      version: createdVersion,
    })}`,
  )

  const documentDetail = await requestJson(
    "get personal document",
    `${wasBaseUrl}/api/documents/${encodeURIComponent(createdDocumentId)}`,
    {
      headers: requestHeaders,
    },
  )

  if (documentDetail?.item?.documentRef?.objectId !== createdDocumentId) {
    throw new Error(
      `get personal document returned the wrong record: ${summarize(documentDetail)}`,
    )
  }

  console.info(
    `[smoke:cross-repo-http] personal document read\n${summarize({
      documentId: documentDetail.item.documentRef.objectId,
      title: documentDetail.item.surface.title,
      version: documentDetail.item.metadata.version,
    })}`,
  )

  await requestJson(
    "delete personal document",
    `${wasBaseUrl}/api/documents/${encodeURIComponent(createdDocumentId)}`,
    {
      method: "DELETE",
      headers: requestHeaders,
      body: {
        ifVersion: documentDetail.item.metadata.version,
      },
    },
  )

  console.info(
    `[smoke:cross-repo-http] personal document delete\n${summarize({
      documentId: createdDocumentId,
      deletedVersion: documentDetail.item.metadata.version,
    })}`,
  )

  const commandResponse = await requestJson(
    "submit stratawiki command",
    `${stratawikiBaseUrl}/api/v1/commands`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": `cross-repo-http-smoke:${randomUUID()}`,
      },
      body: {
        name: "ingest_domain_proposal_batch",
        arguments: {
          batch: {
            batch_id: `cross-repo-http-smoke-${randomUUID().slice(0, 8)}`,
            domain: "recruiting",
            pack_version: "2026-04-18",
            producer: "jobs-wiki-cross-repo-smoke",
            proposals: [],
          },
        },
      },
    },
  )

  const commandRecord = commandResponse?.result ?? commandResponse
  const commandId = commandRecord?.command_id ?? commandRecord?.commandId
  const commandStatus = commandRecord?.state ?? commandRecord?.status

  if (!commandId || typeof commandStatus !== "string") {
    throw new Error(
      `command submit did not return a valid command envelope: ${summarize(commandResponse)}`,
    )
  }

  console.info(
    `[smoke:cross-repo-http] command submit\n${summarize(commandRecord)}`,
  )

  const workspaceSync = await requestJson(
    "get stratawiki command status",
    `${stratawikiBaseUrl}/api/v1/commands/${encodeURIComponent(commandId)}`,
  )

  const statusRecord = workspaceSync?.result?.command ?? workspaceSync?.command ?? workspaceSync?.result ?? workspaceSync
  const statusCommandId = statusRecord?.command_id ?? statusRecord?.commandId

  if (statusCommandId !== commandId) {
    throw new Error(
      `command status did not echo the submitted command id: ${summarize(workspaceSync)}`,
    )
  }

  console.info(
    `[smoke:cross-repo-http] command status\n${summarize(workspaceSync)}`,
  )

  console.info(
    `[smoke:cross-repo-http] ok\n${summarize({
      jobsWikiHealth: jobsWikiHealth.status,
      stratawikiHealth: stratawikiHealth.status,
      documentId: createdDocumentId,
      commandId,
      commandStatus: statusRecord?.state ?? statusRecord?.status ?? null,
    })}`,
  )
}

main().catch((error) => {
  console.error(`[smoke:cross-repo-http] failed: ${error.message}`)
  process.exitCode = 1
})
