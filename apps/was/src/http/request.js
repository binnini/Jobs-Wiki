import { createValidationError } from "./errors.js"

const MAX_BODY_BYTES = 64 * 1024

export function createRequestContext(req, { requestId }) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1")
  let bodyPromise

  return {
    req,
    requestId,
    method: (req.method ?? "GET").toUpperCase(),
    pathname: url.pathname,
    searchParams: url.searchParams,
    headers: req.headers,
    async readJsonBody() {
      if (!bodyPromise) {
        bodyPromise = readJsonBody(req)
      }

      return bodyPromise
    },
  }
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0

  for await (const chunk of req) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)

    size += bufferChunk.length

    if (size > MAX_BODY_BYTES) {
      throw createValidationError("Request body exceeds the 64KB limit.")
    }

    chunks.push(bufferChunk)
  }

  if (size === 0) {
    return {}
  }

  const rawBody = Buffer.concat(chunks).toString("utf8")

  try {
    return JSON.parse(rawBody)
  } catch {
    throw createValidationError("Request body must be valid JSON.")
  }
}
