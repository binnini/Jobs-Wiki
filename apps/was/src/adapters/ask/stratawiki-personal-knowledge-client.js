import { constants } from "node:fs"
import { access, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn } from "node:child_process"
import {
  StratawikiHttpError,
  createStratawikiHttpClient,
  shouldUseStratawikiWrapperFallback,
} from "../../../../../packages/integrations/stratawiki-http/client.js"
import {
  createForbiddenError,
  createNotFoundError,
  createTemporarilyUnavailableError,
  createUnknownFailureError,
  createValidationError,
} from "../../http/errors.js"

async function assertExecutable(pathText) {
  try {
    await access(pathText, constants.X_OK)
  } catch {
    throw createTemporarilyUnavailableError(
      "The StrataWiki personal knowledge wrapper is not executable.",
      {
        adapter: "stratawiki_personal_knowledge",
        wrapperPath: pathText,
      },
    )
  }
}

async function spawnAndCapture(command, args) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
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

function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw createUnknownFailureError(
      `${label} returned non-JSON output.`,
      {
        adapter: "stratawiki_personal_knowledge",
      },
      error,
    )
  }
}

function normalizeToolFailure({ toolName, rawFailure }) {
  const message = rawFailure?.message ?? rawFailure?.error ?? `${toolName} failed.`
  const details = {
    adapter: "stratawiki_personal_knowledge",
    toolName,
  }

  if (
    message.includes("No profile context found") ||
    message.includes("Unknown personal record") ||
    message.includes("Unknown interpretation record") ||
    message.includes("Unknown fact record")
  ) {
    return createNotFoundError(message, details)
  }

  if (message.includes("profile_version does not match")) {
    return createValidationError(message, details)
  }

  return createTemporarilyUnavailableError(message, details)
}

function toWasError(error, { toolName, path }) {
  if (!(error instanceof StratawikiHttpError)) {
    return error
  }

  const details = {
    adapter: "stratawiki_personal_knowledge",
    toolName,
    path,
    requestId: error.requestId,
    upstreamCode: error.code,
  }

  if (error.status === 404 || error.code === "not_found") {
    return createNotFoundError(error.message, details)
  }

  if (error.status === 422 || error.code === "validation_error") {
    return createValidationError(error.message, details)
  }

  if (error.status === 401 || error.status === 403 || error.code === "unauthorized") {
    return createForbiddenError(error.message, details)
  }

  if (error.retryable) {
    return createTemporarilyUnavailableError(error.message, details)
  }

  return createUnknownFailureError(error.message, details, error)
}

function resolvePrimaryMode(env) {
  const configuredMode = String(env.stratawikiIntegrationMode ?? "auto").trim().toLowerCase()

  if (configuredMode === "http" || configuredMode === "wrapper") {
    return configuredMode
  }

  return env.stratawikiBaseUrl ? "http" : "wrapper"
}

function canUseWrapperFallback(env) {
  return (
    String(env.stratawikiIntegrationMode ?? "auto").trim().toLowerCase() === "auto" &&
    Boolean(env.stratawikiCliWrapper)
  )
}

function createHttpClient(env) {
  if (!env.stratawikiBaseUrl) {
    return null
  }

  return createStratawikiHttpClient({
    baseUrl: env.stratawikiBaseUrl,
    apiToken: env.stratawikiApiToken,
    timeoutMs: env.stratawikiHttpTimeoutMs,
  })
}

async function callWrapperTool(wrapperPath, toolName, payload) {
  if (!wrapperPath) {
    throw createTemporarilyUnavailableError(
      "STRATAWIKI_CLI_WRAPPER is required for wrapper fallback.",
      {
        adapter: "stratawiki_personal_knowledge",
      },
    )
  }

  await assertExecutable(wrapperPath)

  const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-personal-knowledge-"))
  const argsFilePath = join(tempDir, `${toolName}.json`)

  try {
    await writeFile(argsFilePath, JSON.stringify(payload, null, 2), "utf8")

    const result = await spawnAndCapture(wrapperPath, [
      "call",
      toolName,
      "--args-file",
      argsFilePath,
      "--envelope",
    ])

    if (result.code !== 0) {
      throw createTemporarilyUnavailableError(
        "The StrataWiki personal knowledge wrapper call failed.",
        {
          adapter: "stratawiki_personal_knowledge",
          toolName,
          stderr: result.stderr || result.stdout || undefined,
        },
      )
    }

    const envelope = parseJson(
      result.stdout,
      `StrataWiki personal knowledge tool ${toolName}`,
    )

    if (!envelope?.ok) {
      throw normalizeToolFailure({
        toolName,
        rawFailure: envelope,
      })
    }

    return envelope.result
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw createTemporarilyUnavailableError(
        "The StrataWiki personal knowledge wrapper could not be started.",
        {
          adapter: "stratawiki_personal_knowledge",
          wrapperPath,
        },
      )
    }

    throw error
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function withFallback({
  env,
  primaryMode,
  httpRun,
  wrapperRun,
  fallbackLabel,
}) {
  if (primaryMode === "wrapper") {
    return await wrapperRun()
  }

  try {
    return await httpRun()
  } catch (error) {
    if (!canUseWrapperFallback(env) || !shouldUseStratawikiWrapperFallback(error)) {
      throw toWasError(error, fallbackLabel)
    }

    return await wrapperRun()
  }
}

export function createStratawikiPersonalKnowledgeClient({
  env = {},
  httpClient: providedHttpClient,
} = {}) {
  const wrapperPath = env.stratawikiCliWrapper
  const httpClient = providedHttpClient ?? createHttpClient(env)
  const domain = env.readDomain ?? "recruiting"
  const primaryMode = resolvePrimaryMode(env)

  if (primaryMode === "http" && !httpClient) {
    throw new Error(
      "HTTP mode requires STRATAWIKI_BASE_URL. Set STRATAWIKI_BASE_URL or switch STRATAWIKI_INTEGRATION_MODE=wrapper.",
    )
  }

  return {
    async getProfileContext({ tenantId, userId }) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.getProfileContextTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.getProfileContextTool,
            arguments: {
              domain,
              tenant_id: tenantId,
              user_id: userId,
            },
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.getProfileContextTool, {
            domain,
            tenant_id: tenantId,
            user_id: userId,
          })
        },
      })
    },

    async upsertProfileContext({ profileContext }) {
      const tenantId = profileContext.tenant_id
      const userId = profileContext.user_id

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: "upsert_profile_context",
          path: `/api/v1/profile-contexts/${tenantId}/${userId}`,
        },
        httpRun() {
          return httpClient.upsertProfileContext({
            tenantId,
            userId,
            profileContext: {
              domain,
              ...profileContext,
            },
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.upsertProfileContextTool, {
            profile_context: {
              domain,
              ...profileContext,
            },
          })
        },
      })
    },

    async queryPersonalKnowledge({
      tenantId,
      userId,
      question,
      profileVersion,
      factSnapshot,
      save = false,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        question,
        profile_version: profileVersion,
        ...(factSnapshot ? { fact_snapshot: factSnapshot } : {}),
        model_profile: env.personalQueryModelProfile,
        save: Boolean(save),
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: "query_personal_knowledge",
          path: "/api/v1/personal-queries",
        },
        httpRun() {
          return httpClient.queryPersonalKnowledge({
            payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.personalQueryTool, payload)
        },
      })
    },

    async getPersonalRecord({ tenantId, userId, personalId }) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.getPersonalRecordTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.getPersonalRecordTool,
            arguments: {
              domain,
              tenant_id: tenantId,
              user_id: userId,
              personal_id: personalId,
            },
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.getPersonalRecordTool, {
            domain,
            tenant_id: tenantId,
            user_id: userId,
            personal_id: personalId,
          })
        },
      })
    },

    async listPersonalDocuments({ tenantId, userId, subspace, status, kind }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        ...(subspace ? { subspace } : {}),
        ...(status ? { status } : {}),
        ...(kind ? { kind } : {}),
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.listPersonalDocumentsTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.listPersonalDocumentsTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.listPersonalDocumentsTool, payload)
        },
      })
    },

    async getPersonalDocument({ tenantId, userId, documentId }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        document_id: documentId,
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.getPersonalDocumentTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.getPersonalDocumentTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.getPersonalDocumentTool, payload)
        },
      })
    },

    async createPersonalDocument({
      tenantId,
      userId,
      profileVersion,
      subspace,
      kind,
      title,
      bodyMarkdown,
      assetRefs,
      anchors,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        profile_version: profileVersion,
        subspace,
        kind,
        title,
        ...(bodyMarkdown !== undefined ? { body_markdown: bodyMarkdown } : {}),
        ...(assetRefs !== undefined ? { asset_refs: assetRefs } : {}),
        ...(anchors !== undefined ? { anchors } : {}),
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.createPersonalDocumentTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.createPersonalDocumentTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.createPersonalDocumentTool, payload)
        },
      })
    },

    async updatePersonalDocument({
      tenantId,
      userId,
      documentId,
      profileVersion,
      ifVersion,
      title,
      bodyMarkdown,
      assetRefs,
      anchors,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        document_id: documentId,
        profile_version: profileVersion,
        if_version: ifVersion,
        ...(title !== undefined ? { title } : {}),
        ...(bodyMarkdown !== undefined ? { body_markdown: bodyMarkdown } : {}),
        ...(assetRefs !== undefined ? { asset_refs: assetRefs } : {}),
        ...(anchors !== undefined ? { anchors } : {}),
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.updatePersonalDocumentTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.updatePersonalDocumentTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.updatePersonalDocumentTool, payload)
        },
      })
    },

    async deletePersonalDocument({ tenantId, userId, documentId, ifVersion }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        document_id: documentId,
        if_version: ifVersion,
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.deletePersonalDocumentTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.deletePersonalDocumentTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.deletePersonalDocumentTool, payload)
        },
      })
    },

    async registerPersonalAsset({
      tenantId,
      userId,
      assetKind,
      mediaType,
      filename,
      storageRef,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        asset_kind: assetKind,
        media_type: mediaType,
        filename,
        storage_ref: storageRef,
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.registerPersonalAssetTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.registerPersonalAssetTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.registerPersonalAssetTool, payload)
        },
      })
    },

    async summarizePersonalDocumentToWiki({
      tenantId,
      userId,
      sourceDocumentRef,
      profileVersion,
      modelProfile,
      summaryStyle,
      saveTarget,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        source_document_ref: sourceDocumentRef,
        profile_version: profileVersion,
        model_profile: modelProfile,
        save_target: saveTarget,
        ...(summaryStyle ? { summary_style: summaryStyle } : {}),
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.summarizePersonalDocumentToWikiTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.summarizePersonalDocumentToWikiTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.summarizePersonalDocumentToWikiTool, payload)
        },
      })
    },

    async rewritePersonalDocumentToWiki({
      tenantId,
      userId,
      sourceDocumentRef,
      profileVersion,
      modelProfile,
      rewriteGoal,
      saveTarget,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        source_document_ref: sourceDocumentRef,
        profile_version: profileVersion,
        model_profile: modelProfile,
        save_target: saveTarget,
        ...(rewriteGoal ? { rewrite_goal: rewriteGoal } : {}),
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.rewritePersonalDocumentToWikiTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.rewritePersonalDocumentToWikiTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.rewritePersonalDocumentToWikiTool, payload)
        },
      })
    },

    async structurePersonalDocumentToWiki({
      tenantId,
      userId,
      sourceDocumentRef,
      profileVersion,
      modelProfile,
      structureTemplate,
      saveTarget,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        source_document_ref: sourceDocumentRef,
        profile_version: profileVersion,
        model_profile: modelProfile,
        save_target: saveTarget,
        ...(structureTemplate ? { structure_template: structureTemplate } : {}),
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.structurePersonalDocumentToWikiTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.structurePersonalDocumentToWikiTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.structurePersonalDocumentToWikiTool, payload)
        },
      })
    },

    async suggestPersonalWikiLinks({
      tenantId,
      userId,
      wikiDocumentId,
      wikiDocumentVersion,
      profileVersion,
      modelProfile,
      maxSuggestions,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        wiki_document_id: wikiDocumentId,
        wiki_document_version: wikiDocumentVersion,
        profile_version: profileVersion,
        model_profile: modelProfile,
        ...(maxSuggestions ? { max_suggestions: maxSuggestions } : {}),
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.suggestPersonalWikiLinksTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.suggestPersonalWikiLinksTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.suggestPersonalWikiLinksTool, payload)
        },
      })
    },

    async attachPersonalWikiLinks({
      tenantId,
      userId,
      wikiDocumentId,
      wikiDocumentVersion,
      attachments,
    }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        wiki_document_id: wikiDocumentId,
        wiki_document_version: wikiDocumentVersion,
        attachments,
      }

      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.attachPersonalWikiLinksTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.attachPersonalWikiLinksTool,
            arguments: payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.attachPersonalWikiLinksTool, payload)
        },
      })
    },

    async getInterpretationRecord({ interpretationId }) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.getInterpretationRecordTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.getInterpretationRecordTool,
            arguments: {
              domain,
              interpretation_id: interpretationId,
            },
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.getInterpretationRecordTool, {
            domain,
            interpretation_id: interpretationId,
          })
        },
      })
    },

    async getFactRecord({ factId }) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: env.getFactRecordTool,
          path: "/api/v1/tool-calls",
        },
        httpRun() {
          return httpClient.callTool({
            name: env.getFactRecordTool,
            arguments: {
              domain,
              fact_id: factId,
            },
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, env.getFactRecordTool, {
            domain,
            fact_id: factId,
          })
        },
      })
    },

    async getSnapshotStatus({ family, segment } = {}) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: "get_snapshot_status",
          path: "/api/v1/snapshot-status",
        },
        httpRun() {
          return httpClient.getSnapshotStatus({
            domain,
            family,
            segment,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, "get_snapshot_status", {
            domain,
            ...(family && segment
              ? {
                  partition: {
                    family,
                    segment,
                  },
                }
              : {}),
          })
        },
      })
    },

    async getCacheStatus({ tenantId, userId, recordId }) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: "get_cache_status",
          path: `/api/v1/cache-status/${recordId}`,
        },
        httpRun() {
          return httpClient.getCacheStatus({
            domain,
            tenantId,
            userId,
            recordId,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, "get_cache_status", {
            domain,
            tenant_id: tenantId,
            user_id: userId,
            record_id: recordId,
          })
        },
      })
    },

    async getExplanation({ layer, recordId, tenantId, userId }) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: "explain_result",
          path: `/api/v1/explanations/${layer}/${recordId}`,
        },
        httpRun() {
          return httpClient.getExplanation({
            domain,
            layer,
            recordId,
            tenantId,
            userId,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, "explain_result", {
            domain,
            layer,
            result_id: recordId,
            tenant_id: tenantId,
            user_id: userId,
          })
        },
      })
    },

    async buildInterpretationSnapshot({ payload }) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: "build_interpretation_snapshot",
          path: "/api/v1/interpretation-builds",
        },
        httpRun() {
          return httpClient.buildInterpretationSnapshot({
            payload,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, "build_interpretation_snapshot", payload)
        },
      })
    },

    async getJobStatus({ jobId }) {
      return await withFallback({
        env,
        primaryMode,
        fallbackLabel: {
          toolName: "get_job_status",
          path: `/api/v1/jobs/${jobId}`,
        },
        httpRun() {
          return httpClient.getJobStatus({
            jobId,
          })
        },
        wrapperRun() {
          return callWrapperTool(wrapperPath, "get_job_status", {
            job_id: jobId,
          })
        },
      })
    },
  }
}
