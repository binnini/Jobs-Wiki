import { createValidationError } from "../http/errors.js"

function createFieldValidationError(message, field) {
  return createValidationError(message, { field })
}

export function validateAskWorkspaceRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createFieldValidationError("ask request body must be a JSON object", "body")
  }

  if (typeof value.question !== "string") {
    throw createFieldValidationError("question is required", "question")
  }

  const question = value.question.trim()

  if (!question) {
    throw createFieldValidationError("question is required", "question")
  }

  if (value.opportunityId !== undefined && typeof value.opportunityId !== "string") {
    throw createFieldValidationError(
      "opportunityId must be a string when provided",
      "opportunityId",
    )
  }

  if (value.documentId !== undefined && typeof value.documentId !== "string") {
    throw createFieldValidationError(
      "documentId must be a string when provided",
      "documentId",
    )
  }

  if (value.save !== undefined && typeof value.save !== "boolean") {
    throw createFieldValidationError("save must be a boolean when provided", "save")
  }

  const opportunityId = value.opportunityId?.trim() || undefined
  const documentId = value.documentId?.trim() || undefined

  return {
    question,
    opportunityId,
    documentId,
    save: value.save,
  }
}

export function validateWorkspaceSyncQuery(searchParams) {
  const commandId = searchParams.get("commandId")?.trim() || undefined

  return {
    commandId,
  }
}
