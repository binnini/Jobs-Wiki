import {
  StratawikiHttpError,
  createStratawikiHttpClient,
} from "../../../../../packages/integrations/stratawiki-http/client.js"
import {
  createForbiddenError,
  createNotFoundError,
  createTemporarilyUnavailableError,
  createUnknownFailureError,
  createValidationError,
} from "../../http/errors.js"

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

function ensureHttpMode(env, httpClient) {
  const configuredMode = String(env.stratawikiIntegrationMode ?? "http").trim().toLowerCase()

  if (configuredMode !== "http") {
    throw new Error(
      "Jobs-Wiki personal knowledge flows now require STRATAWIKI_INTEGRATION_MODE=http.",
    )
  }

  if (!httpClient) {
    throw new Error(
      "Jobs-Wiki personal knowledge flows require STRATAWIKI_BASE_URL for HTTP mode.",
    )
  }
}

export function createStratawikiPersonalKnowledgeClient({
  env = {},
  httpClient: providedHttpClient,
} = {}) {
  const httpClient = providedHttpClient ?? createHttpClient(env)
  const domain = env.readDomain ?? "recruiting"

  ensureHttpMode(env, httpClient)

  async function runHttp(httpRun, fallbackLabel) {
    try {
      return await httpRun()
    } catch (error) {
      throw toWasError(error, fallbackLabel)
    }
  }

  return {
    async getProfileContext({ tenantId, userId }) {
      return await runHttp(
        () =>
          httpClient.callTool({
            name: env.getProfileContextTool,
            arguments: {
              domain,
              tenant_id: tenantId,
              user_id: userId,
            },
          }),
        {
          toolName: env.getProfileContextTool,
          path: "/api/v1/tool-calls",
        },
      )
    },

    async upsertProfileContext({ profileContext }) {
      const tenantId = profileContext.tenant_id
      const userId = profileContext.user_id

      return await runHttp(
        () =>
          httpClient.upsertProfileContext({
            tenantId,
            userId,
            profileContext: {
              domain,
              ...profileContext,
            },
          }),
        {
          toolName: "upsert_profile_context",
          path: `/api/v1/profile-contexts/${tenantId}/${userId}`,
        },
      )
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

      return await runHttp(
        () =>
          httpClient.queryPersonalKnowledge({
            payload,
          }),
        {
          toolName: "query_personal_knowledge",
          path: "/api/v1/personal-queries",
        },
      )
    },

    async getPersonalRecord({ tenantId, userId, personalId }) {
      return await runHttp(
        () =>
          httpClient.callTool({
            name: env.getPersonalRecordTool,
            arguments: {
              domain,
              tenant_id: tenantId,
              user_id: userId,
              personal_id: personalId,
            },
          }),
        {
          toolName: env.getPersonalRecordTool,
          path: "/api/v1/tool-calls",
        },
      )
    },

    async listPersonalDocuments({ tenantId, userId, subspace, status, kind }) {
      return await runHttp(
        () =>
          httpClient.listPersonalDocuments({
            domain,
            tenantId,
            userId,
            subspace,
            status,
            kind,
          }),
        {
          toolName: env.listPersonalDocumentsTool,
          path: "/api/v1/personal-documents",
        },
      )
    },

    async getPersonalDocument({ tenantId, userId, documentId }) {
      return await runHttp(
        () =>
          httpClient.getPersonalDocument({
            domain,
            tenantId,
            userId,
            documentId,
          }),
        {
          toolName: env.getPersonalDocumentTool,
          path: `/api/v1/personal-documents/${encodeURIComponent(documentId)}`,
        },
      )
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
      workspacePath,
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
        ...(workspacePath
          ? {
              workspace_path: {
                ...(workspacePath.sectionId ? { section_id: workspacePath.sectionId } : {}),
                segments: workspacePath.segments,
                ...(workspacePath.label ? { label: workspacePath.label } : {}),
              },
            }
          : {}),
      }

      return await runHttp(
        () =>
          httpClient.createPersonalDocument({
            payload,
          }),
        {
          toolName: env.createPersonalDocumentTool,
          path: "/api/v1/personal-documents",
        },
      )
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
      workspacePath,
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
        ...(workspacePath
          ? {
              workspace_path: {
                ...(workspacePath.sectionId ? { section_id: workspacePath.sectionId } : {}),
                segments: workspacePath.segments,
                ...(workspacePath.label ? { label: workspacePath.label } : {}),
              },
            }
          : {}),
      }

      return await runHttp(
        () =>
          httpClient.updatePersonalDocument({
            documentId,
            payload,
          }),
        {
          toolName: env.updatePersonalDocumentTool,
          path: `/api/v1/personal-documents/${encodeURIComponent(documentId)}`,
        },
      )
    },

    async deletePersonalDocument({ tenantId, userId, documentId, ifVersion }) {
      const payload = {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        document_id: documentId,
        if_version: ifVersion,
      }

      return await runHttp(
        () =>
          httpClient.deletePersonalDocument({
            documentId,
            payload,
          }),
        {
          toolName: env.deletePersonalDocumentTool,
          path: `/api/v1/personal-documents/${encodeURIComponent(documentId)}`,
        },
      )
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

      return await runHttp(
        () =>
          httpClient.registerPersonalAsset({
            payload,
          }),
        {
          toolName: env.registerPersonalAssetTool,
          path: "/api/v1/personal-assets",
        },
      )
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

      return await runHttp(
        () =>
          httpClient.summarizePersonalDocumentToWiki({
            payload,
          }),
        {
          toolName: env.summarizePersonalDocumentToWikiTool,
          path: "/api/v1/personal-wiki-generations/summarize",
        },
      )
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

      return await runHttp(
        () =>
          httpClient.rewritePersonalDocumentToWiki({
            payload,
          }),
        {
          toolName: env.rewritePersonalDocumentToWikiTool,
          path: "/api/v1/personal-wiki-generations/rewrite",
        },
      )
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

      return await runHttp(
        () =>
          httpClient.structurePersonalDocumentToWiki({
            payload,
          }),
        {
          toolName: env.structurePersonalDocumentToWikiTool,
          path: "/api/v1/personal-wiki-generations/structure",
        },
      )
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

      return await runHttp(
        () =>
          httpClient.suggestPersonalWikiLinks({
            payload,
          }),
        {
          toolName: env.suggestPersonalWikiLinksTool,
          path: "/api/v1/personal-wiki-links/suggest",
        },
      )
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

      return await runHttp(
        () =>
          httpClient.attachPersonalWikiLinks({
            payload,
          }),
        {
          toolName: env.attachPersonalWikiLinksTool,
          path: "/api/v1/personal-wiki-links/attach",
        },
      )
    },

    async getInterpretationRecord({ interpretationId }) {
      return await runHttp(
        () =>
          httpClient.callTool({
            name: env.getInterpretationRecordTool,
            arguments: {
              domain,
              interpretation_id: interpretationId,
            },
          }),
        {
          toolName: env.getInterpretationRecordTool,
          path: "/api/v1/tool-calls",
        },
      )
    },

    async getFactRecord({ factId }) {
      return await runHttp(
        () =>
          httpClient.callTool({
            name: env.getFactRecordTool,
            arguments: {
              domain,
              fact_id: factId,
            },
          }),
        {
          toolName: env.getFactRecordTool,
          path: "/api/v1/tool-calls",
        },
      )
    },

    async getSnapshotStatus({ family, segment } = {}) {
      return await runHttp(
        () =>
          httpClient.getSnapshotStatus({
            domain,
            family,
            segment,
          }),
        {
          toolName: "get_snapshot_status",
          path: "/api/v1/snapshot-status",
        },
      )
    },

    async getCacheStatus({ tenantId, userId, recordId }) {
      return await runHttp(
        () =>
          httpClient.getCacheStatus({
            domain,
            tenantId,
            userId,
            recordId,
          }),
        {
          toolName: "get_cache_status",
          path: `/api/v1/cache-status/${recordId}`,
        },
      )
    },

    async getExplanation({ layer, recordId, tenantId, userId }) {
      return await runHttp(
        () =>
          httpClient.getExplanation({
            domain,
            layer,
            recordId,
            tenantId,
            userId,
          }),
        {
          toolName: "explain_result",
          path: `/api/v1/explanations/${layer}/${recordId}`,
        },
      )
    },

    async buildInterpretationSnapshot({ payload }) {
      return await runHttp(
        () =>
          httpClient.buildInterpretationSnapshot({
            payload,
          }),
        {
          toolName: "build_interpretation_snapshot",
          path: "/api/v1/interpretation-builds",
        },
      )
    },

    async getJobStatus({ jobId }) {
      return await runHttp(
        () =>
          httpClient.getJobStatus({
            jobId,
          }),
        {
          toolName: "get_job_status",
          path: `/api/v1/jobs/${jobId}`,
        },
      )
    },
  }
}
