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
  const projectionStates =
    rawResponse?.projectionStates?.map(normalizeProjectionState).filter(Boolean) ?? []

  if (
    typeof rawResponse?.commandId !== "string" ||
    typeof rawResponse?.acceptedAt !== "string"
  ) {
    throw createUnknownFailureError(
      "The StrataWiki command facade submit response is missing required fields.",
      {
        adapter: "stratawiki_command_facade",
      },
    )
  }

  return compactObject({
    commandId: rawResponse.commandId,
    acceptedAt: rawResponse.acceptedAt,
    projectionStates: projectionStates.length > 0 ? projectionStates : undefined,
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
    acceptedAt: commandRecord.acceptedAt,
    finishedAt: commandRecord.finishedAt,
    projectionStates: projectionStates.length > 0 ? projectionStates : undefined,
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
