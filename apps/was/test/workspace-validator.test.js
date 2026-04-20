import test from "node:test"
import assert from "node:assert/strict"
import { validateAskWorkspaceRequest } from "../src/validators/workspace-validator.js"

test("validateAskWorkspaceRequest trims question and normalizes blank opportunityId", () => {
  const result = validateAskWorkspaceRequest({
    question: "  What should I improve first?  ",
    opportunityId: "   ",
    documentId: "  ",
    save: false,
  })

  assert.deepEqual(result, {
    question: "What should I improve first?",
    opportunityId: undefined,
    documentId: undefined,
    save: false,
  })
})

test("validateAskWorkspaceRequest rejects missing question with field details", () => {
  assert.throws(
    () => validateAskWorkspaceRequest({ save: true }),
    (error) =>
      error.code === "validation_failed" &&
      error.message === "question is required" &&
      error.details?.field === "question",
  )
})

test("validateAskWorkspaceRequest rejects non-string opportunityId", () => {
  assert.throws(
    () =>
      validateAskWorkspaceRequest({
        question: "How does this fit?",
        opportunityId: 123,
      }),
    (error) =>
      error.code === "validation_failed" &&
      error.message === "opportunityId must be a string when provided" &&
      error.details?.field === "opportunityId",
  )
})

test("validateAskWorkspaceRequest rejects non-string documentId", () => {
  assert.throws(
    () =>
      validateAskWorkspaceRequest({
        question: "How does this document fit?",
        documentId: 123,
      }),
    (error) =>
      error.code === "validation_failed" &&
      error.message === "documentId must be a string when provided" &&
      error.details?.field === "documentId",
  )
})

test("validateAskWorkspaceRequest rejects non-boolean save", () => {
  assert.throws(
    () =>
      validateAskWorkspaceRequest({
        question: "How does this fit?",
        save: "yes",
      }),
    (error) =>
      error.code === "validation_failed" &&
      error.message === "save must be a boolean when provided" &&
      error.details?.field === "save",
  )
})
