import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const DEFAULT_CATALOG_PATH = resolve(
  MODULE_DIR,
  "../../fixtures/profile-context-catalog.json",
)

function createDefaultCatalog() {
  return {
    defaultProfileId: null,
    profiles: {},
  }
}

function normalizeCatalog(rawCatalog) {
  if (!rawCatalog || typeof rawCatalog !== "object") {
    return createDefaultCatalog()
  }

  return {
    defaultProfileId:
      typeof rawCatalog.defaultProfileId === "string"
        ? rawCatalog.defaultProfileId
        : null,
    profiles:
      rawCatalog.profiles && typeof rawCatalog.profiles === "object"
        ? rawCatalog.profiles
        : {},
  }
}

export function loadProfileContextCatalog(catalogPath = DEFAULT_CATALOG_PATH) {
  const resolvedPath = catalogPath ?? DEFAULT_CATALOG_PATH

  if (!resolvedPath || !existsSync(resolvedPath)) {
    return createDefaultCatalog()
  }

  const rawText = readFileSync(resolvedPath, "utf8")
  return normalizeCatalog(JSON.parse(rawText))
}

export function resolveProfileContextEntry({ catalog, userContext, domain }) {
  const profiles = catalog?.profiles ?? {}
  const requestedProfileId =
    typeof userContext?.profileId === "string" && userContext.profileId.trim()
      ? userContext.profileId.trim()
      : null
  const profileId = requestedProfileId ?? catalog?.defaultProfileId ?? null

  if (!profileId || !profiles[profileId]) {
    return null
  }

  const entry = profiles[profileId]
  const workspaceId =
    typeof userContext?.workspaceId === "string" && userContext.workspaceId.trim()
      ? userContext.workspaceId.trim()
      : entry.workspaceId ?? "workspace_demo"
  const userId = entry.userId ?? profileId
  const profileVersion = entry.profileVersion ?? "profile:v1"

  return {
    profileId,
    displayName: entry.displayName ?? profileId,
    domain,
    tenantId: workspaceId,
    userId,
    profileVersion,
    goals: Array.isArray(entry.goals) ? entry.goals : [],
    preferences:
      entry.preferences && typeof entry.preferences === "object"
        ? {
            ...entry.preferences,
            workspaceId,
          }
        : {
            workspaceId,
          },
    attributes:
      entry.attributes && typeof entry.attributes === "object"
        ? {
            ...entry.attributes,
            displayName: entry.displayName ?? profileId,
            profileId,
          }
        : {
            displayName: entry.displayName ?? profileId,
            profileId,
          },
  }
}
