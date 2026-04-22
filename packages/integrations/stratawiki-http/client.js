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
      return response.result
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
      return response.result
    },
    async createPersonalDocument({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: "personal-documents",
        }),
        json: payload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async updatePersonalDocument({
      documentId,
      payload,
      requestId,
      idempotencyKey,
    }) {
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const response = await request({
        method: "PATCH",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}`,
        }),
        json: payload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async deletePersonalDocument({
      documentId,
      payload,
      requestId,
      idempotencyKey,
    }) {
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const response = await request({
        method: "DELETE",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}`,
        }),
        json: payload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async registerPersonalAsset({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: "personal-assets",
        }),
        json: payload,
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
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const documentId = requiredPayloadString(payload?.source_document_ref, "document_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/summarize-wiki`,
        }),
        json: payload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async rewritePersonalDocumentToWiki({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const documentId = requiredPayloadString(payload?.source_document_ref, "document_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/rewrite-wiki`,
        }),
        json: payload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async structurePersonalDocumentToWiki({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const documentId = requiredPayloadString(payload?.source_document_ref, "document_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/structure-wiki`,
        }),
        json: payload,
        requestId,
        idempotencyKey,
      })
      return response.result
    },
    async suggestPersonalWikiLinks({
      payload,
      requestId,
      idempotencyKey,
    }) {
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const documentId = requiredPayloadString(payload, "wiki_document_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/suggest-links`,
        }),
        json: payload,
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
      const tenantId = requiredPayloadString(payload, "tenant_id")
      const userId = requiredPayloadString(payload, "user_id")
      const documentId = requiredPayloadString(payload, "wiki_document_id")
      const response = await request({
        method: "POST",
        path: buildUserScopedPath({
          tenantId,
          userId,
          resourcePath: `personal-documents/${encodeURIComponent(documentId)}/attach-links`,
        }),
        json: payload,
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
      const response = await request({
        method: "POST",
        path: "/api/v1/interpretation-builds",
        json: payload,
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
        path: `/api/v1/explanations/${encodeURIComponent(layer)}/${encodeURIComponent(recordId)}`,
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
