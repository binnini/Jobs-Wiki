import { createNotFoundError } from "../../http/errors.js"
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

export function createMockReadAuthorityAdapter() {
  return {
    async getWorkspace() {
      return clone(workspaceFixture)
    },

    async getWorkspaceSummary() {
      return clone(workspaceSummaryFixture)
    },

    async getDocumentDetail({ documentId }) {
      const record = documentDetailsFixture[documentId]

      if (!record) {
        throw createNotFoundError("document not found", {
          documentId,
        })
      }

      return clone(record)
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
  }
}
