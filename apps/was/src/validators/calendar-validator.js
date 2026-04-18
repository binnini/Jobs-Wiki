import { createValidationError } from "../http/errors.js"

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseOptionalTrimmedString(searchParams, fieldName) {
  const value = searchParams.get(fieldName)

  if (value === null) {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue === "" ? undefined : trimmedValue
}

function isValidDateOnly(value) {
  const [year, month, day] = value.split("-").map(Number)
  const normalized = new Date(Date.UTC(year, month - 1, day))

  return (
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day
  )
}

function validateOptionalDate(value, fieldName) {
  if (value === undefined) {
    return undefined
  }

  if (!DATE_ONLY_PATTERN.test(value) || !isValidDateOnly(value)) {
    throw createValidationError(`\`${fieldName}\` must use YYYY-MM-DD format.`)
  }

  return value
}

export function validateCalendarQuery(searchParams) {
  const from = validateOptionalDate(
    parseOptionalTrimmedString(searchParams, "from"),
    "from",
  )
  const to = validateOptionalDate(parseOptionalTrimmedString(searchParams, "to"), "to")

  if (from && to && from > to) {
    throw createValidationError("`from` must be earlier than or equal to `to`.")
  }

  return {
    from,
    to,
  }
}
