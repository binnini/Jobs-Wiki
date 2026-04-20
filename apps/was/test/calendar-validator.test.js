import test from "node:test"
import assert from "node:assert/strict"
import { validateCalendarQuery } from "../src/validators/calendar-validator.js"

function createSearchParams(queryString = "") {
  return new URLSearchParams(queryString)
}

test("validateCalendarQuery normalizes blank optional filters", () => {
  const result = validateCalendarQuery(createSearchParams("from=%20%20&to=%20%20"))

  assert.deepEqual(result, {
    from: undefined,
    to: undefined,
  })
})

test("validateCalendarQuery rejects impossible dates", () => {
  assert.throws(
    () => validateCalendarQuery(createSearchParams("from=2026-02-30")),
    (error) =>
      error.code === "validation_failed" &&
      error.message === "`from` must use YYYY-MM-DD format.",
  )
})

test("validateCalendarQuery rejects reversed ranges", () => {
  assert.throws(
    () => validateCalendarQuery(createSearchParams("from=2026-05-31&to=2026-04-18")),
    (error) =>
      error.code === "validation_failed" &&
      error.message === "`from` must be earlier than or equal to `to`.",
  )
})
