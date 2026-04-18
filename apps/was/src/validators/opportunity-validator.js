import { createValidationError } from "../http/errors.js"

const VALID_STATUSES = new Set(["open", "closing_soon", "closed", "unknown"])
const CURSOR_PATTERN = /^cursor_(\d+)$/

function parseOptionalTrimmedString(searchParams, fieldName) {
  const value = searchParams.get(fieldName)

  if (value === null) {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue === "" ? undefined : trimmedValue
}

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

function parseOptionalCursor(searchParams) {
  const cursor = parseOptionalTrimmedString(searchParams, "cursor")

  if (!cursor) {
    return {
      cursor: undefined,
      cursorOffset: undefined,
    }
  }

  const match = cursor.match(CURSOR_PATTERN)

  if (!match) {
    throw createValidationError("`cursor` must use the `cursor_<number>` format.")
  }

  return {
    cursor,
    cursorOffset: Number(match[1]),
  }
}

export function validateOpportunityListQuery(searchParams) {
  const status = parseOptionalTrimmedString(searchParams, "status")

  if (status && !VALID_STATUSES.has(status)) {
    throw createValidationError("`status` must be one of open, closing_soon, closed, unknown.")
  }

  const { cursor, cursorOffset } = parseOptionalCursor(searchParams)

  return {
    cursor,
    cursorOffset,
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
