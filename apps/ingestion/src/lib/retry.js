function wait(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

export class RetryExhaustedError extends Error {
  constructor({
    message,
    attempts,
    maxAttempts,
    delayMs,
    lastError,
  }) {
    super(message, lastError ? { cause: lastError } : undefined)
    this.name = "RetryExhaustedError"
    this.code = lastError?.code ?? "retry_exhausted"
    this.retryable = false
    this.status = lastError?.status ?? null
    this.transport = lastError?.transport ?? null
    this.operation = lastError?.operation ?? null
    this.retry = {
      attempts,
      maxAttempts,
      delayMs,
    }
    this.fetchSummary = lastError?.fetchSummary
    this.sourceReports = lastError?.sourceReports
  }
}

export async function runWithRetry(task, {
  maxAttempts = 1,
  delayMs = 0,
  onRetry,
} = {}) {
  let attempt = 0
  let lastError

  while (attempt < maxAttempts) {
    attempt += 1

    try {
      const result = await task({
        attempt,
      })

      return {
        attempt,
        result,
      }
    } catch (error) {
      lastError = error

      if (attempt >= maxAttempts) {
        break
      }

      await onRetry?.({
        attempt,
        nextAttempt: attempt + 1,
        error,
        delayMs,
      })

      if (delayMs > 0) {
        await wait(delayMs)
      }
    }
  }

  throw new RetryExhaustedError({
    message:
      lastError?.message ??
      `Task failed after ${attempt} attempts.`,
    attempts: attempt,
    maxAttempts,
    delayMs,
    lastError,
  })
}
