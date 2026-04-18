import { createValidationError } from "../http/errors.js"

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function validateOptionalDate(value, fieldName) {
  if (value === null) {
    return undefined
  }

  if (!DATE_ONLY_PATTERN.test(value)) {
    throw createValidationError(`\`${fieldName}\` must use YYYY-MM-DD format.`)
  }

  return value
}

export function validateCalendarQuery(searchParams) {
  const from = validateOptionalDate(searchParams.get("from"), "from")
  const to = validateOptionalDate(searchParams.get("to"), "to")

  if (from && to && from > to) {
    throw createValidationError("`from` must be earlier than or equal to `to`.")
  }

  return {
    from,
    to,
  }
}
