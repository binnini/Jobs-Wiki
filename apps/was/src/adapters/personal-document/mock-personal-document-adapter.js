import { createConflictError, createNotFoundError, createValidationError } from "../../http/errors.js"

function assertMockMutationCapability(readAuthority) {
  if (
    !readAuthority ||
    typeof readAuthority.createPersonalDocumentRecord !== "function" ||
    typeof readAuthority.updatePersonalDocumentRecord !== "function" ||
    typeof readAuthority.deletePersonalDocumentRecord !== "function" ||
    typeof readAuthority.registerPersonalAssetRecord !== "function"
  ) {
    throw createValidationError(
      "Mock personal document adapter requires mutable mock read authority support.",
    )
  }
}

export function createMockPersonalDocumentAdapter({ readAuthority } = {}) {
  assertMockMutationCapability(readAuthority)

  return {
    async createPersonalDocument({ userContext, input }) {
      return readAuthority.createPersonalDocumentRecord({
        userContext,
        input,
      })
    },

    async updatePersonalDocument({ userContext, documentId, input }) {
      return readAuthority.updatePersonalDocumentRecord({
        userContext,
        documentId,
        input,
      })
    },

    async deletePersonalDocument({ userContext, documentId, input }) {
      return readAuthority.deletePersonalDocumentRecord({
        userContext,
        documentId,
        input,
      })
    },

    async registerPersonalAsset({ userContext, input }) {
      return readAuthority.registerPersonalAssetRecord({
        userContext,
        input,
      })
    },
  }
}
