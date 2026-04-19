import { createValidationError } from "../../http/errors.js"
import { createMockCommandFacadeAdapter } from "./mock-command-facade-adapter.js"
import { createStratawikiCommandFacadeAdapter } from "./stratawiki-command-facade-adapter.js"

export function createCommandFacadeAdapter({ mode = "mock", env } = {}) {
  if (mode === "mock") {
    return createMockCommandFacadeAdapter()
  }

  if (mode === "real") {
    return createStratawikiCommandFacadeAdapter({ env })
  }

  throw createValidationError("Unsupported WAS data mode.", {
    mode,
  })
}
