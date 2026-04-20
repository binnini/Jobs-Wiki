class WasClientError extends Error {
  constructor({
    message,
    status = 500,
    code = "unknown_failure",
    retryable = false,
    details,
  }) {
    super(message)
    this.name = "WasClientError"
    this.status = status
    this.code = code
    this.retryable = retryable
    this.details = details
  }
}

function joinUrl(baseUrl, path) {
  const normalizedBaseUrl = (baseUrl ?? "").replace(/\/$/, "")

  if (!normalizedBaseUrl) {
    return path
  }

  return `${normalizedBaseUrl}${path}`
}

async function readJson(response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (!contentType.includes("application/json")) {
    return null
  }

  return response.json()
}

function buildDemoUserContextHeaders(headers = {}) {
  const workspaceId =
    import.meta.env.VITE_JOBS_WIKI_WORKSPACE_ID ??
    import.meta.env.VITE_WORKSPACE_ID ??
    "workspace_demo"
  const profileId =
    import.meta.env.VITE_JOBS_WIKI_PROFILE_ID ??
    import.meta.env.VITE_PROFILE_ID ??
    "profile_demo_backend"

  return {
    ...headers,
    ...(workspaceId ? { "x-workspace-id": workspaceId } : {}),
    ...(profileId ? { "x-profile-id": profileId } : {}),
  }
}

async function request(path, { method = "GET", body, headers } = {}) {
  const response = await fetch(
    joinUrl(import.meta.env.VITE_WAS_BASE_URL, path),
    {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  )

  const payload = await readJson(response)

  if (!response.ok) {
    const error = payload?.error

    throw new WasClientError({
      status: response.status,
      code: error?.code,
      message: error?.message ?? "WAS request failed.",
      retryable: error?.retryable ?? false,
      details: error?.details,
    })
  }

  return payload
}

export function getWorkspaceSummary() {
  return request("/api/workspace/summary")
}

export function getWorkspace() {
  return request("/api/workspace")
}

export function getWorkspaceSync({ commandId } = {}) {
  const searchParams = new URLSearchParams()

  if (commandId) {
    searchParams.set("commandId", commandId)
  }

  const search = searchParams.toString()
  return request(`/api/workspace/sync${search ? `?${search}` : ""}`)
}

export function askWorkspace({
  question,
  opportunityId,
  save,
  userContextHeaders,
} = {}) {
  return request("/api/workspace/ask", {
    method: "POST",
    headers: buildDemoUserContextHeaders(userContextHeaders),
    body: {
      question,
      ...(opportunityId ? { opportunityId } : {}),
      ...(save !== undefined ? { save } : {}),
    },
  })
}

export function getOpportunityDetail(opportunityId) {
  return request(`/api/opportunities/${encodeURIComponent(opportunityId)}`)
}

export function getCalendar(query = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value)
    }
  })

  const search = searchParams.toString()

  return request(`/api/calendar${search ? `?${search}` : ""}`)
}

export function triggerWorknetIngestion(sourceId = "worknet.recruiting") {
  return request(`/api/admin/ingestions/worknet/${encodeURIComponent(sourceId)}`, {
    method: "POST",
  })
}

export { WasClientError }
