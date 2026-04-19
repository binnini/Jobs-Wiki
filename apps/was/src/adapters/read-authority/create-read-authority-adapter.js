import { createValidationError } from "../../http/errors.js"
import { createMockReadAuthorityAdapter } from "./mock-read-authority-adapter.js"
import { createStratawikiReadAuthorityAdapter } from "./stratawiki-read-authority-adapter.js"

export function createReadAuthorityAdapter({ mode = "mock", env } = {}) {
  if (mode === "mock") {
    return createMockReadAuthorityAdapter()
  }

  if (mode === "real") {
    return createStratawikiReadAuthorityAdapter({ env })
  }

  throw createValidationError("Unsupported WAS data mode.", {
    mode,
  })
}
