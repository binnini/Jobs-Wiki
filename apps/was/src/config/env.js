const VALID_DATA_MODES = new Set(["mock", "real"])

try {
  process.loadEnvFile?.()
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error
  }
}

function parsePort(rawPort) {
  const port = Number(rawPort)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid WAS port: ${rawPort}`)
  }

  return port
}

export function loadEnv(overrides = {}) {
  const rawEnv = {
    ...process.env,
    ...overrides,
  }

  const dataMode = rawEnv.WAS_DATA_MODE ?? "mock"

  if (!VALID_DATA_MODES.has(dataMode)) {
    throw new Error(
      `Invalid WAS_DATA_MODE: ${dataMode}. Expected one of ${Array.from(VALID_DATA_MODES).join(", ")}`,
    )
  }

  return {
    serviceName: rawEnv.WAS_SERVICE_NAME ?? "jobs-wiki-was",
    host: rawEnv.WAS_HOST ?? "127.0.0.1",
    port: parsePort(rawEnv.WAS_PORT ?? rawEnv.PORT ?? "4310"),
    nodeEnv: rawEnv.NODE_ENV ?? "development",
    dataMode,
    logLevel: rawEnv.WAS_LOG_LEVEL ?? "info",
  }
}
