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
      name: "jobs_wiki.ingestion.trigger_worknet",
      arguments: {
        sourceId: "worknet.recruiting",
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

test("command facade client normalizes snake_case runtime responses", async () => {
  const client = createStratawikiCommandFacadeClient({
    httpClient: {
      async submitCommand() {
        return {
          command_id: "cmd_002",
          state: "succeeded",
          submitted_at: "2026-04-21T09:19:24.227749Z",
          finished_at: "2026-04-21T09:19:24.227919Z",
          refresh_scopes: ["workspace_summary"],
          projection_states: [
            {
              projection: "workspace_summary",
              visibility: "applied",
              visible_at: "2026-04-21T09:19:24.227919Z",
            },
          ],
        }
      },
      async getCommandStatus() {
        return {
          command: {
            command_id: "cmd_002",
            state: "failed",
            submitted_at: "2026-04-21T09:19:24.227749Z",
            finished_at: "2026-04-21T09:19:25.000000Z",
            refresh_scopes: ["workspace_summary"],
            error: {
              code: "validation_failed",
              message: "producer is required",
              retryable: false,
            },
          },
        }
      },
    },
  })

  const accepted = await client.submitCommand({
    command: {
      name: "jobs_wiki.ingestion.trigger_worknet",
      payload: {
        sourceId: "worknet.recruiting",
      },
    },
  })
  const status = await client.getCommandStatus({
    commandId: "cmd_002",
  })

  assert.deepEqual(accepted, {
    commandId: "cmd_002",
    status: "succeeded",
    acceptedAt: "2026-04-21T09:19:24.227749Z",
    finishedAt: "2026-04-21T09:19:24.227919Z",
    refreshScopes: ["workspace_summary"],
    projectionStates: [
      {
        projection: "workspace_summary",
        visibility: "applied",
        visibleAt: "2026-04-21T09:19:24.227919Z",
      },
    ],
  })
  assert.deepEqual(status, {
    commandId: "cmd_002",
    status: "failed",
    acceptedAt: "2026-04-21T09:19:24.227749Z",
    finishedAt: "2026-04-21T09:19:25.000000Z",
    refreshScopes: ["workspace_summary"],
    error: {
      code: "validation_failed",
      message: "producer is required",
      retryable: false,
    },
  })
})

test("command facade adapter builds the worknet trigger envelope on top of the thin client", async () => {
  const httpClient = createHttpClientStub()
  const adapter = createStratawikiCommandFacadeAdapter({
    client: createStratawikiCommandFacadeClient({ httpClient }),
    loadIngestionEnvImpl() {
      return {
        worknetFetchPage: 1,
        worknetFetchSize: 5,
        stratawikiBaseUrl: "http://127.0.0.1:18080",
      }
    },
    createIngestionClientsImpl() {
      return {
        stratawiki: { wrapperPath: null },
        worknetRecruiting: {},
      }
    },
    async runWorknetIngestionImpl() {
      return {
        status: "ingested",
        batches: [
          {
            sourceId: "worknet.recruiting",
          },
        ],
      }
    },
  })

  const accepted = await adapter.triggerWorknetIngestion({
    sourceId: "worknet.recruiting",
    idempotencyKey: "request_002",
  })

  assert.deepEqual(httpClient.submitCalls, [])
  assert.equal(typeof accepted.commandId, "string")
  assert.match(accepted.commandId, /^jobs-wiki-local-worknet:worknet\.recruiting:/)
  assert.equal(accepted.status, "succeeded")
  assert.equal(accepted.outcome, "fully_applied")
  assert.deepEqual(accepted.refreshScopes, [
    "workspace_summary",
    "opportunity_list",
    "calendar",
  ])
  assert.deepEqual(accepted.projectionStates, [
    {
      projection: "workspace_summary",
      visibility: "applied",
    },
    {
      projection: "opportunity_list",
      visibility: "applied",
    },
    {
      projection: "calendar",
      visibility: "applied",
    },
  ])

  const status = await adapter.getCommandStatus({
    commandId: accepted.commandId,
  })

  assert.deepEqual(status, accepted)
})

test("command facade adapter stores failed local worknet ingestion attempts as terminal command records", async () => {
  const adapter = createStratawikiCommandFacadeAdapter({
    loadIngestionEnvImpl() {
      return {
        worknetFetchPage: 1,
        worknetFetchSize: 5,
      }
    },
    createIngestionClientsImpl() {
      return {
        stratawiki: { wrapperPath: null },
        worknetRecruiting: {},
      }
    },
    async runWorknetIngestionImpl() {
      throw new Error("Missing WorkNet employment auth key.")
    },
    client: createStratawikiCommandFacadeClient({ httpClient: createHttpClientStub() }),
  })

  const accepted = await adapter.triggerWorknetIngestion({
    sourceId: "worknet.recruiting",
  })

  assert.equal(accepted.status, "failed")
  assert.equal(accepted.outcome, "failed")
  assert.deepEqual(accepted.refreshScopes, ["workspace_summary"])
  assert.deepEqual(accepted.error, {
    code: "worknet_ingestion_failed",
    message: "Missing WorkNet employment auth key.",
    retryable: false,
  })

  const status = await adapter.getCommandStatus({
    commandId: accepted.commandId,
  })

  assert.deepEqual(status, accepted)
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
