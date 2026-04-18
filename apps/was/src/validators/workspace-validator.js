import { createValidationError } from "../http/errors.js"

export function validateAskWorkspaceRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("Ask request body must be a JSON object.")
  }

  const question =
    typeof value.question === "string" ? value.question.trim() : undefined

  if (!question) {
    throw createValidationError("`question` is required.")
  }

  if (
    value.opportunityId !== undefined &&
    (typeof value.opportunityId !== "string" || value.opportunityId.trim() === "")
  ) {
    throw createValidationError("`opportunityId` must be a non-empty string.")
  }

  if (value.save !== undefined && typeof value.save !== "boolean") {
    throw createValidationError("`save` must be a boolean when provided.")
  }

  return {
    question,
    opportunityId: value.opportunityId?.trim(),
    save: value.save,
  }
}
