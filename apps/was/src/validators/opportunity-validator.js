import { createValidationError } from "../http/errors.js"

const VALID_STATUSES = new Set(["open", "closing_soon", "closed", "unknown"])

function parseOptionalInteger(searchParams, fieldName) {
  const value = searchParams.get(fieldName)

  if (value === null) {
    return undefined
  }

  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw createValidationError(`\`${fieldName}\` must be a positive integer.`)
  }

  return parsedValue
}

export function validateOpportunityListQuery(searchParams) {
  const status = searchParams.get("status") ?? undefined

  if (status && !VALID_STATUSES.has(status)) {
    throw createValidationError("`status` must be one of open, closing_soon, closed, unknown.")
  }

  return {
    cursor: searchParams.get("cursor") ?? undefined,
    limit: parseOptionalInteger(searchParams, "limit"),
    status,
    closingWithinDays: parseOptionalInteger(searchParams, "closingWithinDays"),
  }
}

export function validateOpportunityId(opportunityId) {
  if (typeof opportunityId !== "string" || opportunityId.trim() === "") {
    throw createValidationError("`opportunityId` path parameter is required.")
  }

  return opportunityId.trim()
}
