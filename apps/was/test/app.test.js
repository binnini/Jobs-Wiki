import test from "node:test"
import assert from "node:assert/strict"
import { Readable } from "node:stream"
import { createApp } from "../src/app.js"

function createMockResponse() {
  const headers = new Map()

  return {
    headersSent: false,
    statusCode: 200,
    body: "",
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value)
    },
    getHeader(name) {
      return headers.get(name.toLowerCase())
    },
    end(chunk = "") {
      this.body = typeof chunk === "string" ? chunk : chunk.toString("utf8")
      this.headersSent = true
    },
  }
}

async function invokeApp(app, { method = "GET", url = "/", headers = {}, body } = {}) {
  const chunks =
    body === undefined
      ? []
      : [typeof body === "string" ? body : JSON.stringify(body)]

  const req = Readable.from(chunks)
  req.method = method
  req.url = url
  req.headers = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

  const res = createMockResponse()

  await app(req, res)

  return {
    status: res.statusCode,
    headers: {
      "x-request-id": res.getHeader("x-request-id"),
      "content-type": res.getHeader("content-type"),
    },
    body: JSON.parse(res.body || "{}"),
  }
}

async function withApp(run) {
  return withConfiguredApp(
    {
      serviceName: "jobs-wiki-was-test",
      host: "127.0.0.1",
      port: 0,
      nodeEnv: "test",
      dataMode: "mock",
      logLevel: "silent",
    },
    run,
  )
}

async function withConfiguredApp(env, run) {
  const app = createApp({
    env,
  })

  await run(app)
}

test("GET /health returns runtime metadata", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, { url: "/health" })

    assert.equal(response.status, 200)
    assert.equal(response.body.status, "ok")
    assert.equal(response.body.dataMode, "mock")
    assert.ok(response.headers["x-request-id"])
  })
})

test("GET /api/workspace/summary returns a mock workspace summary projection", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/workspace/summary",
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.projection, "workspace_summary")
    assert.equal(response.body.recommendedOpportunities.length, 3)
    assert.equal(response.body.sync.visibility, "applied")
    assert.equal(
      response.body.recommendedOpportunities[0].decoration.urgencyLabel,
      "D-13",
    )
    assert.equal(
      response.body.actionQueue[0].relatedOpportunityRef.title,
      "Backend Platform Engineer",
    )
  })
})

test("GET /api/opportunities returns filter-aware pagination and card-complete list items", async () => {
  await withApp(async (app) => {
    const firstPage = await invokeApp(app, {
      url: "/api/opportunities?status=open&limit=1",
    })

    assert.equal(firstPage.status, 200)
    assert.equal(firstPage.body.projection, "opportunity_list")
    assert.equal(firstPage.body.items.length, 1)
    assert.equal(firstPage.body.items[0].surface.companyName, "Northstar Data")
    assert.equal(
      firstPage.body.items[0].metadata.closesAt,
      "2026-05-01T23:59:59+09:00",
    )
    assert.equal(
      firstPage.body.items[0].decoration.whyMatched,
      "Strong overlap with Node.js service architecture.",
    )
    assert.equal(firstPage.body.nextCursor, "cursor_001")

    const secondPage = await invokeApp(app, {
      url: `/api/opportunities?status=open&limit=1&cursor=${firstPage.body.nextCursor}`,
    })

    assert.equal(secondPage.status, 200)
    assert.equal(secondPage.body.items.length, 1)
    assert.equal(secondPage.body.items[0].surface.companyName, "Fieldline Labs")
    assert.equal(secondPage.body.nextCursor, undefined)
  })
})

test("GET /api/opportunities omits nextCursor when filtered results fit in one page", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/opportunities?status=closing_soon&limit=1",
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.items.length, 1)
    assert.equal(response.body.items[0].surface.companyName, "Fieldline")
    assert.equal(response.body.nextCursor, undefined)
  })
})

test("GET /api/opportunities rejects malformed cursors", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/opportunities?cursor=page-2",
    })

    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, "validation_failed")
  })
})

test("GET /api/opportunities normalizes blank optional string filters", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/opportunities?cursor=%20%20&status=%20%20&limit=2",
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.items.length, 2)
    assert.equal(response.body.nextCursor, "cursor_002")
  })
})

test("GET /api/calendar returns filtered calendar items", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/calendar?from=2026-04-25",
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.projection, "calendar")
    assert.equal(response.body.items.length, 1)
    assert.equal(response.body.items[0].calendarItemId, "calendar_backend_deadline")
  })
})

test("POST /api/workspace/ask validates the request body", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/workspace/ask",
      headers: {
        "content-type": "application/json",
      },
      body: { save: true },
    })

    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, "validation_failed")
  })
})

test("GET /api/opportunities/:opportunityId normalizes not found errors", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/opportunities/unknown",
    })

    assert.equal(response.status, 404)
    assert.equal(response.body.error.code, "not_found")
  })
})

test("real adapter mode returns normalized temporary unavailability errors", async () => {
  await withConfiguredApp(
    {
      serviceName: "jobs-wiki-was-test",
      host: "127.0.0.1",
      port: 0,
      nodeEnv: "test",
      dataMode: "real",
      logLevel: "silent",
    },
    async (app) => {
      const response = await invokeApp(app, {
        url: "/api/workspace/summary",
      })

      assert.equal(response.status, 503)
      assert.equal(response.body.error.code, "temporarily_unavailable")
      assert.equal(response.body.error.details.adapter, "stratawiki_read_authority")
    },
  )
})
