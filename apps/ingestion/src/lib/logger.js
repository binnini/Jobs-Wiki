const LEVEL_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function normalizeLevel(value) {
  const normalized = String(value ?? "info").trim().toLowerCase()
  return LEVEL_PRIORITY[normalized] ? normalized : "info"
}

export function createLogger({
  service = "jobs-wiki-ingestion",
  level = "info",
} = {}) {
  const normalizedLevel = normalizeLevel(level)
  const minimumPriority = LEVEL_PRIORITY[normalizedLevel]

  function write(targetLevel, event, fields = {}) {
    if (LEVEL_PRIORITY[targetLevel] < minimumPriority) {
      return
    }

    const payload = {
      level: targetLevel,
      event,
      service,
      timestamp: new Date().toISOString(),
      ...fields,
    }

    const line = JSON.stringify(payload)

    if (targetLevel === "error") {
      console.error(line)
      return
    }

    if (targetLevel === "warn") {
      console.warn(line)
      return
    }

    console.info(line)
  }

  return {
    debug(event, fields) {
      write("debug", event, fields)
    },
    info(event, fields) {
      write("info", event, fields)
    },
    warn(event, fields) {
      write("warn", event, fields)
    },
    error(event, fields) {
      write("error", event, fields)
    },
  }
}
