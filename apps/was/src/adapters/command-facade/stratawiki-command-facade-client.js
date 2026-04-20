import { constants } from "node:fs"
import { access, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn } from "node:child_process"
import { createTemporarilyUnavailableError, createUnknownFailureError } from "../../http/errors.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

async function assertExecutable(pathText) {
  try {
    await access(pathText, constants.X_OK)
  } catch (error) {
    throw createTemporarilyUnavailableError(
      "The StrataWiki command facade wrapper is not executable.",
      {
        adapter: "stratawiki_command_facade",
        wrapperPath: pathText,
      },
    )
  }
}

function normalizeProjectionState(state) {
  return compactObject({
    projection: state?.projection,
    visibility: state?.visibility,
    version: state?.version ?? state?.lastKnownVersion,
    visibleAt: state?.visibleAt ?? state?.lastVisibleAt,
  })
}

function normalizeCommandError(error) {
  if (!error || typeof error !== "object") {
    return undefined
  }

  if (typeof error.code !== "string" || typeof error.message !== "string") {
    return undefined
  }

  return compactObject({
    code: error.code,
    message: error.message,
    retryable:
      typeof error.retryable === "boolean" ? error.retryable : undefined,
  })
}

function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw createUnknownFailureError(
      `${label} returned non-JSON output.`,
      {
        adapter: "stratawiki_command_facade",
      },
      error,
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

function normalizeSubmissionResponse(rawResponse) {
  const acceptedRecord = rawResponse?.command ?? rawResponse
  const projectionStates =
    acceptedRecord?.projectionStates?.map(normalizeProjectionState).filter(Boolean) ?? []

  if (
    typeof acceptedRecord?.commandId !== "string" ||
    typeof acceptedRecord?.acceptedAt !== "string"
  ) {
    throw createUnknownFailureError(
      "The StrataWiki command facade submit response is missing required fields.",
      {
        adapter: "stratawiki_command_facade",
      },
    )
  }

  return compactObject({
    commandId: acceptedRecord.commandId,
    status:
      typeof acceptedRecord.status === "string"
        ? acceptedRecord.status
        : "accepted",
    acceptedAt: acceptedRecord.acceptedAt,
    outcome:
      typeof acceptedRecord.outcome === "string"
        ? acceptedRecord.outcome
        : undefined,
    affectedObjectRefs:
      acceptedRecord?.affectedObjectRefs?.filter((value) => typeof value === "string") ??
      undefined,
    affectedRelationRefs:
      acceptedRecord?.affectedRelationRefs?.filter((value) => typeof value === "string") ??
      undefined,
    refreshScopes:
      acceptedRecord?.refreshScopes?.filter((value) => typeof value === "string") ??
      undefined,
    projectionStates: projectionStates.length > 0 ? projectionStates : undefined,
    error: normalizeCommandError(acceptedRecord?.error),
  })
}

function normalizeStatusResponse(rawResponse) {
  const commandRecord = rawResponse?.command ?? rawResponse
  const projectionStates =
    commandRecord?.projectionStates?.map(normalizeProjectionState).filter(Boolean) ?? []

  if (
    typeof commandRecord?.commandId !== "string" ||
    typeof commandRecord?.status !== "string"
  ) {
    throw createUnknownFailureError(
      "The StrataWiki command facade status response is missing required fields.",
      {
        adapter: "stratawiki_command_facade",
      },
    )
  }

  return compactObject({
    commandId: commandRecord.commandId,
    status: commandRecord.status,
    outcome:
      typeof commandRecord.outcome === "string"
        ? commandRecord.outcome
        : undefined,
    acceptedAt: commandRecord.acceptedAt,
    finishedAt: commandRecord.finishedAt,
    affectedObjectRefs:
      commandRecord?.affectedObjectRefs?.filter((value) => typeof value === "string") ??
      undefined,
    affectedRelationRefs:
      commandRecord?.affectedRelationRefs?.filter((value) => typeof value === "string") ??
      undefined,
    refreshScopes:
      commandRecord?.refreshScopes?.filter((value) => typeof value === "string") ??
      undefined,
    projectionStates: projectionStates.length > 0 ? projectionStates : undefined,
    error: normalizeCommandError(commandRecord?.error),
  })
}

export function createStratawikiCommandFacadeClient({ env = {} } = {}) {
  const wrapperPath = env.stratawikiCliWrapper
  const submitTool = env.commandSubmitTool
  const statusTool = env.commandStatusTool

  async function callTool(toolName, payload) {
    if (!wrapperPath) {
      throw createTemporarilyUnavailableError(
        "STRATAWIKI_CLI_WRAPPER is required for the real command facade adapter.",
        {
          adapter: "stratawiki_command_facade",
        },
      )
    }

    await assertExecutable(wrapperPath)

    const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-command-facade-"))
    const argsFilePath = join(tempDir, `${toolName}.json`)

    try {
      await writeFile(argsFilePath, JSON.stringify(payload, null, 2), "utf8")

      const result = await spawnAndCapture(wrapperPath, [
        "call",
        toolName,
        "--args-file",
        argsFilePath,
      ])

      if (result.code !== 0) {
        throw createTemporarilyUnavailableError(
          "The StrataWiki command facade wrapper call failed.",
          {
            adapter: "stratawiki_command_facade",
            toolName,
            stderr: result.stderr || result.stdout || undefined,
          },
        )
      }

      return parseJson(result.stdout, `StrataWiki command facade tool ${toolName}`)
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw createTemporarilyUnavailableError(
          "The StrataWiki command facade wrapper could not be started.",
          {
            adapter: "stratawiki_command_facade",
            wrapperPath,
          },
        )
      }

      throw error
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  }

  return {
    async submitCommand({ requestId, command }) {
      const rawResponse = await callTool(submitTool, {
        requestId,
        command,
      })

      return normalizeSubmissionResponse(rawResponse)
    },

    async getCommandStatus({ commandId }) {
      const rawResponse = await callTool(statusTool, {
        commandId,
      })

      return normalizeStatusResponse(rawResponse)
    },
  }
}
