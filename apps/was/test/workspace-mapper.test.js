import test from "node:test"
import assert from "node:assert/strict"
import { mapWorkspace } from "../src/mappers/workspace-mapper.js"

test("mapWorkspace keeps layered navigation items and active projection", () => {
  const result = mapWorkspace({
    sections: [
      {
        sectionId: "shared",
        label: "shared",
        items: [
          {
            objectId: "report:baseline",
            objectKind: "report",
            title: "기본 리포트",
            kind: "report",
            layer: "shared",
            path: "/workspace",
            active: true,
            workspacePath: {
              sectionId: "shared",
              nodeType: "special_view",
              segments: ["workspace"],
              label: "기본 리포트",
            },
          },
        ],
      },
      {
        sectionId: "personal_raw",
        label: "personal/raw",
        items: [
          {
            objectId: "personal_raw:personal:resume-v3",
            objectKind: "document",
            title: "이력서_v3 작업본",
            kind: "document",
            layer: "personal_raw",
            path: "/documents/personal_raw%3Apersonal%3Aresume-v3",
            workspacePath: {
              sectionId: "personal_raw",
              nodeType: "document",
              segments: ["inbox", "resume-v3"],
              label: "이력서_v3 작업본",
            },
          },
        ],
      },
    ],
    activeProjection: {
      projection: "report",
      objectId: "report:baseline",
    },
    sync: {
      visibility: "applied",
      version: "workspace-v1",
      visibleAt: "2026-04-20T00:00:00.000Z",
    },
  })

  assert.equal(result.projection, "workspace")
  assert.equal(result.sync.projection, "workspace")
  assert.deepEqual(result.navigation.sections[0].items[0], {
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
  })
  assert.equal(result.navigation.sections[1].tree[0].kind, "folder")
  assert.equal(result.navigation.sections[1].tree[0].children[0].kind, "document")
  assert.deepEqual(result.activeProjection, {
    projection: "report",
    objectRef: {
      objectId: "report:baseline",
      objectKind: "report",
      title: "기본 리포트",
    },
  })
})

test("mapWorkspace sorts personal tree nodes predictably after path changes", () => {
  const result = mapWorkspace({
    sections: [
      {
        sectionId: "personal_raw",
        label: "personal/raw",
        items: [
          {
            objectId: "personal_raw:pdoc_z",
            objectKind: "document",
            title: "zeta",
            kind: "document",
            layer: "personal_raw",
            path: "/documents/personal_raw%3Apdoc_z",
            workspacePath: {
              sectionId: "personal_raw",
              nodeType: "document",
              segments: ["projects", "zeta"],
              label: "zeta",
            },
          },
          {
            objectId: "personal_raw:pdoc_alpha",
            objectKind: "document",
            title: "alpha",
            kind: "document",
            layer: "personal_raw",
            path: "/documents/personal_raw%3Apdoc_alpha",
            workspacePath: {
              sectionId: "personal_raw",
              nodeType: "document",
              segments: ["projects", "alpha"],
              label: "alpha",
            },
          },
          {
            objectId: "personal_raw:pdoc_resume",
            objectKind: "document",
            title: "resume",
            kind: "document",
            layer: "personal_raw",
            path: "/documents/personal_raw%3Apdoc_resume",
            workspacePath: {
              sectionId: "personal_raw",
              nodeType: "document",
              segments: ["inbox", "resume"],
              label: "resume",
            },
          },
        ],
      },
    ],
  })

  const rawTree = result.navigation.sections[0].tree

  assert.equal(rawTree[0].label, "inbox")
  assert.equal(rawTree[1].label, "projects")
  assert.deepEqual(
    rawTree[1].children.map((child) => child.label),
    ["alpha", "zeta"],
  )
})
