const VALID_DATA_MODES = new Set(["mock", "real"])

try {
  process.loadEnvFile?.()
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error
  }
}

function parsePort(rawPort) {
  const port = Number(rawPort)

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid WAS port: ${rawPort}`)
  }

  return port
}

export function loadEnv(overrides = {}) {
  const rawEnv = {
    ...process.env,
    ...overrides,
  }

  const dataMode = rawEnv.WAS_DATA_MODE ?? rawEnv.dataMode ?? "mock"

  if (!VALID_DATA_MODES.has(dataMode)) {
    throw new Error(
      `Invalid WAS_DATA_MODE: ${dataMode}. Expected one of ${Array.from(VALID_DATA_MODES).join(", ")}`,
    )
  }

  return {
    serviceName: rawEnv.WAS_SERVICE_NAME ?? rawEnv.serviceName ?? "jobs-wiki-was",
    host: rawEnv.WAS_HOST ?? rawEnv.host ?? "127.0.0.1",
    port: parsePort(rawEnv.WAS_PORT ?? rawEnv.PORT ?? rawEnv.port ?? "4310"),
    nodeEnv: rawEnv.NODE_ENV ?? rawEnv.nodeEnv ?? "development",
    dataMode,
    logLevel: rawEnv.WAS_LOG_LEVEL ?? rawEnv.logLevel ?? "info",
    readDatabaseUrl:
      rawEnv.STRATAWIKI_READ_DATABASE_URL ??
      rawEnv.readDatabaseUrl ??
      rawEnv.DATABASE_URL ??
      "postgresql://stratawiki:stratawiki@localhost:5432/stratawiki_jobswiki",
    readPsqlBin: rawEnv.STRATAWIKI_READ_PSQL_BIN ?? rawEnv.readPsqlBin ?? "psql",
    readDomain: rawEnv.STRATAWIKI_READ_DOMAIN ?? rawEnv.readDomain ?? "recruiting",
    readScope: rawEnv.STRATAWIKI_READ_SCOPE ?? rawEnv.readScope ?? "shared",
    stratawikiCliWrapper:
      rawEnv.STRATAWIKI_CLI_WRAPPER ??
      rawEnv.stratawikiCliWrapper ??
      "/Users/yebin/workSpace/stratawiki-runtime/bin/stratawiki-jobswiki.sh",
    profileContextCatalogPath:
      rawEnv.JOBS_WIKI_PROFILE_CONTEXT_CATALOG_PATH ??
      rawEnv.profileContextCatalogPath ??
      null,
    personalQueryModelProfile:
      rawEnv.STRATAWIKI_PERSONAL_QUERY_MODEL_PROFILE ??
      rawEnv.personalQueryModelProfile ??
      "balanced_default",
    getProfileContextTool:
      rawEnv.STRATAWIKI_GET_PROFILE_CONTEXT_TOOL ??
      rawEnv.getProfileContextTool ??
      "get_profile_context",
    upsertProfileContextTool:
      rawEnv.STRATAWIKI_UPSERT_PROFILE_CONTEXT_TOOL ??
      rawEnv.upsertProfileContextTool ??
      "upsert_profile_context",
    personalQueryTool:
      rawEnv.STRATAWIKI_PERSONAL_QUERY_TOOL ??
      rawEnv.personalQueryTool ??
      "query_personal_knowledge",
    getPersonalRecordTool:
      rawEnv.STRATAWIKI_GET_PERSONAL_RECORD_TOOL ??
      rawEnv.getPersonalRecordTool ??
      "get_personal_record",
    getInterpretationRecordTool:
      rawEnv.STRATAWIKI_GET_INTERPRETATION_RECORD_TOOL ??
      rawEnv.getInterpretationRecordTool ??
      "get_interpretation_record",
    getFactRecordTool:
      rawEnv.STRATAWIKI_GET_FACT_RECORD_TOOL ??
      rawEnv.getFactRecordTool ??
      "get_fact_record",
    commandSubmitTool:
      rawEnv.STRATAWIKI_COMMAND_SUBMIT_TOOL ??
      rawEnv.commandSubmitTool ??
      "knowledge.command.submit",
    commandStatusTool:
      rawEnv.STRATAWIKI_COMMAND_STATUS_TOOL ??
      rawEnv.commandStatusTool ??
      "knowledge.command.get",
  }
}
