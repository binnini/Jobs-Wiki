import test from "node:test"
import assert from "node:assert/strict"
import { createStratawikiCommandFacadeAdapter } from "../src/adapters/command-facade/stratawiki-command-facade-adapter.js"
import { createStratawikiCommandFacadeClient } from "../src/adapters/command-facade/stratawiki-command-facade-client.js"

function createHttpClientStub() {
  return {
    submitCalls: [],
    statusCalls: [],
    async submitCommand(payload) {
      this.submitCalls.push(payload)
      return {
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
      }
    },
    async getCommandStatus(payload) {
      this.statusCalls.push(payload)
      return {
        command: {
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
        },
      }
    },
  }
}

test("command facade client submits the expected envelope through HTTP", async () => {
  const httpClient = createHttpClientStub()
  const client = createStratawikiCommandFacadeClient({
    httpClient,
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

  assert.deepEqual(httpClient.submitCalls, [
    {
      requestId: "request_001",
      command: {
        name: "jobs_wiki.ingestion.trigger_worknet",
        payload: {
          sourceId: "worknet.recruiting",
        },
      },
      idempotencyKey: "request_001",
    },
  ])
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
})

test("command facade client normalizes status responses", async () => {
  const httpClient = createHttpClientStub()
  const client = createStratawikiCommandFacadeClient({
    httpClient,
  })

  const status = await client.getCommandStatus({
    commandId: "cmd_001",
  })

  assert.deepEqual(httpClient.statusCalls, [
    {
      commandId: "cmd_001",
    },
  ])
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
})

test("command facade adapter builds the worknet trigger envelope on top of the thin client", async () => {
  const httpClient = createHttpClientStub()
  const adapter = createStratawikiCommandFacadeAdapter({
    client: createStratawikiCommandFacadeClient({ httpClient }),
  })

  const accepted = await adapter.triggerWorknetIngestion({
    sourceId: "worknet.recruiting",
    idempotencyKey: "request_002",
  })

  assert.deepEqual(httpClient.submitCalls, [
    {
      requestId: "request_002",
      idempotencyKey: "request_002",
      command: {
        name: "jobs_wiki.ingestion.trigger_worknet",
        payload: {
          sourceId: "worknet.recruiting",
        },
      },
    },
  ])
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
})

test("command facade client fails with temporarily_unavailable when the HTTP base URL is missing", async () => {
  const client = createStratawikiCommandFacadeClient

  assert.throws(
    () =>
      client({
        env: {},
      }),
    {
      code: "temporarily_unavailable",
    },
  )
})

test("command facade adapter defers HTTP client initialization until command operations are used", async () => {
  const adapter = createStratawikiCommandFacadeAdapter({
    env: {},
  })

  await assert.rejects(
    () =>
      adapter.getCommandStatus({
        commandId: "cmd_missing_base_url",
      }),
    {
      code: "temporarily_unavailable",
    },
  )
})
