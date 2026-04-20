import { createConflictError, createNotFoundError } from "../../http/errors.js"
import { calendarFixture } from "../../fixtures/calendar.fixture.js"
import { documentDetailsFixture } from "../../fixtures/document-detail.fixture.js"
import {
  opportunityDetailsFixture,
  opportunityListFixture,
} from "../../fixtures/opportunities.fixture.js"
import { workspaceFixture } from "../../fixtures/workspace.fixture.js"
import { workspaceSummaryFixture } from "../../fixtures/workspace-summary.fixture.js"

function clone(value) {
  return structuredClone(value)
}

function toStartOfDay(value) {
  return Date.parse(`${value}T00:00:00.000Z`)
}

function toEndOfDay(value) {
  return Date.parse(`${value}T23:59:59.999Z`)
}

function formatOpportunityCursor(offset) {
  return `cursor_${String(offset).padStart(3, "0")}`
}

function buildMockState() {
  const workspace = clone(workspaceFixture)
  const documentDetails = clone(documentDetailsFixture)
  const assets = new Map()

  return {
    workspace,
    documentDetails,
    assets,
    nextDocumentSequence: 1,
    nextAssetSequence: 1,
  }
}

function getNowStamp(minutesOffset = 0) {
  return new Date(Date.parse("2026-04-20T06:00:00.000Z") + minutesOffset * 60_000).toISOString()
}

function getPersonalSectionId(layer) {
  return layer === "personal_wiki" ? "personal_wiki" : "personal_raw"
}

function findWorkspaceSection(state, sectionId) {
  return state.workspace.sections.find((section) => section.sectionId === sectionId)
}

function findDocumentRecord(state, documentId) {
  const record = state.documentDetails[documentId]

  if (!record) {
    throw createNotFoundError("document not found", {
      documentId,
    })
  }

  return record
}

function buildWorkspaceNavigationItem(record) {
  return {
    objectId: record.documentId,
    objectKind: "document",
    title: record.title,
    kind: "document",
    layer: record.layer,
    path: `/documents/${encodeURIComponent(record.documentId)}`,
  }
}

function upsertWorkspaceNavigationItem(state, record) {
  const sectionId = getPersonalSectionId(record.layer)
  const section = findWorkspaceSection(state, sectionId)

  if (!section) {
    return
  }

  section.items = (section.items ?? []).filter((item) => item.objectId !== record.documentId)

  if (record.metadata?.status !== "deleted") {
    section.items.unshift(buildWorkspaceNavigationItem(record))
  }
}

function removeWorkspaceNavigationItem(state, documentId) {
  for (const section of state.workspace.sections) {
    section.items = (section.items ?? []).filter((item) => item.objectId !== documentId)
  }
}

function createMockDocumentRecord({
  documentId,
  layer,
  title,
  bodyMarkdown = "",
  assetRefs = [],
  version = 1,
  status = "active",
  updatedAt,
  sourceProvider,
  sourceId,
  tags,
  relatedObjects = [],
}) {
  const normalizedTags =
    tags ?? ["personal", layer === "personal_wiki" ? "wiki" : "raw"]

  return {
    documentId,
    title,
    layer,
    writable: true,
    bodyMarkdown,
    summary: bodyMarkdown.slice(0, 140) || `${title} 문서입니다.`,
    metadata: {
      source: {
        provider:
          sourceProvider ??
          (assetRefs.length ? "stratawiki_personal_asset" : "stratawiki_personal"),
        sourceId: sourceId ?? documentId,
        fetchedAt: updatedAt,
      },
      updatedAt,
      tags: normalizedTags,
      version,
      assetRefs,
      status,
    },
    relatedObjects,
    sync: {
      visibility: "applied",
      version: "mock-v1",
      visibleAt: updatedAt,
    },
  }
}

function buildGenerationBody(operation, sourceRecord) {
  const label =
    operation === "summarize"
      ? "요약"
      : operation === "rewrite"
        ? "재작성"
        : "구조화"
  return `# ${sourceRecord.title} ${label}\n\n${sourceRecord.summary}\n\n이 문서는 personal/raw 소스를 바탕으로 personal/wiki에 생성되었습니다.`
}

function buildGenerationTitle(operation, sourceTitle) {
  if (operation === "summarize") {
    return `${sourceTitle} 요약`
  }

  if (operation === "rewrite") {
    return `${sourceTitle} 재작성 노트`
  }

  return `${sourceTitle} 구조화 노트`
}

export function createMockReadAuthorityAdapter() {
  const state = buildMockState()

  return {
    async getWorkspace() {
      return clone(state.workspace)
    },

    async getWorkspaceSummary() {
      return clone(workspaceSummaryFixture)
    },

    async getDocumentDetail({ documentId }) {
      return clone(findDocumentRecord(state, documentId))
    },

    async listOpportunities({ query } = {}) {
      const filteredItems = opportunityListFixture.filter((item) => {
        if (query?.status && item.status !== query.status) {
          return false
        }

        if (
          query?.closingWithinDays !== undefined &&
          (item.closingInDays === undefined ||
            item.closingInDays > query.closingWithinDays)
        ) {
          return false
        }

        return true
      })
      const startIndex = query?.cursorOffset ?? 0
      const limit = query?.limit ?? filteredItems.length
      const items = filteredItems.slice(startIndex, startIndex + limit)
      const nextOffset = startIndex + items.length

      return clone({
        items,
        nextCursor:
          nextOffset < filteredItems.length
            ? formatOpportunityCursor(nextOffset)
            : undefined,
        sync: {
          visibility: "applied",
          version: "mock-v1",
          visibleAt: "2026-04-18T09:00:00.000Z",
        },
      })
    },

    async getOpportunityDetail({ opportunityId }) {
      const record = opportunityDetailsFixture[opportunityId]

      if (!record) {
        throw createNotFoundError("opportunity not found", {
          opportunityId,
        })
      }

      return clone(record)
    },

    async getCalendar({ query } = {}) {
      const filteredItems = calendarFixture.items.filter((item) => {
        const startsAt = Date.parse(item.startsAt)

        if (query?.from && startsAt < toStartOfDay(query.from)) {
          return false
        }

        if (query?.to && startsAt > toEndOfDay(query.to)) {
          return false
        }

        return true
      })
      filteredItems.sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))

      return clone({
        ...calendarFixture,
        items: filteredItems,
      })
    },

    async createPersonalDocumentRecord({ input }) {
      const layer = input.subspace === "wiki" ? "personal_wiki" : "personal_raw"
      const recordId = `pdoc_mock_${String(state.nextDocumentSequence).padStart(3, "0")}`
      state.nextDocumentSequence += 1
      const documentId = `${layer}:${recordId}`
      const updatedAt = "2026-04-20T06:00:00.000Z"
      const record = createMockDocumentRecord({
        documentId,
        layer,
        title: input.title,
        bodyMarkdown: input.bodyMarkdown ?? "",
        assetRefs: input.assetRefs ?? [],
        updatedAt,
      })

      state.documentDetails[documentId] = record
      upsertWorkspaceNavigationItem(state, record)

      return {
        document_id: recordId,
        subspace: input.subspace,
        title: record.title,
        body_markdown: record.bodyMarkdown,
        asset_refs: record.metadata.assetRefs,
        version: record.metadata.version,
        status: record.metadata.status,
        updated_at: updatedAt,
        created_at: updatedAt,
      }
    },

    async updatePersonalDocumentRecord({ documentId, input }) {
      const existing = findDocumentRecord(state, documentId)

      if (input.ifVersion !== existing.metadata?.version) {
        throw createConflictError("Personal document version mismatch.", {
          resource: "personal_document",
          documentId,
          expectedVersion: input.ifVersion,
          currentVersion: existing.metadata?.version,
        })
      }

      existing.title = input.title ?? existing.title
      existing.bodyMarkdown = input.bodyMarkdown ?? existing.bodyMarkdown
      existing.summary = existing.bodyMarkdown.slice(0, 140) || existing.summary
      existing.metadata.version += 1
      existing.metadata.updatedAt = "2026-04-20T06:05:00.000Z"
      existing.metadata.status = existing.metadata.status ?? "active"

      if (input.assetRefs !== undefined) {
        existing.metadata.assetRefs = input.assetRefs
        existing.metadata.source.provider = input.assetRefs.length
          ? "stratawiki_personal_asset"
          : "stratawiki_personal"
      }

      upsertWorkspaceNavigationItem(state, existing)

      return {
        document_id: documentId.split(":").slice(1).join(":"),
        subspace: existing.layer === "personal_wiki" ? "wiki" : "raw",
        title: existing.title,
        body_markdown: existing.bodyMarkdown,
        asset_refs: existing.metadata.assetRefs ?? [],
        version: existing.metadata.version,
        status: existing.metadata.status,
        updated_at: existing.metadata.updatedAt,
      }
    },

    async deletePersonalDocumentRecord({ documentId, input }) {
      const existing = findDocumentRecord(state, documentId)

      if (input.ifVersion !== existing.metadata?.version) {
        throw createConflictError("Personal document version mismatch.", {
          resource: "personal_document",
          documentId,
          expectedVersion: input.ifVersion,
          currentVersion: existing.metadata?.version,
        })
      }

      existing.metadata.version += 1
      existing.metadata.status = "deleted"
      existing.metadata.updatedAt = "2026-04-20T06:10:00.000Z"
      existing.writable = false
      removeWorkspaceNavigationItem(state, documentId)

      return {
        document_id: documentId.split(":").slice(1).join(":"),
        subspace: existing.layer === "personal_wiki" ? "wiki" : "raw",
        version: existing.metadata.version,
        status: existing.metadata.status,
        updated_at: existing.metadata.updatedAt,
      }
    },

    async registerPersonalAssetRecord({ input }) {
      const existing = state.assets.get(input.storageRef)

      if (existing) {
        throw createConflictError(
          "Personal asset is already registered for this user scope.",
          {
            assetId: existing.asset_id,
          },
        )
      }

      const asset = {
        asset_id: `passet_mock_${String(state.nextAssetSequence).padStart(3, "0")}`,
        filename: input.filename,
        media_type: input.mediaType,
        asset_kind: input.assetKind,
        storage_ref: input.storageRef,
        status: "active",
      }
      state.nextAssetSequence += 1
      state.assets.set(input.storageRef, asset)

      return clone(asset)
    },

    async generatePersonalWikiDocumentRecord({ documentId, input }) {
      const sourceRecord = findDocumentRecord(state, documentId)
      const recordId = `pwiki_mock_${String(state.nextDocumentSequence).padStart(3, "0")}`
      state.nextDocumentSequence += 1
      const generatedDocumentId = `personal_wiki:${recordId}`
      const updatedAt = getNowStamp(15)
      const record = createMockDocumentRecord({
        documentId: generatedDocumentId,
        layer: "personal_wiki",
        title: buildGenerationTitle(input.operation, sourceRecord.title),
        bodyMarkdown: buildGenerationBody(input.operation, sourceRecord),
        assetRefs: sourceRecord.metadata?.assetRefs ?? [],
        updatedAt,
        sourceProvider: "jobs_wiki_generation",
        sourceId: generatedDocumentId,
        tags: ["personal", "wiki", input.operation],
      })

      state.documentDetails[generatedDocumentId] = record
      upsertWorkspaceNavigationItem(state, record)

      return {
        document_id: recordId,
        subspace: "wiki",
        kind: input.operation === "summarize" ? "wiki_summary" : "wiki_note",
        version: 1,
        title: record.title,
        body_markdown: record.bodyMarkdown,
        source_document_ref: {
          document_id: documentId.split(":").slice(1).join(":"),
          subspace: "raw",
          version: sourceRecord.metadata?.version ?? 1,
          kind: "raw_document",
          asset_refs: sourceRecord.metadata?.assetRefs ?? [],
        },
        asset_refs: sourceRecord.metadata?.assetRefs ?? [],
        anchors: [],
        updated_at: updatedAt,
        created_at: updatedAt,
        status: "active",
      }
    },

    async suggestPersonalWikiLinksRecord({ documentId, input }) {
      const wikiRecord = findDocumentRecord(state, documentId)
      return {
        status: "ok",
        wiki_document_id: documentId.split(":").slice(1).join(":"),
        wiki_document_version: wikiRecord.metadata?.version ?? 1,
        suggestions: [
          {
            layer: "fact",
            id: "fact:job:1",
            reason: "preserved from the raw source document",
            confidence: 0.98,
          },
          {
            layer: "interpretation",
            id: "interp:published:1",
            reason: "matches the wiki summary language",
            confidence: 0.91,
          },
        ].slice(0, input.maxSuggestions ?? 10),
      }
    },

    async attachPersonalWikiLinksRecord({ documentId, input }) {
      const wikiRecord = findDocumentRecord(state, documentId)

      if (input.wikiDocumentVersion !== wikiRecord.metadata?.version) {
        throw createConflictError("Personal wiki document version mismatch.", {
          resource: "personal_wiki_document",
          documentId,
          expectedVersion: input.wikiDocumentVersion,
          currentVersion: wikiRecord.metadata?.version,
        })
      }

      wikiRecord.metadata.version += 1
      wikiRecord.metadata.updatedAt = getNowStamp(20)
      wikiRecord.relatedObjects = (input.attachments ?? []).map((attachment) => ({
        objectId: attachment.id,
        objectKind: attachment.layer === "fact" ? "fact" : "document",
        title: attachment.id,
      }))

      return {
        status: "ok",
        wiki_document_id: documentId.split(":").slice(1).join(":"),
        wiki_document_version: wikiRecord.metadata.version,
        attached: input.attachments ?? [],
      }
    },
  }
}
