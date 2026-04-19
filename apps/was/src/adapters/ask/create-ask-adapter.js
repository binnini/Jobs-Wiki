import { createValidationError } from "../../http/errors.js"
import { createMockAskAdapter } from "./mock-ask-adapter.js"
import { createStratawikiAskAdapter } from "./stratawiki-ask-adapter.js"

export function createAskAdapter({ mode = "mock", env, readAuthority } = {}) {
  if (mode === "mock") {
    return createMockAskAdapter()
  }

  if (mode === "real") {
    return createStratawikiAskAdapter({ env, readAuthority })
  }

  throw createValidationError("Unsupported WAS data mode.", {
    mode,
  })
}
