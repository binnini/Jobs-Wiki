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
    assert.deepEqual(response.body.navigation.sections[0].items, [
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
        workspacePath: {
          sectionId: "shared",
          nodeType: "special_view",
          segments: ["workspace"],
          leaf: "workspace",
          key: "shared:workspace",
          parentKey: null,
          label: "기본 리포트",
          path: "/workspace",
        },
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
        workspacePath: {
          sectionId: "shared",
          nodeType: "special_view",
          segments: ["calendar"],
          leaf: "calendar",
          key: "shared:calendar",
          parentKey: null,
          label: "지원 일정",
          path: "/calendar",
        },
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
        workspacePath: {
          sectionId: "shared",
          nodeType: "document",
          segments: ["references", "market-trend-jp-backend"],
          leaf: "market-trend-jp-backend",
          key: "shared:references/market-trend-jp-backend",
          parentKey: "shared:references",
          label: "일본 백엔드 채용 트렌드",
          path: "/documents/shared%3Ainterp%3Amarket-trend-jp-backend",
        },
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
        workspacePath: {
          sectionId: "shared",
          nodeType: "special_view",
          segments: ["opportunities", "backend-platform-engineer"],
          leaf: "backend-platform-engineer",
          key: "shared:opportunities/backend-platform-engineer",
          parentKey: "shared:opportunities",
          label: "Backend Platform Engineer",
          path: "/opportunities/opp_backend_platform",
        },
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
        workspacePath: {
          sectionId: "shared",
          nodeType: "special_view",
          segments: ["opportunities", "report-runtime-engineer"],
          leaf: "report-runtime-engineer",
          key: "shared:opportunities/report-runtime-engineer",
          parentKey: "shared:opportunities",
          label: "Report Runtime Engineer",
          path: "/opportunities/opp_report_runtime",
        },
      },
    ])
    const sharedTree = response.body.navigation.sections[0].tree
    assert.equal(sharedTree.length, 4)
    assert.equal(sharedTree[0].kind, "report")
    assert.equal(sharedTree[0].objectRef.title, "기본 리포트")
    assert.equal(sharedTree[1].kind, "calendar")
    const referencesFolder = sharedTree.find((node) => node.kind === "folder" && node.label === "references")
    const opportunitiesFolder = sharedTree.find((node) => node.kind === "folder" && node.label === "opportunities")
    assert.ok(referencesFolder)
    assert.ok(opportunitiesFolder)
    assert.equal(referencesFolder.children[0].kind, "document")
    assert.equal(referencesFolder.children[0].objectRef.title, "일본 백엔드 채용 트렌드")
    assert.equal(opportunitiesFolder.children[0].kind, "opportunity")
    assert.equal(opportunitiesFolder.children[1].objectRef.title, "Report Runtime Engineer")

    const rawTree = response.body.navigation.sections[1].tree
    assert.equal(rawTree.length, 1)
    assert.equal(rawTree[0].kind, "folder")
    assert.equal(rawTree[0].label, "inbox")
    assert.equal(rawTree[0].children[0].kind, "document")

    const wikiTree = response.body.navigation.sections[2].tree
    assert.equal(wikiTree.length, 1)
    assert.equal(wikiTree[0].kind, "folder")
    assert.equal(wikiTree[0].label, "notes")
    assert.equal(wikiTree[0].children[0].kind, "document")
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

test("personal document CRUD and asset registration round-trip through the workspace shell", async () => {
  await withApp(async (app) => {
    const createResponse = await invokeApp(app, {
      method: "POST",
      url: "/api/documents",
      headers: {
        "content-type": "application/json",
      },
      body: {
        layer: "personal_raw",
        title: "새 개인 노트",
        bodyMarkdown: "## Draft\n\n첫 번째 버전",
        workspacePath: {
          segments: ["projects", "drafts"],
        },
      },
    })

    assert.equal(createResponse.status, 201)
    const createdDocumentId = createResponse.body.item.documentRef.objectId
    assert.match(createdDocumentId, /^personal_raw:pdoc_mock_/)
    assert.equal(createResponse.body.item.metadata.version, 1)
    assert.deepEqual(createResponse.body.item.workspacePath.segments, [
      "projects",
      "drafts",
    ])

    const workspaceAfterCreate = await invokeApp(app, {
      url: "/api/workspace",
    })
    assert.equal(
      workspaceAfterCreate.body.navigation.sections[1].items[0].objectRef.objectId,
      createdDocumentId,
    )
    const projectsFolder = workspaceAfterCreate.body.navigation.sections[1].tree.find(
      (node) => node.kind === "folder" && node.label === "projects",
    )
    assert.ok(projectsFolder)
    assert.equal(projectsFolder.children[0].kind, "document")

    const assetResponse = await invokeApp(app, {
      method: "POST",
      url: "/api/assets",
      headers: {
        "content-type": "application/json",
      },
      body: {
        filename: "resume_v4.pdf",
        mediaType: "application/pdf",
        storageRef: "s3://jobs-wiki-assets/resume_v4.pdf",
      },
    })
    assert.equal(assetResponse.status, 201)
    assert.match(assetResponse.body.assetId, /^passet_mock_/)
    assert.equal(assetResponse.body.storageRef, "s3://jobs-wiki-assets/resume_v4.pdf")

    const updateResponse = await invokeApp(app, {
      method: "PATCH",
      url: `/api/documents/${encodeURIComponent(createdDocumentId)}`,
      headers: {
        "content-type": "application/json",
      },
      body: {
        ifVersion: 1,
        title: "새 개인 노트 v2",
        bodyMarkdown: "## Draft\n\n두 번째 버전",
        assetRefs: [assetResponse.body.assetId],
        workspacePath: {
          segments: ["projects", "archive"],
        },
      },
    })
    assert.equal(updateResponse.status, 200)
    assert.equal(updateResponse.body.item.metadata.version, 2)
    assert.deepEqual(updateResponse.body.item.metadata.assetRefs, [
      assetResponse.body.assetId,
    ])
    assert.deepEqual(updateResponse.body.item.workspacePath.segments, [
      "projects",
      "archive",
    ])

    const detailAfterUpdate = await invokeApp(app, {
      url: `/api/documents/${encodeURIComponent(createdDocumentId)}`,
    })
    assert.equal(detailAfterUpdate.body.item.surface.title, "새 개인 노트 v2")
    assert.equal(detailAfterUpdate.body.item.metadata.version, 2)
    assert.deepEqual(detailAfterUpdate.body.item.workspacePath.segments, [
      "projects",
      "archive",
    ])

    const workspaceAfterUpdate = await invokeApp(app, {
      url: "/api/workspace",
    })
    const updatedProjectsFolder = workspaceAfterUpdate.body.navigation.sections[1].tree.find(
      (node) => node.kind === "folder" && node.label === "projects",
    )
    assert.ok(updatedProjectsFolder)
    assert.equal(updatedProjectsFolder.children[0].kind, "document")
    assert.equal(
      updatedProjectsFolder.children[0].label,
      "새 개인 노트 v2",
    )

    const deleteResponse = await invokeApp(app, {
      method: "DELETE",
      url: `/api/documents/${encodeURIComponent(createdDocumentId)}`,
      headers: {
        "content-type": "application/json",
      },
      body: {
        ifVersion: 2,
      },
    })
    assert.equal(deleteResponse.status, 200)
    assert.equal(deleteResponse.body.status, "deleted")

    const workspaceAfterDelete = await invokeApp(app, {
      url: "/api/workspace",
    })
    assert.equal(
      workspaceAfterDelete.body.navigation.sections[1].items.some(
        (item) => item.objectRef.objectId === createdDocumentId,
      ),
      false,
    )
  })
})

test("POST /api/assets validates required registration fields", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/assets",
      headers: {
        "content-type": "application/json",
      },
      body: {
        filename: "resume_v4.pdf",
      },
    })

    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, "validation_failed")
    assert.equal(
      response.body.error.message,
      "`filename` and `mediaType` are required.",
    )
  })
})

test("POST /api/assets generates a storage ref when omitted", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/assets",
      headers: {
        "content-type": "application/json",
      },
      body: {
        filename: "Resume_v4.pdf",
        mediaType: "application/pdf",
      },
    })

    assert.equal(response.status, 201)
    assert.match(response.body.storageRef, /^personal-assets\/resume-v4-[a-f0-9]{8}$/)
    assert.match(response.body.assetId, /^passet_mock_/)
  })
})

test("PATCH and DELETE /api/documents/:documentId reject stale personal document versions", async () => {
  await withApp(async (app) => {
    const createResponse = await invokeApp(app, {
      method: "POST",
      url: "/api/documents",
      headers: {
        "content-type": "application/json",
      },
      body: {
        layer: "personal_raw",
        title: "버전 확인용 노트",
        bodyMarkdown: "v1",
      },
    })
    const documentId = createResponse.body.item.documentRef.objectId

    const staleUpdate = await invokeApp(app, {
      method: "PATCH",
      url: `/api/documents/${encodeURIComponent(documentId)}`,
      headers: {
        "content-type": "application/json",
      },
      body: {
        ifVersion: 99,
        bodyMarkdown: "stale update",
      },
    })

    assert.equal(staleUpdate.status, 409)
    assert.equal(staleUpdate.body.error.code, "conflict")
    assert.equal(staleUpdate.body.error.message, "Personal document version mismatch.")
    assert.deepEqual(staleUpdate.body.error.details, {
      resource: "personal_document",
      documentId,
      expectedVersion: 99,
      currentVersion: 1,
    })

    const staleDelete = await invokeApp(app, {
      method: "DELETE",
      url: `/api/documents/${encodeURIComponent(documentId)}`,
      headers: {
        "content-type": "application/json",
      },
      body: {
        ifVersion: 77,
      },
    })

    assert.equal(staleDelete.status, 409)
    assert.equal(staleDelete.body.error.code, "conflict")
    assert.equal(staleDelete.body.error.message, "Personal document version mismatch.")
    assert.deepEqual(staleDelete.body.error.details, {
      resource: "personal_document",
      documentId,
      expectedVersion: 77,
      currentVersion: 1,
    })
  })
})

test("personal raw-to-wiki generation and wiki link actions stay within the personal layer", async () => {
  await withApp(async (app) => {
    const createRawResponse = await invokeApp(app, {
      method: "POST",
      url: "/api/documents",
      headers: {
        "content-type": "application/json",
      },
      body: {
        layer: "personal_raw",
        title: "Research draft",
        bodyMarkdown: "# Research draft\n\nShared notes reorganized for personal prep.",
      },
    })
    const rawDocumentId = createRawResponse.body.item.documentRef.objectId

    const summarizeResponse = await invokeApp(app, {
      method: "POST",
      url: `/api/documents/${encodeURIComponent(rawDocumentId)}/summarize`,
      headers: {
        "content-type": "application/json",
      },
      body: {},
    })

    assert.equal(summarizeResponse.status, 200)
    assert.equal(summarizeResponse.body.operation, "summarize")
    const wikiDocumentId = summarizeResponse.body.item.documentRef.objectId
    assert.match(wikiDocumentId, /^personal_wiki:/)
    assert.equal(summarizeResponse.body.item.metadata.generation.operation, "summarize")
    assert.equal(summarizeResponse.body.item.metadata.generation.provider, "mock")
    assert.ok(Array.isArray(summarizeResponse.body.item.metadata.generation.trace))
    assert.ok(
      !summarizeResponse.body.item.surface.bodyMarkdown.includes("generatedAt="),
      "final body should not contain generation trace details",
    )

    const workspaceAfterGeneration = await invokeApp(app, {
      url: "/api/workspace",
    })
    assert.equal(
      workspaceAfterGeneration.body.navigation.sections[2].items.some(
        (item) => item.objectRef.objectId === wikiDocumentId,
      ),
      true,
    )

    const suggestResponse = await invokeApp(app, {
      method: "POST",
      url: `/api/documents/${encodeURIComponent(wikiDocumentId)}/suggest-links`,
      headers: {
        "content-type": "application/json",
      },
      body: {
        maxSuggestions: 2,
      },
    })
    assert.equal(suggestResponse.status, 200)
    assert.equal(suggestResponse.body.suggestions.length, 2)

    const wikiDetail = await invokeApp(app, {
      url: `/api/documents/${encodeURIComponent(wikiDocumentId)}`,
    })
    const wikiVersionBeforeAttach = wikiDetail.body.item.metadata.version

    const attachResponse = await invokeApp(app, {
      method: "POST",
      url: `/api/documents/${encodeURIComponent(wikiDocumentId)}/attach-links`,
      headers: {
        "content-type": "application/json",
      },
      body: {
        wikiDocumentVersion: wikiVersionBeforeAttach,
        attachments: suggestResponse.body.suggestions.map((item) => ({
          layer: item.layer,
          id: item.id,
        })),
      },
    })
    assert.equal(attachResponse.status, 200)
    assert.equal(attachResponse.body.attached.length, 2)

    const wikiDetailAfterAttach = await invokeApp(app, {
      url: `/api/documents/${encodeURIComponent(wikiDocumentId)}`,
    })
    assert.equal(
      wikiDetailAfterAttach.body.item.metadata.version,
      wikiVersionBeforeAttach + 1,
    )
  })
})

test("POST /api/documents/:documentId/rewrite and /structure each generate personal/wiki outputs", async () => {
  await withApp(async (app) => {
    const createRawResponse = await invokeApp(app, {
      method: "POST",
      url: "/api/documents",
      headers: {
        "content-type": "application/json",
      },
      body: {
        layer: "personal_raw",
        title: "Generation source",
        bodyMarkdown: "# Source\n\nRewrite and structure checks.",
      },
    })
    const rawDocumentId = createRawResponse.body.item.documentRef.objectId

    const rewriteResponse = await invokeApp(app, {
      method: "POST",
      url: `/api/documents/${encodeURIComponent(rawDocumentId)}/rewrite`,
      headers: {
        "content-type": "application/json",
      },
      body: {},
    })
    const structureResponse = await invokeApp(app, {
      method: "POST",
      url: `/api/documents/${encodeURIComponent(rawDocumentId)}/structure`,
      headers: {
        "content-type": "application/json",
      },
      body: {},
    })

    assert.equal(rewriteResponse.status, 200)
    assert.equal(rewriteResponse.body.operation, "rewrite")
    assert.match(rewriteResponse.body.item.documentRef.objectId, /^personal_wiki:/)

    assert.equal(structureResponse.status, 200)
    assert.equal(structureResponse.body.operation, "structure")
    assert.match(structureResponse.body.item.documentRef.objectId, /^personal_wiki:/)
  })
})

test("POST /api/documents/:documentId/suggest-links and /attach-links validate request bodies", async () => {
  await withApp(async (app) => {
    const suggestResponse = await invokeApp(app, {
      method: "POST",
      url: "/api/documents/personal_wiki%3Apersonal%3Abackend-application-strategy/suggest-links",
      headers: {
        "content-type": "application/json",
      },
      body: {
        maxSuggestions: 0,
      },
    })

    assert.equal(suggestResponse.status, 400)
    assert.equal(suggestResponse.body.error.code, "validation_failed")
    assert.equal(
      suggestResponse.body.error.message,
      "`maxSuggestions` must be a positive integer.",
    )

    const attachResponse = await invokeApp(app, {
      method: "POST",
      url: "/api/documents/personal_wiki%3Apersonal%3Abackend-application-strategy/attach-links",
      headers: {
        "content-type": "application/json",
      },
      body: {
        wikiDocumentVersion: 1,
        attachments: [],
      },
    })

    assert.equal(attachResponse.status, 400)
    assert.equal(attachResponse.body.error.code, "validation_failed")
    assert.equal(
      attachResponse.body.error.message,
      "`attachments` must include at least one link target.",
    )
  })
})

test("POST /api/documents/:documentId/attach-links rejects stale personal/wiki versions", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/documents/personal_wiki%3Apersonal%3Abackend-application-strategy/attach-links",
      headers: {
        "content-type": "application/json",
      },
      body: {
        wikiDocumentVersion: 999,
        attachments: [
          {
            layer: "fact",
            id: "fact:job:1",
          },
        ],
      },
    })

    assert.equal(response.status, 409)
    assert.equal(response.body.error.code, "conflict")
    assert.equal(response.body.error.message, "Personal wiki document version mismatch.")
    assert.equal(response.body.error.details.resource, "personal_wiki_document")
    assert.equal(
      response.body.error.details.documentId,
      "personal_wiki:personal:backend-application-strategy",
    )
    assert.equal(response.body.error.details.expectedVersion, 999)
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
      refreshScopes: ["workspace_summary"],
    })
    assert.deepEqual(response.body.projections, [
      {
        projection: "workspace_summary",
        visibility: "pending",
      },
    ])
  })
})

test("GET /api/workspace/sync exposes projection-local partial visibility from command status", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/workspace/sync?commandId=mock-command-partial-worknet.recruiting",
    })

    assert.equal(response.status, 200)
    assert.deepEqual(response.body.command, {
      commandId: "mock-command-partial-worknet.recruiting",
      status: "succeeded",
      outcome: "partially_applied",
      refreshScopes: ["workspace_summary", "calendar"],
    })
    assert.deepEqual(response.body.projections, [
      {
        projection: "workspace_summary",
        visibility: "applied",
      },
      {
        projection: "calendar",
        visibility: "pending",
      },
    ])
  })
})

test("GET /api/workspace/sync returns retryable command failures in a normalized shape", async () => {
  await withApp(async (app) => {
    const response = await invokeApp(app, {
      url: "/api/workspace/sync?commandId=mock-command-failed-worknet.recruiting",
    })

    assert.equal(response.status, 200)
    assert.deepEqual(response.body.command, {
      commandId: "mock-command-failed-worknet.recruiting",
      status: "failed",
      outcome: "failed",
      refreshScopes: ["workspace_summary"],
      error: {
        code: "temporarily_unavailable",
        message: "The downstream ingestion queue is temporarily unavailable.",
        retryable: true,
      },
    })
    assert.deepEqual(response.body.projections, [
      {
        projection: "workspace_summary",
        visibility: "stale",
        refreshRecommended: true,
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

test("real document detail mode returns normalized temporary unavailability errors", async () => {
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
        url: "/api/documents/personal_raw%3Apersonal%3Aresume-v3",
      })

      assert.equal(response.status, 503)
      assert.equal(response.body.error.code, "temporarily_unavailable")
      assert.equal(response.body.error.details.adapter, "stratawiki_personal_knowledge")
    },
  )
})
