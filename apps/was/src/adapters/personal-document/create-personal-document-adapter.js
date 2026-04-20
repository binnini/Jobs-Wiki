import { createValidationError } from "../../http/errors.js"
import { createMockPersonalDocumentAdapter } from "./mock-personal-document-adapter.js"
import { createStratawikiPersonalDocumentAdapter } from "./stratawiki-personal-document-adapter.js"

export function createPersonalDocumentAdapter({
  mode = "mock",
  env,
  readAuthority,
} = {}) {
  if (mode === "mock") {
    return createMockPersonalDocumentAdapter({
      readAuthority,
    })
  }

  if (mode === "real") {
    return createStratawikiPersonalDocumentAdapter({ env })
  }

  throw createValidationError("Unsupported WAS data mode.", {
    mode,
  })
}
