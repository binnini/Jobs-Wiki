import { createNotFoundError } from "../../http/errors.js"
import { calendarFixture } from "../../fixtures/calendar.fixture.js"
import {
  opportunityDetailsFixture,
  opportunityListFixture,
} from "../../fixtures/opportunities.fixture.js"
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

export function createMockReadAuthorityAdapter() {
  return {
    async getWorkspaceSummary() {
      return clone(workspaceSummaryFixture)
    },

    async listOpportunities({ query } = {}) {
      const filteredItems = opportunityListFixture
        .filter((item) => {
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
        .slice(0, query?.limit ?? opportunityListFixture.length)

      return clone({
        items: filteredItems,
        nextCursor:
          query?.limit && filteredItems.length < opportunityListFixture.length
            ? "mock-next-page"
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
        throw createNotFoundError("Opportunity not found.", {
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

      return clone({
        ...calendarFixture,
        items: filteredItems,
      })
    },
  }
}
