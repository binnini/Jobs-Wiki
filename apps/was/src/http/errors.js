const ERROR_STATUS = {
  validation_failed: 400,
  conflict: 409,
  not_found: 404,
  forbidden: 403,
  temporarily_unavailable: 503,
  unknown_failure: 500,
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

export class WasError extends Error {
  constructor({
    code,
    message,
    status,
    retryable = false,
    details,
    cause,
  }) {
    super(message, cause ? { cause } : undefined)
    this.name = "WasError"
    this.code = code
    this.status = status ?? ERROR_STATUS[code] ?? 500
    this.retryable = retryable
    this.details = details
  }
}

export function createValidationError(message, details) {
  return new WasError({
    code: "validation_failed",
    message,
    details,
  })
}

export function createConflictError(message, details) {
  return new WasError({
    code: "conflict",
    message,
    details,
  })
}

export function createNotFoundError(message, details) {
  return new WasError({
    code: "not_found",
    message,
    details,
  })
}

export function createForbiddenError(message, details) {
  return new WasError({
    code: "forbidden",
    message,
    details,
  })
}

export function createTemporarilyUnavailableError(
  message,
  details,
  { retryable = true } = {},
) {
  return new WasError({
    code: "temporarily_unavailable",
    message,
    retryable,
    details,
  })
}

export function createUnknownFailureError(message, details, cause) {
  return new WasError({
    code: "unknown_failure",
    message,
    retryable: false,
    details,
    cause,
  })
}

export function normalizeError(error) {
  if (error instanceof WasError) {
    return compactObject({
      status: error.status,
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
    })
  }

  if (error?.name === "AbortError") {
    return {
      status: ERROR_STATUS.temporarily_unavailable,
      code: "temporarily_unavailable",
      message: "The upstream request timed out.",
      retryable: true,
    }
  }

  return {
    status: ERROR_STATUS.unknown_failure,
    code: "unknown_failure",
    message: "An unexpected error occurred.",
    retryable: false,
  }
}
