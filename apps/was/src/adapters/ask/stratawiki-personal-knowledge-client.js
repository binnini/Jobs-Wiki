import { constants } from "node:fs"
import { access, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn } from "node:child_process"
import {
  createNotFoundError,
  createTemporarilyUnavailableError,
  createUnknownFailureError,
  createValidationError,
} from "../../http/errors.js"

async function assertExecutable(pathText) {
  try {
    await access(pathText, constants.X_OK)
  } catch {
    throw createTemporarilyUnavailableError(
      "The StrataWiki personal knowledge wrapper is not executable.",
      {
        adapter: "stratawiki_personal_knowledge",
        wrapperPath: pathText,
      },
    )
  }
}

async function spawnAndCapture(command, args) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    })

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })

    child.on("error", rejectPromise)
    child.on("close", (code) => {
      resolvePromise({
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      })
    })
  })
}

function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw createUnknownFailureError(
      `${label} returned non-JSON output.`,
      {
        adapter: "stratawiki_personal_knowledge",
      },
      error,
    )
  }
}

function normalizeToolFailure({ toolName, rawFailure }) {
  const message = rawFailure?.message ?? rawFailure?.error ?? `${toolName} failed.`
  const details = {
    adapter: "stratawiki_personal_knowledge",
    toolName,
  }

  if (
    message.includes("No profile context found") ||
    message.includes("Unknown personal record") ||
    message.includes("Unknown interpretation record") ||
    message.includes("Unknown fact record")
  ) {
    return createNotFoundError(message, details)
  }

  if (message.includes("profile_version does not match")) {
    return createValidationError(message, details)
  }

  return createTemporarilyUnavailableError(message, details)
}

async function callTool(wrapperPath, toolName, payload) {
  if (!wrapperPath) {
    throw createTemporarilyUnavailableError(
      "STRATAWIKI_CLI_WRAPPER is required for personal-aware ask.",
      {
        adapter: "stratawiki_personal_knowledge",
      },
    )
  }

  await assertExecutable(wrapperPath)

  const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-personal-knowledge-"))
  const argsFilePath = join(tempDir, `${toolName}.json`)

  try {
    await writeFile(argsFilePath, JSON.stringify(payload, null, 2), "utf8")

    const result = await spawnAndCapture(wrapperPath, [
      "call",
      toolName,
      "--args-file",
      argsFilePath,
      "--envelope",
    ])

    if (result.code !== 0) {
      throw createTemporarilyUnavailableError(
        "The StrataWiki personal knowledge wrapper call failed.",
        {
          adapter: "stratawiki_personal_knowledge",
          toolName,
          stderr: result.stderr || result.stdout || undefined,
        },
      )
    }

    const envelope = parseJson(
      result.stdout,
      `StrataWiki personal knowledge tool ${toolName}`,
    )

    if (!envelope?.ok) {
      throw normalizeToolFailure({
        toolName,
        rawFailure: envelope,
      })
    }

    return envelope.result
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw createTemporarilyUnavailableError(
        "The StrataWiki personal knowledge wrapper could not be started.",
        {
          adapter: "stratawiki_personal_knowledge",
          wrapperPath,
        },
      )
    }

    throw error
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

export function createStratawikiPersonalKnowledgeClient({ env = {} } = {}) {
  const wrapperPath = env.stratawikiCliWrapper
  const domain = env.readDomain ?? "recruiting"

  return {
    async getProfileContext({ tenantId, userId }) {
      return await callTool(wrapperPath, env.getProfileContextTool, {
        domain,
        tenant_id: tenantId,
        user_id: userId,
      })
    },

    async upsertProfileContext({ profileContext }) {
      return await callTool(wrapperPath, env.upsertProfileContextTool, {
        profile_context: {
          domain,
          ...profileContext,
        },
      })
    },

    async queryPersonalKnowledge({
      tenantId,
      userId,
      question,
      profileVersion,
      save = false,
    }) {
      return await callTool(wrapperPath, env.personalQueryTool, {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        question,
        profile_version: profileVersion,
        model_profile: env.personalQueryModelProfile,
        save: Boolean(save),
      })
    },

    async getPersonalRecord({ tenantId, userId, personalId }) {
      return await callTool(wrapperPath, env.getPersonalRecordTool, {
        domain,
        tenant_id: tenantId,
        user_id: userId,
        personal_id: personalId,
      })
    },

    async getInterpretationRecord({ interpretationId }) {
      return await callTool(wrapperPath, env.getInterpretationRecordTool, {
        domain,
        interpretation_id: interpretationId,
      })
    },

    async getFactRecord({ factId }) {
      return await callTool(wrapperPath, env.getFactRecordTool, {
        domain,
        fact_id: factId,
      })
    },
  }
}
