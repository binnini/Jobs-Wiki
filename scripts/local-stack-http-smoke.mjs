import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const JOBS_WIKI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const STRATAWIKI_ROOT = resolve(JOBS_WIKI_ROOT, "..", "stratawiki")
const JOBS_WIKI_ENV_FILE = resolve(JOBS_WIKI_ROOT, ".env")
const STRATAWIKI_ENV_FILE = resolve(STRATAWIKI_ROOT, ".env")

const DEFAULT_WAS_BASE_URL = "http://127.0.0.1:4310"
const DEFAULT_STRATAWIKI_BASE_URL = "http://127.0.0.1:18080"
const DEFAULT_DATABASE_URL =
  "postgresql://stratawiki:stratawiki@localhost:5432/stratawiki_jobswiki"

const WAS_SESSION = "jobswiki-was-main"
const STRATAWIKI_SESSION = "stratawiki-http-main"

function loadEnvFile(pathname) {
  try {
    process.loadEnvFile?.(pathname)
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error
    }
  }
}

function getEnv(name, fallback = undefined) {
  const value = process.env[name]
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim()
  }
  return fallback
}

function summarize(value) {
  return JSON.stringify(value, null, 2)
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  })
  if (result.status !== 0) {
    const stderr = result.stderr?.trim()
    const stdout = result.stdout?.trim()
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${stderr || stdout || "unknown error"}`,
    )
  }
  return result.stdout?.trim() ?? ""
}

function sessionExists(name) {
  const result = spawnSync("tmux", ["has-session", "-t", name], { encoding: "utf8" })
  return result.status === 0
}

function tmuxStartOrRespawn({ session, cwd, command }) {
  if (sessionExists(session)) {
    runCommand("tmux", ["respawn-pane", "-k", "-t", `${session}:0.0`, "/bin/zsh", "-lc", command])
    return "restarted"
  }

  runCommand("tmux", ["new-session", "-d", "-s", session, "-c", cwd, "/bin/zsh", "-lc", command])
  return "started"
}

function tmuxRecentLogs(session, lines = 20) {
  const result = spawnSync("tmux", ["capture-pane", "-pt", session], { encoding: "utf8" })
  if (result.status !== 0) {
    return ""
  }
  return result.stdout
    .trimEnd()
    .split("\n")
    .slice(-lines)
    .join("\n")
}

async function requestJson(url) {
  const response = await fetch(url)
  const text = await response.text()
  let payload = {}
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch (error) {
      throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 400)}`)
    }
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url}: ${summarize(payload)}`)
  }
  return payload
}

async function tryHealth(url) {
  try {
    return await requestJson(url)
  } catch {
    return null
  }
}

async function waitForHealth({ label, url, timeoutMs = 30000, intervalMs = 1000, session }) {
  const startedAt = Date.now()
  let lastError = null
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const payload = await requestJson(url)
      return payload
    } catch (error) {
      lastError = error
      await new Promise((resolveDelay) => setTimeout(resolveDelay, intervalMs))
    }
  }

  const logTail = session ? tmuxRecentLogs(session) : ""
  throw new Error(
    `${label} did not become healthy at ${url} within ${timeoutMs}ms.\nLast error: ${lastError?.message ?? lastError}\n${
      logTail ? `Recent tmux logs (${session}):\n${logTail}` : ""
    }`,
  )
}

function baseUrlToPort(baseUrl) {
  try {
    return new URL(baseUrl).port || (baseUrl.startsWith("https:") ? "443" : "80")
  } catch {
    return "unknown"
  }
}

async function main() {
  loadEnvFile(JOBS_WIKI_ENV_FILE)
  loadEnvFile(STRATAWIKI_ENV_FILE)

  const args = new Set(process.argv.slice(2))
  const runSlowSmoke = args.has("--with-ollama-publish")

  const wasBaseUrl = getEnv("JOBS_WIKI_WAS_BASE_URL", DEFAULT_WAS_BASE_URL)
  const stratawikiBaseUrl = getEnv("STRATAWIKI_BASE_URL", DEFAULT_STRATAWIKI_BASE_URL)
  const databaseUrl = getEnv("DATABASE_URL", DEFAULT_DATABASE_URL)

  console.info(
    `[smoke:stack] configuration\n${summarize({
      jobsWikiRoot: JOBS_WIKI_ROOT,
      jobsWikiEnvFile: JOBS_WIKI_ENV_FILE,
      stratawikiRoot: STRATAWIKI_ROOT,
      stratawikiEnvFile: STRATAWIKI_ENV_FILE,
      wasBaseUrl,
      wasPort: baseUrlToPort(wasBaseUrl),
      stratawikiBaseUrl,
      stratawikiPort: baseUrlToPort(stratawikiBaseUrl),
      databaseUrl,
      runSlowSmoke,
    })}`,
  )

  const existingStratawikiHealth = await tryHealth(`${stratawikiBaseUrl}/healthz`)
  if (existingStratawikiHealth) {
    console.info(`[smoke:stack] stratawiki session ${STRATAWIKI_SESSION}: already healthy`)
  } else {
    const stratawikiStartMode = tmuxStartOrRespawn({
      session: STRATAWIKI_SESSION,
      cwd: STRATAWIKI_ROOT,
      command:
        `DATABASE_URL=${JSON.stringify(databaseUrl)} ` +
        `/Users/yebin/venv/bin/python -m wiki_mcp.cli --env-file .env serve-http --host 127.0.0.1 --port ${baseUrlToPort(stratawikiBaseUrl)}`,
    })
    console.info(`[smoke:stack] stratawiki session ${STRATAWIKI_SESSION}: ${stratawikiStartMode}`)
  }

  const existingWasHealth = await tryHealth(`${wasBaseUrl}/health`)
  if (existingWasHealth) {
    console.info(`[smoke:stack] jobs-wiki session ${WAS_SESSION}: already healthy`)
  } else {
    const wasStartMode = tmuxStartOrRespawn({
      session: WAS_SESSION,
      cwd: JOBS_WIKI_ROOT,
      command: "npm run start:was",
    })
    console.info(`[smoke:stack] jobs-wiki session ${WAS_SESSION}: ${wasStartMode}`)
  }

  const stratawikiHealth = await waitForHealth({
    label: "StrataWiki",
    url: `${stratawikiBaseUrl}/healthz`,
    session: STRATAWIKI_SESSION,
  })
  console.info(`[smoke:stack] stratawiki healthy\n${summarize(stratawikiHealth)}`)

  const wasHealth = await waitForHealth({
    label: "Jobs-Wiki WAS",
    url: `${wasBaseUrl}/health`,
    session: WAS_SESSION,
  })
  console.info(`[smoke:stack] jobs-wiki healthy\n${summarize(wasHealth)}`)

  runCommand("node", [resolve(JOBS_WIKI_ROOT, "scripts/cross-repo-http-smoke.mjs")], {
    cwd: JOBS_WIKI_ROOT,
    stdio: "inherit",
  })

  if (runSlowSmoke) {
    runCommand("/Users/yebin/venv/bin/python", [resolve(STRATAWIKI_ROOT, "scripts/real_ollama_market_trend_publish_smoke.py")], {
      cwd: STRATAWIKI_ROOT,
      stdio: "inherit",
    })
  } else {
    console.info(
      `[smoke:stack] next\nRun the slower real-provider smoke when you want to verify live Ollama publish:\n` +
        `/Users/yebin/venv/bin/python ${resolve(STRATAWIKI_ROOT, "scripts/real_ollama_market_trend_publish_smoke.py")}\n` +
        `or rerun this command with --with-ollama-publish`,
    )
  }
}

main().catch((error) => {
  console.error(`[smoke:stack] failed: ${error.message}`)
  process.exitCode = 1
})
