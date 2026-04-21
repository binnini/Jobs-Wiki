import { deleteDocumentService } from "../services/delete-document-service.js"
import { createDocumentService } from "../services/create-document-service.js"
import { attachPersonalWikiLinksService } from "../services/attach-personal-wiki-links-service.js"
import { generatePersonalWikiDocumentService } from "../services/generate-personal-wiki-document-service.js"
import { mapDocumentDetail } from "../mappers/document-detail-mapper.js"
import { getDocumentDetailService } from "../services/get-document-detail-service.js"
import { registerPersonalAssetService } from "../services/register-personal-asset-service.js"
import { suggestPersonalWikiLinksService } from "../services/suggest-personal-wiki-links-service.js"
import { updateDocumentService } from "../services/update-document-service.js"
import {
  validateAttachWikiLinksRequest,
  validateCreateDocumentRequest,
  validateDeleteDocumentRequest,
  validateDocumentId,
  validateGenerateWikiRequest,
  validateRegisterAssetRequest,
  validateSuggestWikiLinksRequest,
  validateUpdateDocumentRequest,
} from "../validators/document-validator.js"

function mapPersonalWikiGenerationResult(result) {
  return {
    item: mapDocumentDetail({
      documentId: `personal_wiki:${result.document_id}`,
      title: result.title,
      layer: "personal_wiki",
      writable: true,
      bodyMarkdown: result.body_markdown ?? "",
      summary: result.body_markdown ?? null,
      metadata: {
        source: {
          provider: "jobs_wiki_generation",
          sourceId: result.document_id,
        },
        updatedAt: result.updated_at ?? result.created_at,
        version: result.version,
        assetRefs: result.asset_refs ?? [],
        status: result.status,
        generation: result.generation ?? undefined,
      },
      relatedObjects: [],
    }).item,
    sourceDocumentRef: result.source_document_ref ?? null,
  }
}

export function createDocumentRoutes({ adapters }) {
  return [
    {
      method: "POST",
      path: "/api/assets",
      name: "registerPersonalAsset",
      async handler(context) {
        const input = validateRegisterAssetRequest(await context.readJsonBody())
        const result = await registerPersonalAssetService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          input,
        })

        return {
          status: 201,
          body: {
            assetId: result.asset_id ?? null,
            filename: result.filename ?? input.filename,
            mediaType: result.media_type ?? input.mediaType,
            assetKind: result.asset_kind ?? input.assetKind,
            storageRef: result.storage_ref ?? input.storageRef,
            status: result.status ?? "active",
          },
        }
      },
    },
    {
      method: "POST",
      path: "/api/documents",
      name: "createDocument",
      async handler(context) {
        const input = validateCreateDocumentRequest(await context.readJsonBody())
        const result = await createDocumentService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          input,
        })

        return {
          status: 201,
          body: mapDocumentDetail({
            documentId: `${input.layer}:${result.document_id}`,
            title: result.title,
            layer: input.layer,
            writable: true,
            bodyMarkdown: result.body_markdown ?? "",
            summary: result.body_markdown ?? null,
            metadata: {
              source: {
                provider:
                  Array.isArray(result.asset_refs) && result.asset_refs.length > 0
                    ? "stratawiki_personal_asset"
                    : "stratawiki_personal",
                sourceId: result.document_id,
              },
              updatedAt: result.updated_at ?? result.created_at,
              version: result.version,
              assetRefs: result.asset_refs ?? [],
              status: result.status,
            },
            relatedObjects: [],
          }),
        }
      },
    },
    {
      method: "POST",
      path: "/api/documents/:documentId/summarize",
      name: "summarizeDocumentToWiki",
      async handler(context) {
        const documentId = validateDocumentId(context.params.documentId)
        const input = validateGenerateWikiRequest({
          ...(await context.readJsonBody()),
          operation: "summarize",
        })
        const result = await generatePersonalWikiDocumentService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          documentId,
          input,
        })

        return {
          status: 200,
          body: {
            operation: "summarize",
            ...mapPersonalWikiGenerationResult(result),
          },
        }
      },
    },
    {
      method: "POST",
      path: "/api/documents/:documentId/rewrite",
      name: "rewriteDocumentToWiki",
      async handler(context) {
        const documentId = validateDocumentId(context.params.documentId)
        const input = validateGenerateWikiRequest({
          ...(await context.readJsonBody()),
          operation: "rewrite",
        })
        const result = await generatePersonalWikiDocumentService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          documentId,
          input,
        })

        return {
          status: 200,
          body: {
            operation: "rewrite",
            ...mapPersonalWikiGenerationResult(result),
          },
        }
      },
    },
    {
      method: "POST",
      path: "/api/documents/:documentId/structure",
      name: "structureDocumentToWiki",
      async handler(context) {
        const documentId = validateDocumentId(context.params.documentId)
        const input = validateGenerateWikiRequest({
          ...(await context.readJsonBody()),
          operation: "structure",
        })
        const result = await generatePersonalWikiDocumentService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          documentId,
          input,
        })

        return {
          status: 200,
          body: {
            operation: "structure",
            ...mapPersonalWikiGenerationResult(result),
          },
        }
      },
    },
    {
      method: "GET",
      path: "/api/documents/:documentId",
      name: "getDocumentDetail",
      async handler(context) {
        const documentId = validateDocumentId(context.params.documentId)
        const result = await getDocumentDetailService({
          readAuthority: adapters.readAuthority,
          userContext: context.userContext,
          documentId,
        })

        return {
          status: 200,
          body: mapDocumentDetail(result),
        }
      },
    },
    {
      method: "PATCH",
      path: "/api/documents/:documentId",
      name: "updateDocument",
      async handler(context) {
        const documentId = validateDocumentId(context.params.documentId)
        const input = validateUpdateDocumentRequest(await context.readJsonBody())
        const result = await updateDocumentService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          documentId,
          input,
        })

        return {
          status: 200,
          body: mapDocumentDetail({
            documentId,
            title: result.title,
            layer: documentId.startsWith("personal_wiki:") ? "personal_wiki" : "personal_raw",
            writable: result.status !== "deleted",
            bodyMarkdown: result.body_markdown ?? "",
            summary: result.body_markdown ?? null,
            metadata: {
              source: {
                provider:
                  Array.isArray(result.asset_refs) && result.asset_refs.length > 0
                    ? "stratawiki_personal_asset"
                    : "stratawiki_personal",
                sourceId: result.document_id,
              },
              updatedAt: result.updated_at,
              version: result.version,
              assetRefs: result.asset_refs ?? [],
              status: result.status,
            },
            relatedObjects: [],
          }),
        }
      },
    },
    {
      method: "POST",
      path: "/api/documents/:documentId/suggest-links",
      name: "suggestDocumentWikiLinks",
      async handler(context) {
        const documentId = validateDocumentId(context.params.documentId)
        const input = validateSuggestWikiLinksRequest(await context.readJsonBody())
        const result = await suggestPersonalWikiLinksService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          documentId,
          input,
        })

        return {
          status: 200,
          body: {
            documentId,
            wikiDocumentVersion: result.wiki_document_version ?? null,
            suggestions: result.suggestions ?? [],
          },
        }
      },
    },
    {
      method: "POST",
      path: "/api/documents/:documentId/attach-links",
      name: "attachDocumentWikiLinks",
      async handler(context) {
        const documentId = validateDocumentId(context.params.documentId)
        const input = validateAttachWikiLinksRequest(await context.readJsonBody())
        const result = await attachPersonalWikiLinksService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          documentId,
          input,
        })

        return {
          status: 200,
          body: {
            documentId,
            wikiDocumentVersion: result.wiki_document_version ?? null,
            attached: result.attached ?? result.attachments ?? [],
          },
        }
      },
    },
    {
      method: "DELETE",
      path: "/api/documents/:documentId",
      name: "deleteDocument",
      async handler(context) {
        const documentId = validateDocumentId(context.params.documentId)
        const input = validateDeleteDocumentRequest(await context.readJsonBody())
        const result = await deleteDocumentService({
          personalDocument: adapters.personalDocument,
          userContext: context.userContext,
          documentId,
          input,
        })

        return {
          status: 200,
          body: {
            documentId,
            status: result.status ?? "deleted",
            deletedAt: result.updated_at ?? null,
            version: result.version ?? null,
          },
        }
      },
    },
  ]
}
