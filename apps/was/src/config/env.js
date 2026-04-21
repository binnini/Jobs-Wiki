import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const VALID_DATA_MODES = new Set(["mock", "real"])
const VALID_INTEGRATION_MODES = new Set(["auto", "http", "wrapper"])

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

export function resolveEnvCandidatePaths(cwd = process.cwd()) {
  return Array.from(
    new Set([
      resolve(cwd, ".env"),
      resolve(MODULE_DIR, "../../../../.env"),
    ]),
  )
}

export function loadNearestEnvFile({
  cwd = process.cwd(),
  existsSyncImpl = existsSync,
  loadEnvFileImpl = process.loadEnvFile?.bind(process),
} = {}) {
  for (const candidate of resolveEnvCandidatePaths(cwd)) {
    if (!existsSyncImpl(candidate)) {
      continue
    }

    try {
      loadEnvFileImpl?.(candidate)
      return candidate
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error
      }
    }
  }

  return undefined
}

loadNearestEnvFile()

function parsePort(rawPort) {
  const port = Number(rawPort)

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid WAS port: ${rawPort}`)
  }

  return port
}

function parseInteger(rawValue, fallback) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return fallback
  }

  const normalized = Number.parseInt(String(rawValue).trim(), 10)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`Invalid integer value: ${rawValue}`)
  }

  return normalized
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

  const stratawikiIntegrationMode =
    rawEnv.STRATAWIKI_INTEGRATION_MODE ?? rawEnv.stratawikiIntegrationMode ?? "auto"

  if (!VALID_INTEGRATION_MODES.has(stratawikiIntegrationMode)) {
    throw new Error(
      `Invalid STRATAWIKI_INTEGRATION_MODE: ${stratawikiIntegrationMode}. Expected one of ${Array.from(VALID_INTEGRATION_MODES).join(", ")}`,
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
    stratawikiBaseUrl:
      rawEnv.STRATAWIKI_BASE_URL ?? rawEnv.stratawikiBaseUrl ?? null,
    stratawikiApiToken:
      rawEnv.STRATAWIKI_API_TOKEN ?? rawEnv.stratawikiApiToken ?? null,
    stratawikiIntegrationMode,
    stratawikiHttpTimeoutMs: parseInteger(
      rawEnv.STRATAWIKI_HTTP_TIMEOUT_MS ?? rawEnv.stratawikiHttpTimeoutMs,
      10000,
    ),
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
    listPersonalDocumentsTool:
      rawEnv.STRATAWIKI_LIST_PERSONAL_DOCUMENTS_TOOL ??
      rawEnv.listPersonalDocumentsTool ??
      "list_personal_documents",
    getPersonalDocumentTool:
      rawEnv.STRATAWIKI_GET_PERSONAL_DOCUMENT_TOOL ??
      rawEnv.getPersonalDocumentTool ??
      "get_personal_document",
    createPersonalDocumentTool:
      rawEnv.STRATAWIKI_CREATE_PERSONAL_DOCUMENT_TOOL ??
      rawEnv.createPersonalDocumentTool ??
      "create_personal_document",
    updatePersonalDocumentTool:
      rawEnv.STRATAWIKI_UPDATE_PERSONAL_DOCUMENT_TOOL ??
      rawEnv.updatePersonalDocumentTool ??
      "update_personal_document",
    deletePersonalDocumentTool:
      rawEnv.STRATAWIKI_DELETE_PERSONAL_DOCUMENT_TOOL ??
      rawEnv.deletePersonalDocumentTool ??
      "delete_personal_document",
    registerPersonalAssetTool:
      rawEnv.STRATAWIKI_REGISTER_PERSONAL_ASSET_TOOL ??
      rawEnv.registerPersonalAssetTool ??
      "register_personal_asset",
    summarizePersonalDocumentToWikiTool:
      rawEnv.STRATAWIKI_SUMMARIZE_PERSONAL_DOCUMENT_TO_WIKI_TOOL ??
      rawEnv.summarizePersonalDocumentToWikiTool ??
      "summarize_personal_document_to_wiki",
    rewritePersonalDocumentToWikiTool:
      rawEnv.STRATAWIKI_REWRITE_PERSONAL_DOCUMENT_TO_WIKI_TOOL ??
      rawEnv.rewritePersonalDocumentToWikiTool ??
      "rewrite_personal_document_to_wiki",
    structurePersonalDocumentToWikiTool:
      rawEnv.STRATAWIKI_STRUCTURE_PERSONAL_DOCUMENT_TO_WIKI_TOOL ??
      rawEnv.structurePersonalDocumentToWikiTool ??
      "structure_personal_document_to_wiki",
    suggestPersonalWikiLinksTool:
      rawEnv.STRATAWIKI_SUGGEST_PERSONAL_WIKI_LINKS_TOOL ??
      rawEnv.suggestPersonalWikiLinksTool ??
      "suggest_personal_wiki_links",
    attachPersonalWikiLinksTool:
      rawEnv.STRATAWIKI_ATTACH_PERSONAL_WIKI_LINKS_TOOL ??
      rawEnv.attachPersonalWikiLinksTool ??
      "attach_personal_wiki_links",
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
