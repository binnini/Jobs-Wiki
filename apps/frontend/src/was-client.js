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

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(
    joinUrl(import.meta.env.VITE_WAS_BASE_URL, path),
    {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
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

export function askWorkspace({ question, opportunityId, save } = {}) {
  return request("/api/workspace/ask", {
    method: "POST",
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

export { WasClientError }
