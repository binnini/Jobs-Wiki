import {
  loadProfileContextCatalog,
  resolveProfileContextEntry,
} from "../ask/profile-context-catalog.js"
import { createStratawikiPersonalKnowledgeClient } from "../ask/stratawiki-personal-knowledge-client.js"
import {
  createConflictError,
  createNotFoundError,
  createValidationError,
} from "../../http/errors.js"

function parsePersonalLayerDocumentId(documentId) {
  if (typeof documentId !== "string" || documentId.trim() === "") {
    throw createValidationError("`documentId` path parameter is required.")
  }

  const separatorIndex = documentId.indexOf(":")

  if (separatorIndex < 0) {
    throw createValidationError("Personal document ids must include a layer prefix.")
  }

  const layer = documentId.slice(0, separatorIndex)
  const recordId = documentId.slice(separatorIndex + 1)

  if (!["personal_raw", "personal_wiki"].includes(layer) || !recordId) {
    throw createValidationError("Personal document ids must use personal_raw or personal_wiki.")
  }

  return {
    layer,
    recordId,
    subspace: layer === "personal_wiki" ? "wiki" : "raw",
  }
}

async function ensureProfileContext({ personalKnowledgeClient, profileContextEntry }) {
  try {
    const current = await personalKnowledgeClient.getProfileContext({
      tenantId: profileContextEntry.tenantId,
      userId: profileContextEntry.userId,
    })

    if (
      current?.profile_context?.profile_version === profileContextEntry.profileVersion
    ) {
      return
    }
  } catch (error) {
    if (error?.code !== "not_found") {
      throw error
    }
  }

  await personalKnowledgeClient.upsertProfileContext({
    profileContext: {
      tenant_id: profileContextEntry.tenantId,
      user_id: profileContextEntry.userId,
      profile_version: profileContextEntry.profileVersion,
      goals: profileContextEntry.goals,
      preferences: profileContextEntry.preferences,
      attributes: profileContextEntry.attributes,
    },
  })
}

function resolveWritableProfileContext({ env, profileContextCatalog, userContext }) {
  const profileContextEntry = resolveProfileContextEntry({
    catalog: profileContextCatalog,
    userContext,
    domain: env.readDomain ?? "recruiting",
  })

  if (!profileContextEntry) {
    throw createValidationError(
      "A Personal profile context is required before writing personal documents.",
      {
        adapter: "stratawiki_personal_document",
      },
    )
  }

  return profileContextEntry
}

function normalizeDocumentConflict(error) {
  if (error?.code === "conflict") {
    throw createConflictError(error.message, error.details)
  }

  throw error
}

async function loadRuntimePersonalDocument({
  personalKnowledgeClient,
  profileContextEntry,
  documentId,
}) {
  const response = await personalKnowledgeClient.getPersonalDocument({
    tenantId: profileContextEntry.tenantId,
    userId: profileContextEntry.userId,
    documentId,
  })

  return response?.document ?? response
}

function buildSourceDocumentRef(document) {
  return {
    document_id: document.document_id,
    subspace: document.subspace,
    version: document.version,
    kind: document.kind,
    asset_refs: Array.isArray(document.asset_refs) ? document.asset_refs : [],
  }
}

export function createStratawikiPersonalDocumentAdapter({
  env = {},
  personalKnowledgeClient = createStratawikiPersonalKnowledgeClient({ env }),
} = {}) {
  const profileContextCatalog = loadProfileContextCatalog(env.profileContextCatalogPath)

  return {
    async createPersonalDocument({ userContext, input }) {
      const profileContextEntry = resolveWritableProfileContext({
        env,
        profileContextCatalog,
        userContext,
      })
      await ensureProfileContext({
        personalKnowledgeClient,
        profileContextEntry,
      })

      const response = await personalKnowledgeClient.createPersonalDocument({
        tenantId: profileContextEntry.tenantId,
        userId: profileContextEntry.userId,
        profileVersion: profileContextEntry.profileVersion,
        subspace: input.subspace,
        kind: input.kind,
        title: input.title,
        bodyMarkdown: input.bodyMarkdown,
        assetRefs: input.assetRefs,
        anchors: input.anchors,
      })

      return response?.document ?? response
    },

    async updatePersonalDocument({ userContext, documentId, input }) {
      const profileContextEntry = resolveWritableProfileContext({
        env,
        profileContextCatalog,
        userContext,
      })
      const parsedDocumentId = parsePersonalLayerDocumentId(documentId)

      await ensureProfileContext({
        personalKnowledgeClient,
        profileContextEntry,
      })

      try {
        const response = await personalKnowledgeClient.updatePersonalDocument({
          tenantId: profileContextEntry.tenantId,
          userId: profileContextEntry.userId,
          documentId: parsedDocumentId.recordId,
          profileVersion: profileContextEntry.profileVersion,
          ifVersion: input.ifVersion,
          title: input.title,
          bodyMarkdown: input.bodyMarkdown,
          assetRefs: input.assetRefs,
          anchors: input.anchors,
        })

        return response?.document ?? response
      } catch (error) {
        normalizeDocumentConflict(error)
      }
    },

    async deletePersonalDocument({ userContext, documentId, input }) {
      const profileContextEntry = resolveWritableProfileContext({
        env,
        profileContextCatalog,
        userContext,
      })
      const parsedDocumentId = parsePersonalLayerDocumentId(documentId)

      try {
        const response = await personalKnowledgeClient.deletePersonalDocument({
          tenantId: profileContextEntry.tenantId,
          userId: profileContextEntry.userId,
          documentId: parsedDocumentId.recordId,
          ifVersion: input.ifVersion,
        })

        return response?.document ?? response
      } catch (error) {
        normalizeDocumentConflict(error)
      }
    },

    async registerPersonalAsset({ userContext, input }) {
      const profileContextEntry = resolveWritableProfileContext({
        env,
        profileContextCatalog,
        userContext,
      })
      await ensureProfileContext({
        personalKnowledgeClient,
        profileContextEntry,
      })

      try {
        const response = await personalKnowledgeClient.registerPersonalAsset({
          tenantId: profileContextEntry.tenantId,
          userId: profileContextEntry.userId,
          assetKind: input.assetKind,
          mediaType: input.mediaType,
          filename: input.filename,
          storageRef: input.storageRef,
        })

        return response?.asset ?? response
      } catch (error) {
        if (error?.code === "not_found") {
          throw createNotFoundError(error.message, error.details)
        }

        if (error?.code === "conflict") {
          throw createConflictError(error.message, error.details)
        }

        throw error
      }
    },

    async generatePersonalWikiDocument({ userContext, documentId, input }) {
      const profileContextEntry = resolveWritableProfileContext({
        env,
        profileContextCatalog,
        userContext,
      })
      const parsedDocumentId = parsePersonalLayerDocumentId(documentId)

      if (parsedDocumentId.layer !== "personal_raw") {
        throw createValidationError(
          "Raw-to-wiki generation requires a `personal_raw` source document.",
        )
      }

      await ensureProfileContext({
        personalKnowledgeClient,
        profileContextEntry,
      })

      const sourceDocument = await loadRuntimePersonalDocument({
        personalKnowledgeClient,
        profileContextEntry,
        documentId: parsedDocumentId.recordId,
      })
      const sourceDocumentRef = buildSourceDocumentRef(sourceDocument)
      const baseInput = {
        tenantId: profileContextEntry.tenantId,
        userId: profileContextEntry.userId,
        sourceDocumentRef,
        profileVersion: profileContextEntry.profileVersion,
        modelProfile: env.personalQueryModelProfile,
        saveTarget: {
          subspace: "wiki",
        },
      }

      if (input.operation === "summarize") {
        const response = await personalKnowledgeClient.summarizePersonalDocumentToWiki({
          ...baseInput,
          summaryStyle: input.summaryStyle,
        })

        return response?.document ?? response
      }

      if (input.operation === "rewrite") {
        const response = await personalKnowledgeClient.rewritePersonalDocumentToWiki({
          ...baseInput,
          rewriteGoal: input.rewriteGoal,
        })

        return response?.document ?? response
      }

      if (input.operation === "structure") {
        const response = await personalKnowledgeClient.structurePersonalDocumentToWiki({
          ...baseInput,
          structureTemplate: input.structureTemplate,
        })

        return response?.document ?? response
      }

      throw createValidationError("Unsupported personal wiki generation operation.", {
        operation: input.operation,
      })
    },

    async suggestPersonalWikiLinks({ userContext, documentId, input }) {
      const profileContextEntry = resolveWritableProfileContext({
        env,
        profileContextCatalog,
        userContext,
      })
      const parsedDocumentId = parsePersonalLayerDocumentId(documentId)

      if (parsedDocumentId.layer !== "personal_wiki") {
        throw createValidationError(
          "Wiki link suggestions require a `personal_wiki` document.",
        )
      }

      await ensureProfileContext({
        personalKnowledgeClient,
        profileContextEntry,
      })

      const targetDocument = await loadRuntimePersonalDocument({
        personalKnowledgeClient,
        profileContextEntry,
        documentId: parsedDocumentId.recordId,
      })

      return personalKnowledgeClient.suggestPersonalWikiLinks({
        tenantId: profileContextEntry.tenantId,
        userId: profileContextEntry.userId,
        wikiDocumentId: targetDocument.document_id,
        wikiDocumentVersion: targetDocument.version,
        profileVersion: profileContextEntry.profileVersion,
        modelProfile: env.personalQueryModelProfile,
        maxSuggestions: input.maxSuggestions,
      })
    },

    async attachPersonalWikiLinks({ userContext, documentId, input }) {
      const profileContextEntry = resolveWritableProfileContext({
        env,
        profileContextCatalog,
        userContext,
      })
      const parsedDocumentId = parsePersonalLayerDocumentId(documentId)

      if (parsedDocumentId.layer !== "personal_wiki") {
        throw createValidationError(
          "Wiki link attachment requires a `personal_wiki` document.",
        )
      }

      return personalKnowledgeClient.attachPersonalWikiLinks({
        tenantId: profileContextEntry.tenantId,
        userId: profileContextEntry.userId,
        wikiDocumentId: parsedDocumentId.recordId,
        wikiDocumentVersion: input.wikiDocumentVersion,
        attachments: input.attachments,
      })
    },
  }
}
