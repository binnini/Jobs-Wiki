import { normalizeError } from "./errors.js"
import { sendError } from "./response.js"

function defaultLogger(payload) {
  const printer = payload.level === "error" ? console.error : console.warn
  printer(JSON.stringify(payload))
}

export function handleError({
  req,
  res,
  error,
  requestId,
  routeName,
  startedAt,
  logger = defaultLogger,
}) {
  const normalizedError = normalizeError(error)

  logger({
    level: normalizedError.status >= 500 ? "error" : "warn",
    event: "was.request.failed",
    requestId,
    method: req.method,
    path: req.url,
    routeName,
    status: normalizedError.status,
    errorCode: normalizedError.code,
    retryable: normalizedError.retryable,
    latencyMs: Date.now() - startedAt,
  })

  sendError(res, normalizedError, { requestId })
}
