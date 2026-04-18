import test from "node:test"
import assert from "node:assert/strict"
import { validateOpportunityListQuery } from "../src/validators/opportunity-validator.js"

function createSearchParams(queryString = "") {
  return new URLSearchParams(queryString)
}

test("validateOpportunityListQuery trims optional string filters and parses cursor offsets", () => {
  const result = validateOpportunityListQuery(
    createSearchParams(
      "cursor=%20cursor_001%20&status=%20open%20&limit=2&closingWithinDays=30",
    ),
  )

  assert.deepEqual(result, {
    cursor: "cursor_001",
    cursorOffset: 1,
    limit: 2,
    status: "open",
    closingWithinDays: 30,
  })
})

test("validateOpportunityListQuery normalizes blank optional string filters", () => {
  const result = validateOpportunityListQuery(
    createSearchParams("cursor=%20%20&status=%20%20"),
  )

  assert.deepEqual(result, {
    cursor: undefined,
    cursorOffset: undefined,
    limit: undefined,
    status: undefined,
    closingWithinDays: undefined,
  })
})

test("validateOpportunityListQuery rejects malformed cursors", () => {
  assert.throws(
    () => validateOpportunityListQuery(createSearchParams("cursor=page-2")),
    (error) =>
      error.code === "validation_failed" &&
      error.message === "`cursor` must use the `cursor_<number>` format.",
  )
})
