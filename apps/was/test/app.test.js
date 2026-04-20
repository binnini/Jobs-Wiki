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

test("GET /api/workspace returns layered shell navigation with active projection", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/workspace",
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.projection, "workspace")
    assert.equal(response.body.navigation.sections.length, 3)
    assert.deepEqual(response.body.navigation.sections[0], {
      sectionId: "shared",
      label: "shared",
      items: [
        {
          objectRef: {
            objectId: "report:baseline",
            objectKind: "report",
            title: "기본 리포트",
          },
          kind: "report",
          layer: "shared",
          path: "/workspace",
          active: true,
        },
        {
          objectRef: {
            objectId: "calendar:applications",
            objectKind: "calendar",
            title: "지원 일정",
          },
          kind: "calendar",
          layer: "shared",
          path: "/calendar",
        },
        {
          objectRef: {
            objectId: "shared:interp:market-trend-jp-backend",
            objectKind: "document",
            title: "일본 백엔드 채용 트렌드",
          },
          kind: "document",
          layer: "shared",
          path: "/documents/shared%3Ainterp%3Amarket-trend-jp-backend",
        },
        {
          objectRef: {
            objectId: "opportunity:backend_platform",
            objectKind: "opportunity",
            title: "Backend Platform Engineer",
          },
          kind: "opportunity",
          layer: "shared",
          path: "/opportunities/opp_backend_platform",
        },
        {
          objectRef: {
            objectId: "opportunity:report_runtime",
            objectKind: "opportunity",
            title: "Report Runtime Engineer",
          },
          kind: "opportunity",
          layer: "shared",
          path: "/opportunities/opp_report_runtime",
        },
      ],
    })
    assert.deepEqual(response.body.navigation.sections[1], {
      sectionId: "personal_raw",
      label: "personal/raw",
      items: [
        {
          objectRef: {
            objectId: "personal_raw:personal:resume-v3",
            objectKind: "document",
            title: "이력서_v3 작업본",
          },
          kind: "document",
          layer: "personal_raw",
          path: "/documents/personal_raw%3Apersonal%3Aresume-v3",
        },
      ],
    })
    assert.deepEqual(response.body.navigation.sections[2], {
      sectionId: "personal_wiki",
      label: "personal/wiki",
      items: [
        {
          objectRef: {
            objectId: "personal_wiki:personal:backend-application-strategy",
            objectKind: "document",
            title: "Backend 지원 전략 노트",
          },
          kind: "document",
          layer: "personal_wiki",
          path: "/documents/personal_wiki%3Apersonal%3Abackend-application-strategy",
        },
      ],
    })
    assert.deepEqual(response.body.activeProjection, {
      projection: "report",
      objectRef: {
        objectId: "report:baseline",
        objectKind: "report",
        title: "기본 리포트",
      },
    })
  })
})

test("GET /api/documents/:documentId returns shared and personal document projections", async () => {
  await withApp(async (app) => {
    const sharedResponse = await invokeApp(app, {
      url: "/api/documents/shared%3Ainterp%3Amarket-trend-jp-backend",
    })
    const personalResponse = await invokeApp(app, {
      url: "/api/documents/personal_raw%3Apersonal%3Aresume-v3",
    })

    assert.equal(sharedResponse.status, 200)
    assert.equal(sharedResponse.body.projection, "document")
    assert.equal(sharedResponse.body.item.layer, "shared")
    assert.equal(sharedResponse.body.item.writable, false)
    assert.equal(sharedResponse.body.item.surface.title, "일본 백엔드 채용 트렌드")

    assert.equal(personalResponse.status, 200)
    assert.equal(personalResponse.body.item.layer, "personal_raw")
    assert.equal(personalResponse.body.item.writable, true)
    assert.equal(personalResponse.body.item.metadata.source.provider, "upload")
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
      url: "/api/calendar?from=2026-04-26",
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.projection, "calendar")
    assert.equal(response.body.items.length, 1)
    assert.equal(response.body.items[0].calendarItemId, "calendar_backend_deadline")
    assert.deepEqual(response.body.items[0].objectRef, {
      objectId: "opportunity:backend_platform",
      objectKind: "opportunity",
      title: "Backend Platform Engineer",
      opportunityId: "opp_backend_platform",
    })
  })
})

test("GET /api/calendar returns time-sorted items that can deep-link to opportunity detail", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/calendar?from=2026-04-18&to=2026-05-31",
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.items.length, 2)
    assert.equal(response.body.items[0].calendarItemId, "calendar_product_data_deadline")
    assert.equal(response.body.items[0].startsAt, "2026-04-25T14:59:59.000Z")
    assert.equal(response.body.items[0].objectRef.opportunityId, "opp_product_data")
    assert.equal(response.body.items[0].decoration.companyName, "Fieldline")
    assert.equal(response.body.items[1].calendarItemId, "calendar_backend_deadline")
    assert.equal(response.body.items[1].objectRef.opportunityId, "opp_backend_platform")
  })
})

test("GET /api/calendar rejects invalid date queries", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/calendar?from=2026-02-30",
    })

    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, "validation_failed")
    assert.equal(response.body.error.message, "`from` must use YYYY-MM-DD format.")
  })
})

test("GET /api/workspace/sync returns current read-side projection visibility in mock mode", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/workspace/sync",
    })

    assert.equal(response.status, 200)
    assert.deepEqual(response.body.projections, [
      {
        projection: "workspace_summary",
        visibility: "applied",
        lastKnownVersion: "mock-v1",
        lastVisibleAt: "2026-04-18T09:00:00.000Z",
      },
      {
        projection: "opportunity_list",
        visibility: "applied",
        lastKnownVersion: "mock-v1",
        lastVisibleAt: "2026-04-18T09:00:00.000Z",
      },
      {
        projection: "calendar",
        visibility: "applied",
        lastKnownVersion: "mock-v1",
        lastVisibleAt: "2026-04-18T09:00:00.000Z",
      },
    ])
  })
})

test("GET /api/workspace/sync returns command visibility when commandId is provided", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/workspace/sync?commandId=mock-command-worknet.recruiting",
    })

    assert.equal(response.status, 200)
    assert.deepEqual(response.body.command, {
      commandId: "mock-command-worknet.recruiting",
      status: "accepted",
    })
    assert.deepEqual(response.body.projections, [
      {
        projection: "workspace_summary",
        visibility: "pending",
      },
    ])
  })
})

test("POST /api/admin/ingestions/worknet/:sourceId returns an accepted command envelope", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/admin/ingestions/worknet/worknet.recruiting",
    })

    assert.equal(response.status, 202)
    assert.deepEqual(response.body, {
      commandId: "mock-command-worknet.recruiting",
      status: "accepted",
      acceptedAt: "2026-04-18T09:00:00.000Z",
      projectionStates: [
        {
          projection: "workspace_summary",
          visibility: "pending",
        },
      ],
    })
  })
})

test("POST /api/admin/ingestions/worknet/:sourceId accepts an explicit idempotency key header", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/admin/ingestions/worknet/worknet.recruiting",
      headers: {
        "idempotency-key": "request_123",
      },
    })

    assert.equal(response.status, 202)
    assert.equal(response.body.commandId, "mock-command-worknet.recruiting")
    assert.equal(response.body.status, "accepted")
  })
})

test("real command facade mode returns normalized temporary unavailability errors for command status", async () => {
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
        url: "/api/workspace/sync?commandId=cmd_001",
      })

      assert.equal(response.status, 503)
      assert.equal(response.body.error.code, "temporarily_unavailable")
      assert.equal(response.body.error.details.adapter, "stratawiki_command_facade")
    },
  )
})

test("POST /api/workspace/ask returns a generic workspace answer without opportunity context", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/workspace/ask",
      headers: {
        "content-type": "application/json",
      },
      body: {
        question: "What should I improve first?",
        save: true,
      },
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.projection, "ask")
    assert.equal(response.body.answer.answerId, "answer_mock_gap_review")
    assert.match(response.body.answer.markdown, /Question: What should I improve first\?/)
    assert.equal(response.body.sync.visibility, "applied")
    assert.equal(response.body.evidence.length, 1)
    assert.equal(response.body.relatedOpportunities.length, 3)
    assert.equal(response.body.relatedDocuments.length, 1)
  })
})

test("POST /api/workspace/ask returns an opportunity-scoped answer and excludes the current opportunity from related cards", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/workspace/ask",
      headers: {
        "content-type": "application/json",
      },
      body: {
        question: "How should I position my API work for this role?",
        opportunityId: "opp_backend_platform",
        save: false,
      },
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.projection, "ask")
    assert.match(response.body.answer.markdown, /Focused fit for Backend Platform Engineer/)
    assert.equal(response.body.evidence.length, 2)
    assert.equal(response.body.relatedOpportunities.length, 2)
    assert.deepEqual(
      response.body.relatedOpportunities.map((item) => item.opportunityRef.opportunityId),
      ["opp_report_runtime", "opp_product_data"],
    )
    assert.equal(response.body.relatedDocuments.length, 2)
    assert.equal(response.body.activeContext.contextType, "opportunity")
  })
})

test("POST /api/workspace/ask returns a document-scoped answer when documentId is provided", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/workspace/ask",
      headers: {
        "content-type": "application/json",
      },
      body: {
        question: "이 문서를 기준으로 다음 액션을 정리해 줘.",
        documentId: "personal_raw:personal:resume-v3",
      },
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.activeContext.contextType, "document")
    assert.equal(
      response.body.activeContext.documentRef.objectId,
      "personal_raw:personal:resume-v3",
    )
    assert.equal(response.body.answer.markdown.includes("Document focus"), true)
    assert.equal(response.body.relatedDocuments.length >= 1, true)
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
    assert.equal(response.body.error.message, "question is required")
    assert.deepEqual(response.body.error.details, {
      field: "question",
    })
  })
})

test("POST /api/workspace/ask normalizes blank optional opportunityId to generic context", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/workspace/ask",
      headers: {
        "content-type": "application/json",
      },
      body: {
        question: "What else should I compare?",
        opportunityId: "   ",
      },
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.relatedOpportunities.length, 3)
  })
})

test("POST /api/workspace/ask returns not_found for unknown opportunity context", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/workspace/ask",
      headers: {
        "content-type": "application/json",
      },
      body: {
        question: "How should I position this role?",
        opportunityId: "opp_unknown",
      },
    })

    assert.equal(response.status, 404)
    assert.equal(response.body.error.code, "not_found")
    assert.equal(response.body.error.message, "opportunity not found")
    assert.deepEqual(response.body.error.details, {
      opportunityId: "opp_unknown",
    })
  })
})

test("POST /api/workspace/ask rejects invalid save values with normalized error details", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/workspace/ask",
      headers: {
        "content-type": "application/json",
      },
      body: {
        question: "What should I improve first?",
        save: "yes",
      },
    })

    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, "validation_failed")
    assert.equal(response.body.error.message, "save must be a boolean when provided")
    assert.deepEqual(response.body.error.details, {
      field: "save",
    })
  })
})

test("GET /api/opportunities/:opportunityId normalizes not found errors", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/opportunities/unknown",
    })

    assert.equal(response.status, 404)
    assert.equal(response.body.error.code, "not_found")
    assert.equal(response.body.error.message, "opportunity not found")
    assert.deepEqual(response.body.error.details, {
      opportunityId: "unknown",
    })
  })
})

test("GET /api/opportunities/:opportunityId returns a detail payload that fills header, company, qualification, and analysis blocks", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/opportunities/opp_backend_platform",
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.projection, "opportunity_detail")
    assert.equal(response.body.item.surface.title, "Backend Platform Engineer")
    assert.equal(
      response.body.item.metadata.closesAt,
      "2026-05-01T23:59:59+09:00",
    )
    assert.deepEqual(response.body.item.company, {
      companyRef: {
        objectId: "company:northstar_data",
        objectKind: "company",
        title: "Northstar Data",
      },
      name: "Northstar Data",
      summary: "Builds workflow systems for recruiting and market intelligence.",
      homepageUrl: "https://example.test/northstar-data",
      mainBusiness: "Hiring operations software",
    })
    assert.deepEqual(response.body.item.qualification, {
      locationText: "Hybrid / Seoul",
      requirementsText: "Node.js, API design, integration boundaries, observability.",
      selectionProcessText: "Screening -> technical interview -> final loop",
    })
    assert.deepEqual(response.body.item.analysis, {
      fitScore: 81,
      strengthsSummary: "Relevant experience with API and runtime scaffolding.",
      riskSummary: "Needs deeper evidence around large-scale platform migrations.",
    })
  })
})

test("GET /api/opportunities/:opportunityId rejects blank ids", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/opportunities/%20%20",
    })

    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, "validation_failed")
    assert.equal(
      response.body.error.message,
      "`opportunityId` path parameter is required.",
    )
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
