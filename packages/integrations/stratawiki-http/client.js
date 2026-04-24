import { randomUUID } from "node:crypto"

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl || typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new Error("STRATAWIKI_BASE_URL is required for HTTP mode.")
  }

  return baseUrl.trim().replace(/\/+$/, "")
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function normalizeScopedPayload(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload
  }

  const normalized = { ...payload }

  if (normalized.tenant_id === undefined && payload.tenantId !== undefined) {
    normalized.tenant_id = payload.tenantId
  }

  if (normalized.user_id === undefined && payload.userId !== undefined) {
    normalized.user_id = payload.userId
  }

  if (normalized.profile_version === undefined && payload.profileVersion !== undefined) {
    normalized.profile_version = payload.profileVersion
  }

  if (normalized.if_version === undefined && payload.ifVersion !== undefined) {
    normalized.if_version = payload.ifVersion
  }

  delete normalized.tenantId
  delete normalized.userId
  delete normalized.profileVersion
  delete normalized.ifVersion

  return normalized
}

function normalizeWorkspacePathPayload(workspacePath) {
  if (!workspacePath || typeof workspacePath !== "object" || Array.isArray(workspacePath)) {
    return workspacePath
  }

  return compactObject({
    section_id: workspacePath.section_id ?? workspacePath.sectionId,
    segments: workspacePath.segments,
    label: workspacePath.label,
  })
}

function normalizeDocumentRefPayload(documentRef) {
  if (!documentRef || typeof documentRef !== "object" || Array.isArray(documentRef)) {
    return documentRef
  }

  const normalized = { ...documentRef }

  if (normalized.document_id === undefined && documentRef.documentId !== undefined) {
    normalized.document_id = documentRef.documentId
  }

  if (normalized.asset_refs === undefined && documentRef.assetRefs !== undefined) {
    normalized.asset_refs = documentRef.assetRefs
  }

  delete normalized.documentId
  delete normalized.assetRefs

  return normalized
}

function normalizePersonalDocumentPayload(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload
  }

  const normalized = normalizeScopedPayload(payload)

  if (normalized.body_markdown === undefined && payload.bodyMarkdown !== undefined) {
    normalized.body_markdown = payload.bodyMarkdown
  }

  if (normalized.asset_refs === undefined && payload.assetRefs !== undefined) {
    normalized.asset_refs = payload.assetRefs
  }

  if (normalized.workspace_path === undefined && payload.workspacePath !== undefined) {
    normalized.workspace_path = normalizeWorkspacePathPayload(payload.workspacePath)
  }

  if (normalized.source_document_ref === undefined && payload.sourceDocumentRef !== undefined) {
    normalized.source_document_ref = normalizeDocumentRefPayload(payload.sourceDocumentRef)
  }

  if (normalized.save_target === undefined && payload.saveTarget !== undefined) {
    normalized.save_target = normalizeDocumentRefPayload(payload.saveTarget)
  }

  if (normalized.wiki_document_id === undefined && payload.wikiDocumentId !== undefined) {
    normalized.wiki_document_id = payload.wikiDocumentId
  }

  if (
    normalized.wiki_document_version === undefined &&
    payload.wikiDocumentVersion !== undefined
  ) {
    normalized.wiki_document_version = payload.wikiDocumentVersion
  }

  if (normalized.model_profile === undefined && payload.modelProfile !== undefined) {
    normalized.model_profile = payload.modelProfile
  }

  if (normalized.summary_style === undefined && payload.summaryStyle !== undefined) {
    normalized.summary_style = payload.summaryStyle
  }

  if (normalized.rewrite_goal === undefined && payload.rewriteGoal !== undefined) {
    normalized.rewrite_goal = payload.rewriteGoal
  }

  if (
    normalized.structure_template === undefined &&
    payload.structureTemplate !== undefined
  ) {
    normalized.structure_template = payload.structureTemplate
  }

  if (normalized.max_suggestions === undefined && payload.maxSuggestions !== undefined) {
    normalized.max_suggestions = payload.maxSuggestions
  }

  delete normalized.bodyMarkdown
  delete normalized.assetRefs
  delete normalized.workspacePath
  delete normalized.sourceDocumentRef
  delete normalized.saveTarget
  delete normalized.wikiDocumentId
  delete normalized.wikiDocumentVersion
  delete normalized.modelProfile
  delete normalized.summaryStyle
  delete normalized.rewriteGoal
  delete normalized.structureTemplate
  delete normalized.maxSuggestions

  return normalized
}

function normalizePersonalAssetPayload(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload
  }

  const normalized = normalizeScopedPayload(payload)

  if (normalized.asset_kind === undefined && payload.assetKind !== undefined) {
    normalized.asset_kind = payload.assetKind
  }

  if (normalized.media_type === undefined && payload.mediaType !== undefined) {
    normalized.media_type = payload.mediaType
  }

  if (normalized.storage_ref === undefined && payload.storageRef !== undefined) {
    normalized.storage_ref = payload.storageRef
  }

  delete normalized.assetKind
  delete normalized.mediaType
  delete normalized.storageRef

  return normalized
}

function normalizeInterpretationBuildPayload(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload
  }

  const normalized = { ...payload }
  const partition =
    normalized.partition && typeof normalized.partition === "object" && !Array.isArray(normalized.partition)
      ? normalized.partition
      : undefined
  const subject =
    normalized.subject && typeof normalized.subject === "object" && !Array.isArray(normalized.subject)
      ? normalized.subject
      : normalized.subjectRef && typeof normalized.subjectRef === "object" && !Array.isArray(normalized.subjectRef)
        ? normalized.subjectRef
        : undefined
  const selection =
    normalized.selection && typeof normalized.selection === "object" && !Array.isArray(normalized.selection)
      ? normalized.selection
      : undefined

  const family =
    selection?.family ??
    partition?.family ??
    (typeof normalized.family === "string" ? normalized.family : undefined)
  const kind =
    selection?.kind ??
    partition?.kind ??
    subject?.kind ??
    (typeof normalized.kind === "string" ? normalized.kind : undefined)
  const subjectId =
    selection?.subject_id ??
    subject?.id ??
    subject?.subject_id ??
    partition?.subject_id ??
    partition?.segment
  const subjectType =
    selection?.subject_type ??
    subject?.type ??
    partition?.subject_type ??
    (partition ? "market_segment" : undefined)
  const subjectLabel =
    selection?.subject_label ??
    subject?.label ??
    partition?.subject_label

  if (
    normalized.selection === undefined &&
    typeof subjectId === "string" &&
    subjectId.trim() !== ""
  ) {
    normalized.selection = compactObject({
      family,
      kind,
      subject_type:
        typeof subjectType === "string" && subjectType.trim() !== ""
          ? subjectType.trim()
          : undefined,
      subject_id: subjectId.trim(),
      subject_label:
        typeof subjectLabel === "string" && subjectLabel.trim() !== ""
          ? subjectLabel.trim()
          : undefined,
    })
  }

  if (normalized.subject === undefined && normalized.selection) {
    normalized.subject = compactObject({
      type: normalized.selection.subject_type,
      id: normalized.selection.subject_id,
      label: normalized.selection.subject_label,
    })
  }

  if (normalized.partition === undefined && normalized.selection?.family) {
    normalized.partition = compactObject({
      family: normalized.selection.family,
      segment: normalized.selection.subject_id,
    })
  }

  delete normalized.subjectRef

  return normalized
}

function looksLikePersonalDocumentRecord(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value.document_id !== undefined ||
        value.documentId !== undefined ||
        value.subspace !== undefined ||
        value.body_markdown !== undefined ||
        value.bodyMarkdown !== undefined),
  )
}

function normalizePersonalDocumentRecord(record) {
  if (!looksLikePersonalDocumentRecord(record)) {
    return record
  }

  const normalized = { ...record }

  if (normalized.document_id === undefined && record.documentId !== undefined) {
    normalized.document_id = record.documentId
  }

  if (normalized.body_markdown === undefined && record.bodyMarkdown !== undefined) {
    normalized.body_markdown = record.bodyMarkdown
  }

  if (normalized.asset_refs === undefined && record.assetRefs !== undefined) {
    normalized.asset_refs = record.assetRefs
  }

  if (normalized.based_on === undefined && record.basedOn !== undefined) {
    normalized.based_on = record.basedOn
  }

  if (normalized.source_document_ref === undefined && record.sourceDocumentRef !== undefined) {
    normalized.source_document_ref = normalizeDocumentRefPayload(record.sourceDocumentRef)
  }

  if (normalized.workspace_path === undefined && record.workspacePath !== undefined) {
    normalized.workspace_path = normalizeWorkspacePathPayload(record.workspacePath)
  }

  delete normalized.documentId
  delete normalized.bodyMarkdown
  delete normalized.assetRefs
  delete normalized.basedOn
  delete normalized.sourceDocumentRef
  delete normalized.workspacePath

  return normalized
}

function normalizePersonalDocumentResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return result
  }

  if (looksLikePersonalDocumentRecord(result)) {
    return normalizePersonalDocumentRecord(result)
  }

  const normalized = { ...result }

  if (Array.isArray(result.documents) && !Array.isArray(result.items)) {
    normalized.items = result.documents.map(normalizePersonalDocumentRecord)
  } else if (Array.isArray(result.items)) {
    normalized.items = result.items.map(normalizePersonalDocumentRecord)
  }

  if (looksLikePersonalDocumentRecord(result.document)) {
    normalized.document = normalizePersonalDocumentRecord(result.document)
  } else if (looksLikePersonalDocumentRecord(result.record) && normalized.document === undefined) {
    normalized.document = normalizePersonalDocumentRecord(result.record)
  }

  if (result.sourceDocumentRef !== undefined && normalized.source_document_ref === undefined) {
    normalized.source_document_ref = normalizeDocumentRefPayload(result.sourceDocumentRef)
  }

  return normalized
}

function normalizeExplanationLayer(layer) {
  return layer === "personal_raw" || layer === "personal_wiki" ? "personal" : layer
}

function formatOpportunityCursor(offset) {
  return `cursor_${String(offset).padStart(3, "0")}`
}

function buildQueryString(query = {}) {
  const params = new URLSearchParams()

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue
    }

    params.set(key, String(rawValue))
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

function requiredPayloadString(payload, key) {
  const value = payload?.[key]

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Payload field ${key} is required for the StrataWiki HTTP path.`)
  }

  return value.trim()
}

function buildUserScopedPath({ tenantId, userId, resourcePath }) {
  return `/api/v1/users/${encodeURIComponent(tenantId)}/${encodeURIComponent(userId)}/${resourcePath}`
}

export class StratawikiHttpError extends Error {
  constructor({
    message,
    status,
    code = "temporarily_unavailable",
    requestId,
    details,
    retryable,
    cause,
  }) {
    super(message, cause ? { cause } : undefined)
    this.name = "StratawikiHttpError"
    this.status = status
    this.code = code
    this.requestId = requestId
    this.details = details
    this.retryable =
      retryable ?? (status >= 500 || status === 408 || status === 429 || status === 0)
  }
}

function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new StratawikiHttpError({
      status: 502,
      code: "invalid_response",
      message: `${label} returned non-JSON output.`,
      retryable: false,
      cause: error,
    })
  }
}

function createRequestHeaders({
  apiToken,
  requestId,
  idempotencyKey,
  extraHeaders,
  unauthenticated = false,
}) {
  const headers = new Headers(extraHeaders ?? {})

  headers.set("accept", "application/json")
  headers.set("x-request-id", requestId)

  if (idempotencyKey) {
    headers.set("idempotency-key", idempotencyKey)
  }

  if (!unauthenticated && apiToken) {
    headers.set("authorization", `Bearer ${apiToken}`)
  }

  return headers
}

function normalizeHttpFailure(error, { requestId, path, timeoutMs }) {
  if (error instanceof StratawikiHttpError) {
    return error
  }

  if (error?.name === "AbortError") {
    return new StratawikiHttpError({
      status: 503,
      code: "temporarily_unavailable",
      requestId,
      message: `StrataWiki HTTP request timed out after ${timeoutMs}ms.`,
      details: { path },
      retryable: true,
      cause: error,
    })
  }

  return new StratawikiHttpError({
    status: 503,
    code: "temporarily_unavailable",
    requestId,
    message: "StrataWiki HTTP request could not be completed.",
    details: {
      path,
      cause: error?.message,
    },
    retryable: true,
    cause: error,
  })
}

export function shouldUseStratawikiWrapperFallback(error) {
  return (
    error instanceof StratawikiHttpError &&
    (error.status >= 500 || error.status === 408 || error.status === 429)
  )
}

export function createStratawikiHttpClient({
  baseUrl,
  apiToken = null,
  timeoutMs = 10_000,
  fetchImpl = globalThis.fetch,
  requestIdFactory = randomUUID,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required for StrataWiki HTTP mode.")
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

  async function request({
    method,
    path,
    json,
    query,
    unauthenticated = false,
    idempotencyKey,
    headers,
    requestId = requestIdFactory(),
  }) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    const finalPath = `${path}${buildQueryString(query)}`
    const url = `${normalizedBaseUrl}${finalPath}`

    try {
      const requestHeaders = createRequestHeaders({
        apiToken,
        requestId,
        idempotencyKey,
        extraHeaders: headers,
        unauthenticated,
      })

      if (json !== undefined) {
        requestHeaders.set("content-type", "application/json")
      }

      const response = await fetchImpl(url, {
        method,
        headers: requestHeaders,
        body: json === undefined ? undefined : JSON.stringify(json),
        signal: controller.signal,
      })
      const rawText = await response.text()
      const envelope = rawText ? parseJson(rawText, `StrataWiki HTTP ${method} ${path}`) : {}
      const resolvedRequestId =
        envelope?.request_id ??
        response.headers.get("x-request-id") ??
        requestId

      if (!response.ok || envelope?.ok === false) {
        const errorPayload = envelope?.error ?? {}
        throw new StratawikiHttpError({
          status: response.status,
          code: errorPayload.code ?? "temporarily_unavailable",
          requestId: resolvedRequestId,
          message:
            errorPayload.message ??
            `StrataWiki HTTP ${method} ${path} failed with status ${response.status}.`,
          details: errorPayload.details,
          retryable: response.status >= 500 || response.status === 429,
        })
      }

      return {
        status: response.status,
        requestId: resolvedRequestId,
        result: envelope?.result,
      }
    } catch (error) {
      throw normalizeHttpFailure(error, {
        requestId,
        path: finalPath,
        timeoutMs,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    baseUrl: normalizedBaseUrl,
    timeoutMs,
    async healthz() {
      return await request({
        method: "GET",
        path: "/healthz",
        unauthenticated: true,
      })
    },
    async readyz() {
      return await request({
        method: "GET",
        path: "/readyz",
        unauthenticated: true,
      })
    },
    async listTools({ group, schemas = false, requestId } = {}) {
      const response = await request({
        method: "GET",
        path: "/api/v1/tools",
        query: {
          group,
          schemas: schemas ? "true" : undefined,
        },
        requestId,
      })
      return response.result
    },
    async showTool({ name, requestId }) {
      const response = await request({
        method: "GET",
        path: `/api/v1/tools/${encodeURIComponent(name)}`,
        requestId,
      })
      return response.result
    },
    async getWorkspaceSummary({
      domain,
      scope = "shared",
      profileId,
      requestId,
    } = {}) {
      const response = await request({
        method: "GET",
        path: "/api/v1/workspace-summary",
        query: {
          domain,
          scope,
          profileId,
        },
        requestId,
      })
      return response.result
    },
    async listOpportunities({
      domain,
      scope = "shared",
      query = {},
      requestId,
    } = {}) {
      const cursor =
        query?.cursor ??
        (query?.cursorOffset !== undefined
          ? formatOpportunityCursor(query.cursorOffset)
          : undefined)
      const response = await request({
        method: "GET",
        path: "/api/v1/opportunities",
        query: {
          domain,
          scope,
          limit: query?.limit,
          cursor,
          status: query?.status,
          closingWithinDays: query?.closingWithinDays,
        },
        requestId,
      })
      return response.result
    },
    async getOpportunity({
      domain,
      scope = "shared",
      opportunityId,
      requestId,
    } = {}) {
      const response = await request({
        method: "GET",
        path: `/api/v1/opportunities/${encodeURIComponent(opportunityId)}`,
        query: {
          domain,
          scope,
        },
        requestId,
      })
      return response.result
    },
    async getCalendar({
      domain,
      scope = "shared",
      query = {},
      requestId,
    } = {}) {
      const response = await request({
        method: "GET",
        path: "/api/v1/calendar",
        query: {
          domain,
          scope,
          from: query?.from,
          to: query?.to,
        },
        requestId,
      })
      return response.result
    },
    async callTool({ name, arguments: toolArguments, requestId, idempotencyKey }) {
      const response = await request({
        method: "POST",
        path: "/api/v1/tool-calls",
        json: {
          name,
          arguments: toolArguments ?? {},
        },
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async listPersonalDocuments({
      domain,
      tenantId,
      userId,
      subspace,
      status,
      kind,
      requestId,
    }) {
      const response = await request({
        method: "GET",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: "personal-documents",
        }),
        query: {
          domain,
          subspace,
          status,
          kind,
        },
        requestId,
      })
      return normalizePersonalDocumentResult(response.result)
    },
    async getPersonalDocument({ domain, tenantId, userId, documentId, requestId }) {
      const response = await request({
        method: "GET",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}`,
        }),
        query: {
          domain,
        },
        requestId,
      })
      return normalizePersonalDocumentResult(response.result)
    },
    async createPersonalDocument({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalDocumentPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: "personal-documents",
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return normalizePersonalDocumentResult(response.result)
    },
    async updatePersonalDocument({
      documentId,
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalDocumentPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const response = await request({
        method: "PATCH",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}`,
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return normalizePersonalDocumentResult(response.result)
    },
    async deletePersonalDocument({
      documentId,
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalDocumentPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const response = await request({
        method: "DELETE",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}`,
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return normalizePersonalDocumentResult(response.result)
    },
    async registerPersonalAsset({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalAssetPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: "personal-assets",
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async summarizePersonalDocumentToWiki({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalDocumentPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const documentId = requiredPayloadString(
        normalizedPayload?.source_document_ref,
        "document_id",
      )
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/summarize-wiki`,
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return normalizePersonalDocumentResult(response.result)
    },
    async rewritePersonalDocumentToWiki({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalDocumentPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const documentId = requiredPayloadString(
        normalizedPayload?.source_document_ref,
        "document_id",
      )
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/rewrite-wiki`,
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return normalizePersonalDocumentResult(response.result)
    },
    async structurePersonalDocumentToWiki({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalDocumentPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const documentId = requiredPayloadString(
        normalizedPayload?.source_document_ref,
        "document_id",
      )
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/structure-wiki`,
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return normalizePersonalDocumentResult(response.result)
    },
    async suggestPersonalWikiLinks({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalDocumentPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const documentId = requiredPayloadString(normalizedPayload, "wiki_document_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/suggest-links`,
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async attachPersonalWikiLinks({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizePersonalDocumentPayload(payload)
      const tenantId = requiredPayloadString(normalizedPayload, "tenant_id")
      const userId = requiredPayloadString(normalizedPayload, "user_id")
      const documentId = requiredPayloadString(normalizedPayload, "wiki_document_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/attach-links`,
        }),
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async validateDomainProposalBatch({ batch, requestId, idempotencyKey }) {
      const response = await request({
        method: "POST",
        path: "/api/v1/domain-proposals/validate",
        json: { batch },
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async ingestDomainProposalBatch({ batch, requestId, idempotencyKey }) {
      const response = await request({
        method: "POST",
        path: "/api/v1/domain-proposals/ingest",
        json: { batch },
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async upsertProfileContext({
      tenantId,
      userId,
      profileContext,
      requestId,
      idempotencyKey,
    }) {
      const body = {
        ...profileContext,
      }
      delete body.tenant_id
      delete body.user_id

      const response = await request({
        method: "PUT",
        path: `/api/v1/profile-contexts/${encodeURIComponent(tenantId)}/${encodeURIComponent(userId)}`,
        json: body,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async queryPersonalKnowledge({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const response = await request({
        method: "POST",
        path: "/api/v1/personal-queries",
        json: payload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async buildInterpretationSnapshot({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const normalizedPayload = normalizeInterpretationBuildPayload(payload)
      const response = await request({
        method: "POST",
        path: "/api/v1/interpretation-builds",
        json: normalizedPayload,
        requestId,
        idempotencyKey,
      })
      return compactObject({
        ...response.result,
        httpStatus: response.status,
      })
    },
    async getJobStatus({ jobId, requestId }) {
      const response = await request({
        method: "GET",
        path: `/api/v1/jobs/${encodeURIComponent(jobId)}`,
        requestId,
      })
      return response.result
    },
    async submitCommand({ requestId, name, arguments: commandArguments, command, idempotencyKey } = {}) {
      const response = await request({
        method: "POST",
        path: "/api/v1/commands",
        json: compactObject({
          name: name ?? command?.name,
          arguments: commandArguments ?? command?.payload ?? command?.arguments,
        }),
        requestId,
        idempotencyKey: idempotencyKey ?? requestId,
      })
      return response.result
    },
    async getCommandStatus({ commandId, requestId } = {}) {
      const response = await request({
        method: "GET",
        path: `/api/v1/commands/${encodeURIComponent(commandId)}`,
        requestId,
      })
      return response.result
    },
    async getSnapshotStatus({ domain, family, segment, requestId }) {
      const response = await request({
        method: "GET",
        path: "/api/v1/snapshot-status",
        query: {
          domain,
          family,
          segment,
        },
        requestId,
      })
      return response.result
    },
    async getCacheStatus({ domain, tenantId, userId, recordId, requestId }) {
      const response = await request({
        method: "GET",
        path: `/api/v1/cache-status/${encodeURIComponent(recordId)}`,
        query: {
          domain,
          tenant_id: tenantId,
          user_id: userId,
        },
        requestId,
      })
      return response.result
    },
    async getExplanation({ domain, layer, recordId, tenantId, userId, requestId }) {
      const response = await request({
        method: "GET",
        path: `/api/v1/explanations/${encodeURIComponent(normalizeExplanationLayer(layer))}/${encodeURIComponent(recordId)}`,
        query: {
          domain,
          tenant_id: tenantId,
          user_id: userId,
        },
        requestId,
      })
      return response.result
    },
  }
}
