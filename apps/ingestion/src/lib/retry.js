function wait(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
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

  throw lastError
}
