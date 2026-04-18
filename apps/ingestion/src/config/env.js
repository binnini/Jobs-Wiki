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

try {
  process.loadEnvFile?.()
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error
  }
}

export function loadEnv(overrides = {}) {
  const rawEnv = {
    ...process.env,
    ...overrides,
  }

  return {
    serviceName: rawEnv.INGEST_SERVICE_NAME ?? "jobs-wiki-ingestion",
    nodeEnv: rawEnv.NODE_ENV ?? "development",
    logLevel: rawEnv.INGEST_LOG_LEVEL ?? "info",
    defaultSource: rawEnv.INGEST_SOURCE ?? "worknet",
    defaultDryRun: parseBoolean(rawEnv.INGEST_DRY_RUN, true),
    worknetSourceId: rawEnv.WORKNET_SOURCE_ID ?? "worknet.recruiting",
    stratawikiBaseUrl: rawEnv.STRATAWIKI_BASE_URL ?? null,
  }
}
