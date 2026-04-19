import { createValidationError } from "../http/errors.js"

function createFieldValidationError(message, field) {
  return createValidationError(message, { field })
}

export function validateWorknetSourceId(sourceId) {
  if (typeof sourceId !== "string" || sourceId.trim() === "") {
    throw createFieldValidationError("`sourceId` path parameter is required.", "sourceId")
  }

  return sourceId.trim()
}
