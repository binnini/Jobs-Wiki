import { createConflictError, createNotFoundError, createValidationError } from "../../http/errors.js"

function assertMockMutationCapability(readAuthority) {
  if (
    !readAuthority ||
    typeof readAuthority.createPersonalDocumentRecord !== "function" ||
    typeof readAuthority.updatePersonalDocumentRecord !== "function" ||
    typeof readAuthority.deletePersonalDocumentRecord !== "function" ||
    typeof readAuthority.registerPersonalAssetRecord !== "function" ||
    typeof readAuthority.generatePersonalWikiDocumentRecord !== "function" ||
    typeof readAuthority.suggestPersonalWikiLinksRecord !== "function" ||
    typeof readAuthority.attachPersonalWikiLinksRecord !== "function"
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

    async generatePersonalWikiDocument({ userContext, documentId, input }) {
      return readAuthority.generatePersonalWikiDocumentRecord({
        userContext,
        documentId,
        input,
      })
    },

    async suggestPersonalWikiLinks({ userContext, documentId, input }) {
      return readAuthority.suggestPersonalWikiLinksRecord({
        userContext,
        documentId,
        input,
      })
    },

    async attachPersonalWikiLinks({ userContext, documentId, input }) {
      return readAuthority.attachPersonalWikiLinksRecord({
        userContext,
        documentId,
        input,
      })
    },
  }
}
