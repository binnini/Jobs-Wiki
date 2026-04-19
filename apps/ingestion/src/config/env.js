import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback
  }

  if (typeof value === "boolean") {
    return value
  }

  const normalized = String(value).trim().toLowerCase()

  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true
  }

  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false
  }

  throw new Error(`Invalid boolean value: ${value}`)
}

function parseInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback
  }

  const normalized = Number.parseInt(String(value).trim(), 10)
  if (Number.isNaN(normalized) || normalized <= 0) {
    throw new Error(`Invalid integer value: ${value}`)
  }

  return normalized
}

function parseIntegrationMode(value, fallback = "auto") {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback
  }

  const normalized = String(value).trim().toLowerCase()

  if (!["auto", "http", "wrapper"].includes(normalized)) {
    throw new Error(
      `Invalid STRATAWIKI_INTEGRATION_MODE: ${value}. Expected auto, http, or wrapper.`,
    )
  }

  return normalized
}

const WORKNET_ENV_ALIASES = {
  employment: ["EMPLOYMENT_INFO", "WORKNET_EMPLOYMENT_AUTH_KEY"],
  nationalTraining: [
    "NATIONAL_TRAINING",
    "WORKNET_NATIONAL_TRAINING_AUTH_KEY",
  ],
  businessTraining: [
    "BUSINESS_TRAINING",
    "WORKNET_BUSINESS_TRAINING_AUTH_KEY",
  ],
  consortiumTraining: [
    "NATIONAL_HUMAN_RESOURCES",
    "WORKNET_CONSORTIUM_TRAINING_AUTH_KEY",
  ],
  jobPrograms: [
    "JOB_SEEKER_EMPLOYMENT",
    "WORKNET_JOB_PROGRAMS_AUTH_KEY",
  ],
  smallGiant: ["SMALL_GIANT_COMPANY", "WORKNET_SMALL_GIANT_AUTH_KEY"],
  department: ["DEPARTMENT_INFO", "WORKNET_DEPARTMENT_AUTH_KEY"],
  jobInfo: ["JOB_INFORMATION", "WORKNET_JOB_INFO_AUTH_KEY"],
  jobDescription: ["JOB_DESCRIPTIONS", "WORKNET_JOB_DESCRIPTION_AUTH_KEY"],
  workStudy: [
    "WORK_WITH_STUDY_TRAINING",
    "WORKNET_WORK_STUDY_AUTH_KEY",
  ],
}

function firstDefinedValue(rawEnv, keys) {
  for (const key of keys) {
    const value = rawEnv[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim()
    }
  }

  return undefined
}

function loadWorknetKeys(rawEnv) {
  return Object.fromEntries(
    Object.entries(WORKNET_ENV_ALIASES).map(([category, aliases]) => [
      category,
      firstDefinedValue(rawEnv, aliases),
    ]),
  )
}

function summarizeKeyPresence(keys) {
  return Object.fromEntries(
    Object.entries(keys).map(([category, value]) => [category, Boolean(value)]),
  )
}

function parsePathList(value) {
  if (!value || String(value).trim() === "") {
    return []
  }

  return String(value)
    .split(":")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function parseActiveDomainPacks(value) {
  if (!value || String(value).trim() === "") {
    return {}
  }

  return Object.fromEntries(
    String(value)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [domain, version] = entry.split("=", 2)
        return [domain?.trim(), version?.trim()]
      })
      .filter(([domain, version]) => domain && version),
  )
}

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const ENV_CANDIDATE_PATHS = Array.from(
  new Set([
    resolve(process.cwd(), ".env"),
    resolve(MODULE_DIR, "../../../../.env"),
  ]),
)

function loadNearestEnvFile() {
  for (const candidate of ENV_CANDIDATE_PATHS) {
    if (!existsSync(candidate)) {
      continue
    }

    try {
      process.loadEnvFile?.(candidate)
      return candidate
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error
      }
    }
  }
}

loadNearestEnvFile()

export function loadEnv(overrides = {}) {
  const rawEnv = {
    ...process.env,
    ...overrides,
  }
  const worknetKeys = loadWorknetKeys(rawEnv)
  const stratawikiCliWrapper = rawEnv.STRATAWIKI_CLI_WRAPPER ?? null
  const stratawikiIntegrationMode = parseIntegrationMode(
    rawEnv.STRATAWIKI_INTEGRATION_MODE,
  )
  const stratawikiDomainPackPathsRaw =
    rawEnv.JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS ?? ""
  const stratawikiActiveDomainPacksRaw =
    rawEnv.JOBS_WIKI_STRATAWIKI_ACTIVE_DOMAIN_PACKS ?? ""
  const stratawikiActiveDomainPacks = parseActiveDomainPacks(
    stratawikiActiveDomainPacksRaw,
  )

  return {
    serviceName: rawEnv.INGEST_SERVICE_NAME ?? "jobs-wiki-ingestion",
    nodeEnv: rawEnv.NODE_ENV ?? "development",
    logLevel: rawEnv.INGEST_LOG_LEVEL ?? "info",
    defaultSource: rawEnv.INGEST_SOURCE ?? "worknet",
    defaultDryRun: parseBoolean(rawEnv.INGEST_DRY_RUN, true),
    ingestRunSummaryDir: rawEnv.INGEST_RUN_SUMMARY_DIR ?? null,
    ingestMaxAttempts: parseInteger(rawEnv.INGEST_MAX_ATTEMPTS, 3),
    ingestRetryDelayMs: parseInteger(rawEnv.INGEST_RETRY_DELAY_MS, 1000),
    ingestScheduleIntervalMs: parseInteger(
      rawEnv.INGEST_SCHEDULE_INTERVAL_MS,
      300000,
    ),
    ingestScheduleCycles: parseInteger(rawEnv.INGEST_SCHEDULE_CYCLES, 1),
    worknetSourceId: rawEnv.WORKNET_SOURCE_ID ?? "worknet.recruiting",
    worknetFetchPage: parseInteger(rawEnv.WORKNET_FETCH_PAGE, 1),
    worknetFetchSize: parseInteger(rawEnv.WORKNET_FETCH_SIZE, 5),
    worknetBackfillStartPage: parseInteger(rawEnv.WORKNET_BACKFILL_START_PAGE, 1),
    worknetBackfillPages: parseInteger(rawEnv.WORKNET_BACKFILL_PAGES, 3),
    worknetKeys,
    worknetKeyPresence: summarizeKeyPresence(worknetKeys),
    worknetConfigured: Object.values(worknetKeys).some(Boolean),
    stratawikiCliWrapper,
    stratawikiIntegrationMode,
    stratawikiApiToken: rawEnv.STRATAWIKI_API_TOKEN ?? null,
    stratawikiHttpTimeoutMs: parseInteger(rawEnv.STRATAWIKI_HTTP_TIMEOUT_MS, 10000),
    stratawikiDomainPackPathsRaw,
    stratawikiDomainPackPaths: parsePathList(stratawikiDomainPackPathsRaw),
    stratawikiActiveDomainPacksRaw,
    stratawikiActiveDomainPacks,
    stratawikiRecruitingPackVersion:
      stratawikiActiveDomainPacks.recruiting ?? null,
    stratawikiConfigured: Boolean(
      rawEnv.STRATAWIKI_BASE_URL ||
        (stratawikiCliWrapper && parsePathList(stratawikiDomainPackPathsRaw).length > 0),
    ),
    stratawikiBaseUrl: rawEnv.STRATAWIKI_BASE_URL ?? null,
  }
}
