import { createValidationError } from "../../http/errors.js"
import { createMockReadAuthorityAdapter } from "./mock-read-authority-adapter.js"
import { createStratawikiReadAuthorityAdapter } from "./stratawiki-read-authority-adapter.js"

export function createReadAuthorityAdapter({ mode = "mock" } = {}) {
  if (mode === "mock") {
    return createMockReadAuthorityAdapter()
  }

  if (mode === "real") {
    return createStratawikiReadAuthorityAdapter()
  }

  throw createValidationError("Unsupported WAS data mode.", {
    mode,
  })
}
