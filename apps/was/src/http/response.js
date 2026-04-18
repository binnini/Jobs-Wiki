function writeJson(res, statusCode, body) {
  if (res.headersSent) {
    return
  }

  res.statusCode = statusCode
  res.setHeader("content-type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
}

export function sendJson(res, statusCode, body) {
  writeJson(res, statusCode, body)
}

export function sendError(res, error, { requestId } = {}) {
  writeJson(res, error.status, {
    error: Object.fromEntries(
      Object.entries({
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        details: error.details,
      }).filter(([, value]) => value !== undefined),
    ),
    requestId,
  })
}
