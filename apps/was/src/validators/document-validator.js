import { createValidationError } from "../http/errors.js"

export function validateDocumentId(documentId) {
  if (typeof documentId !== "string" || documentId.trim() === "") {
    throw createValidationError("`documentId` path parameter is required.")
  }

  return documentId.trim()
}
