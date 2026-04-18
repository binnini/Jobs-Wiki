import { constants } from "node:fs"
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { spawn } from "node:child_process"

const FIXED_STRATAWIKI_CLI_WRAPPER =
  "/Users/yebin/workSpace/stratawiki-runtime/bin/stratawiki-jobswiki.sh"
const STRATAWIKI_DEV_CHECKOUT = "/Users/yebin/workSpace/stratawiki"

function formatErrorDetails(details) {
  return details.filter(Boolean).join(" ")
}

async function assertPathExists(pathText, label) {
  try {
    await access(pathText, constants.F_OK)
  } catch (error) {
    throw new Error(`${label} does not exist: ${pathText}`)
  }
}

async function assertExecutable(pathText, label) {
  try {
    await access(pathText, constants.X_OK)
  } catch (error) {
    throw new Error(`${label} is not executable: ${pathText}`)
  }
}

function normalizeCallArguments(toolName, args) {
  if (toolName === "query_personal_knowledge" && args?.save === undefined) {
    return {
      ...args,
      save: false,
    }
  }

  return args
}

function parseJsonOutput(rawText, contextLabel) {
  try {
    return JSON.parse(rawText)
  } catch (error) {
    throw new Error(
      `${contextLabel} returned non-JSON output: ${rawText.slice(0, 200)}`,
    )
  }
}

async function spawnAndCapture(command, args, env) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })

    child.on("error", (error) => {
      rejectPromise(error)
    })

    child.on("close", (code) => {
      resolvePromise({
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      })
    })
  })
}

export async function validateStratawikiRuntime(
  env,
  { expectedWrapperPath = FIXED_STRATAWIKI_CLI_WRAPPER } = {},
) {
  const wrapperPath = env.stratawikiCliWrapper
  const resolvedExpectedWrapperPath = resolve(expectedWrapperPath)

  if (!wrapperPath) {
    throw new Error(
      "Missing required env: STRATAWIKI_CLI_WRAPPER. Jobs-Wiki must invoke StrataWiki through the fixed runtime wrapper.",
    )
  }

  const resolvedWrapperPath = resolve(wrapperPath)

  if (resolvedWrapperPath !== resolvedExpectedWrapperPath) {
    throw new Error(
      `Invalid STRATAWIKI_CLI_WRAPPER: ${resolvedWrapperPath}. Jobs-Wiki must call the fixed runtime wrapper at ${resolvedExpectedWrapperPath}.`,
    )
  }

  if (resolvedWrapperPath.startsWith(STRATAWIKI_DEV_CHECKOUT)) {
    throw new Error(
      `Invalid STRATAWIKI_CLI_WRAPPER: ${resolvedWrapperPath}. Jobs-Wiki must not call the development checkout under ${STRATAWIKI_DEV_CHECKOUT}.`,
    )
  }

  await assertPathExists(resolvedWrapperPath, "STRATAWIKI_CLI_WRAPPER")
  await assertExecutable(resolvedWrapperPath, "STRATAWIKI_CLI_WRAPPER")

  if (!env.stratawikiDomainPackPathsRaw?.trim()) {
    throw new Error(
      "Missing required env: JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS. DomainProposalBatch validation and ingest require at least one active Domain Pack artifact path.",
    )
  }

  if (env.stratawikiDomainPackPaths.length === 0) {
    throw new Error(
      "JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS is set but no valid artifact paths were parsed.",
    )
  }

  for (const artifactPath of env.stratawikiDomainPackPaths) {
    const resolvedArtifactPath = resolve(artifactPath)
    await assertPathExists(
      resolvedArtifactPath,
      "JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS entry",
    )
  }
}

export function createStratawikiCliClient(
  env,
  { expectedWrapperPath = FIXED_STRATAWIKI_CLI_WRAPPER } = {},
) {
  const wrapperPath = env.stratawikiCliWrapper

  async function execute(args) {
    await validateStratawikiRuntime(env, { expectedWrapperPath })

    return await spawnAndCapture(wrapperPath, args, {
      ...process.env,
      STRATAWIKI_CLI_WRAPPER: wrapperPath,
      JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS:
        env.stratawikiDomainPackPathsRaw ?? "",
      JOBS_WIKI_STRATAWIKI_ACTIVE_DOMAIN_PACKS:
        env.stratawikiActiveDomainPacksRaw ?? "",
    })
  }

  return {
    wrapperPath,
    configured: Boolean(env.stratawikiConfigured),
    assertWriteRuntimeConfig() {
      return validateStratawikiRuntime(env, { expectedWrapperPath })
    },
    async listTools() {
      const result = await execute(["list-tools"])

      if (result.code !== 0) {
        throw new Error(
          `StrataWiki list-tools failed. ${formatErrorDetails([
            result.stderr,
            result.stdout,
          ])}`,
        )
      }

      return parseJsonOutput(result.stdout, "StrataWiki list-tools")
    },
    async callTool(
      toolName,
      args = {},
      { transport = "file", envelope = false } = {},
    ) {
      const normalizedArgs = normalizeCallArguments(toolName, args)
      const cliArgs = ["call", toolName]
      let tempDir

      try {
        if (transport === "inline") {
          cliArgs.push("--args", JSON.stringify(normalizedArgs))
        } else {
          tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-stratawiki-"))
          const argsFilePath = join(
            tempDir,
            `${toolName}-${randomUUID()}.json`,
          )
          await writeFile(
            argsFilePath,
            JSON.stringify(normalizedArgs, null, 2),
            "utf-8",
          )
          cliArgs.push("--args-file", argsFilePath)
        }

        if (envelope) {
          cliArgs.push("--envelope")
        }

        const result = await execute(cliArgs)

        if (result.code !== 0) {
          throw new Error(
            `StrataWiki tool ${toolName} failed. ${formatErrorDetails([
              result.stderr,
              result.stdout,
            ])}`,
          )
        }

        return parseJsonOutput(
          result.stdout,
          `StrataWiki tool ${toolName}`,
        )
      } finally {
        if (tempDir) {
          await rm(tempDir, { recursive: true, force: true })
        }
      }
    },
    async captureArgsPayload(toolName, args = {}) {
      const normalizedArgs = normalizeCallArguments(toolName, args)
      const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-stratawiki-"))
      const argsFilePath = join(tempDir, `${toolName}-${randomUUID()}.json`)
      await writeFile(argsFilePath, JSON.stringify(normalizedArgs, null, 2), "utf-8")
      const rawPayload = await readFile(argsFilePath, "utf-8")
      await rm(tempDir, { recursive: true, force: true })
      return rawPayload
    },
  }
}
