import test from "node:test"
import assert from "node:assert/strict"
import { mapDocumentDetail } from "../src/mappers/document-detail-mapper.js"

test("mapDocumentDetail preserves layer and writable affordance", () => {
  const result = mapDocumentDetail({
    documentId: "personal_raw:personal:resume-v3",
    title: "이력서_v3 작업본",
    layer: "personal_raw",
    writable: true,
    bodyMarkdown: "## Resume",
    summary: "raw document",
    metadata: {
      source: {
        provider: "upload",
        sourceId: "resume-v3.pdf",
      },
      updatedAt: "2026-04-20T03:30:00.000Z",
      tags: ["personal", "raw"],
    },
    relatedObjects: [
      {
        objectId: "opportunity:backend_platform",
        objectKind: "opportunity",
        title: "Backend Platform Engineer",
      },
    ],
    sync: {
      visibility: "applied",
      version: "doc-v1",
      visibleAt: "2026-04-20T03:30:00.000Z",
    },
  })

  assert.equal(result.projection, "document")
  assert.equal(result.item.layer, "personal_raw")
  assert.equal(result.item.writable, true)
  assert.equal(result.item.surface.title, "이력서_v3 작업본")
  assert.equal(result.item.metadata.source.provider, "upload")
  assert.deepEqual(result.item.relatedObjects, [
    {
      objectId: "opportunity:backend_platform",
      objectKind: "opportunity",
      title: "Backend Platform Engineer",
    },
  ])
})
