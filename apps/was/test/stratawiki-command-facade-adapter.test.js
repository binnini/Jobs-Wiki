import test from "node:test"
import assert from "node:assert/strict"
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  createStratawikiCommandFacadeAdapter,
} from "../src/adapters/command-facade/stratawiki-command-facade-adapter.js"
import {
  createStratawikiCommandFacadeClient,
} from "../src/adapters/command-facade/stratawiki-command-facade-client.js"

async function createWrapperFixture() {
  const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-command-facade-test-"))
  const wrapperPath = join(tempDir, "fake-wrapper.sh")
  const submitCapturePath = join(tempDir, "submit.json")
  const statusCapturePath = join(tempDir, "status.json")

  await writeFile(
    wrapperPath,
    `#!/bin/sh
set -eu

if [ "$1" = "call" ] && [ "$2" = "knowledge.command.submit" ]; then
  cp "$4" "${submitCapturePath}"
  printf '%s' '{"command":{"commandId":"cmd_001","status":"accepted","acceptedAt":"2026-04-19T00:00:00.000Z","refreshScopes":["workspace_summary"],"projectionStates":[{"projection":"workspace_summary","visibility":"pending"}]}}'
  exit 0
fi

if [ "$1" = "call" ] && [ "$2" = "knowledge.command.get" ]; then
  cp "$4" "${statusCapturePath}"
  printf '%s' '{"status":"ok","command":{"commandId":"cmd_001","status":"running","acceptedAt":"2026-04-19T00:00:00.000Z","refreshScopes":["workspace_summary"],"projectionStates":[{"projection":"workspace_summary","visibility":"pending"}]}}'
  exit 0
fi

echo "unexpected invocation" >&2
exit 1
`,
    "utf8",
  )
  await chmod(wrapperPath, 0o755)

  return {
    wrapperPath,
    submitCapturePath,
    statusCapturePath,
    async cleanup() {
      await rm(tempDir, { recursive: true, force: true })
    },
  }
}

test("command facade client submits the expected envelope through the wrapper", async () => {
  const fixture = await createWrapperFixture()

  try {
    const client = createStratawikiCommandFacadeClient({
      env: {
        stratawikiCliWrapper: fixture.wrapperPath,
        commandSubmitTool: "knowledge.command.submit",
        commandStatusTool: "knowledge.command.get",
      },
    })

    const accepted = await client.submitCommand({
      requestId: "request_001",
      command: {
        name: "jobs_wiki.ingestion.trigger_worknet",
        payload: {
          sourceId: "worknet.recruiting",
        },
      },
    })

    const capturedSubmitPayload = JSON.parse(
      await readFile(fixture.submitCapturePath, "utf8"),
    )

    assert.deepEqual(capturedSubmitPayload, {
      requestId: "request_001",
      command: {
        name: "jobs_wiki.ingestion.trigger_worknet",
        payload: {
          sourceId: "worknet.recruiting",
        },
      },
    })
    assert.deepEqual(accepted, {
      commandId: "cmd_001",
      status: "accepted",
      acceptedAt: "2026-04-19T00:00:00.000Z",
      refreshScopes: ["workspace_summary"],
      projectionStates: [
        {
          projection: "workspace_summary",
          visibility: "pending",
        },
      ],
    })
  } finally {
    await fixture.cleanup()
  }
})

test("command facade client normalizes status responses", async () => {
  const fixture = await createWrapperFixture()

  try {
    const client = createStratawikiCommandFacadeClient({
      env: {
        stratawikiCliWrapper: fixture.wrapperPath,
        commandSubmitTool: "knowledge.command.submit",
        commandStatusTool: "knowledge.command.get",
      },
    })

    const status = await client.getCommandStatus({
      commandId: "cmd_001",
    })
    const capturedStatusPayload = JSON.parse(
      await readFile(fixture.statusCapturePath, "utf8"),
    )

    assert.deepEqual(capturedStatusPayload, {
      commandId: "cmd_001",
    })
    assert.deepEqual(status, {
      commandId: "cmd_001",
      status: "running",
      acceptedAt: "2026-04-19T00:00:00.000Z",
      refreshScopes: ["workspace_summary"],
      projectionStates: [
        {
          projection: "workspace_summary",
          visibility: "pending",
        },
      ],
    })
  } finally {
    await fixture.cleanup()
  }
})

test("command facade adapter builds the worknet trigger envelope on top of the thin client", async () => {
  const fixture = await createWrapperFixture()

  try {
    const adapter = createStratawikiCommandFacadeAdapter({
      env: {
        stratawikiCliWrapper: fixture.wrapperPath,
        commandSubmitTool: "knowledge.command.submit",
        commandStatusTool: "knowledge.command.get",
      },
    })

    const accepted = await adapter.triggerWorknetIngestion({
      sourceId: "worknet.recruiting",
      idempotencyKey: "request_002",
    })
    const capturedSubmitPayload = JSON.parse(
      await readFile(fixture.submitCapturePath, "utf8"),
    )

    assert.equal(capturedSubmitPayload.requestId, "request_002")
    assert.deepEqual(capturedSubmitPayload.command, {
      name: "jobs_wiki.ingestion.trigger_worknet",
      payload: {
        sourceId: "worknet.recruiting",
      },
    })
    assert.deepEqual(accepted, {
      commandId: "cmd_001",
      status: "accepted",
      acceptedAt: "2026-04-19T00:00:00.000Z",
      refreshScopes: ["workspace_summary"],
      projectionStates: [
        {
          projection: "workspace_summary",
          visibility: "pending",
        },
      ],
    })
  } finally {
    await fixture.cleanup()
  }
})

test("command facade client fails with temporarily_unavailable when the wrapper path is missing", async () => {
  const client = createStratawikiCommandFacadeClient({
    env: {
      stratawikiCliWrapper: "/tmp/does-not-exist",
      commandSubmitTool: "knowledge.command.submit",
      commandStatusTool: "knowledge.command.get",
    },
  })

  await assert.rejects(
    () =>
      client.submitCommand({
        requestId: "request_003",
        command: {
          name: "jobs_wiki.ingestion.trigger_worknet",
          payload: {
            sourceId: "worknet.recruiting",
          },
        },
      }),
    {
      code: "temporarily_unavailable",
    },
  )
})
