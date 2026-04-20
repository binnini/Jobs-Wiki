import test from "node:test"
import assert from "node:assert/strict"
import { validateDocumentId } from "../src/validators/document-validator.js"

test("validateDocumentId trims surrounding whitespace", () => {
  assert.equal(
    validateDocumentId("  personal_raw:personal:resume-v3  "),
    "personal_raw:personal:resume-v3",
  )
})

test("validateDocumentId rejects blank values", () => {
  assert.throws(
    () => validateDocumentId("   "),
    (error) =>
      error.code === "validation_failed" &&
      error.message === "`documentId` path parameter is required.",
  )
})
