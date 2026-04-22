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

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function readDocumentId(result) {
  return result?.document_id ?? result?.documentId ?? result?.id ?? null
}

function readDocumentBodyMarkdown(result) {
  return result?.body_markdown ?? result?.bodyMarkdown ?? ""
}

function readDocumentSummary(result) {
  return result?.summary ?? result?.body_markdown ?? result?.bodyMarkdown ?? null
}

function readDocumentAssetRefs(result) {
  if (Array.isArray(result?.asset_refs)) {
    return result.asset_refs
  }

  if (Array.isArray(result?.assetRefs)) {
    return result.assetRefs
  }

  return []
}

function mapGenerationSourceDocumentRef(result) {
  const generationSourceDocument = result?.generation?.sourceDocument
  const upstreamRef = result?.source_document_ref ?? result?.sourceDocumentRef

  return compactObject({
    documentId:
      generationSourceDocument?.documentId ??
      upstreamRef?.document_id ??
      upstreamRef?.documentId,
    title: generationSourceDocument?.title,
    layer: generationSourceDocument?.layer,
    version: generationSourceDocument?.version ?? upstreamRef?.version,
    subspace: upstreamRef?.subspace,
    kind: upstreamRef?.kind,
    assetRefs: upstreamRef?.asset_refs ?? upstreamRef?.assetRefs,
  })
}

function mapPersonalWikiGenerationResult(result) {
  const documentId = readDocumentId(result)
  const bodyMarkdown = readDocumentBodyMarkdown(result)

  return {
    item: mapDocumentDetail({
      documentId: `personal_wiki:${documentId}`,
      title: result.title,
      layer: "personal_wiki",
      writable: true,
      bodyMarkdown,
      summary: readDocumentSummary(result),
      metadata: {
        source: {
          provider: "jobs_wiki_generation",
          sourceId: documentId,
        },
        updatedAt: result.updated_at ?? result.updatedAt ?? result.created_at ?? result.createdAt,
        version: result.version,
        assetRefs: readDocumentAssetRefs(result),
        status: result.status,
        generation: result.generation ?? undefined,
      },
      relatedObjects: [],
    }).item,
    sourceDocumentRef: mapGenerationSourceDocumentRef(result),
  }
}

function mapDocumentPayloadFromMutation(input, result) {
  const workspacePath = result.workspace_path ?? result.workspacePath ?? input.workspacePath
  const documentId = readDocumentId(result)
  const bodyMarkdown = readDocumentBodyMarkdown(result)

  return mapDocumentDetail({
    documentId: `${input.layer}:${documentId}`,
    title: result.title,
    layer: input.layer,
    writable: true,
    bodyMarkdown,
    summary: readDocumentSummary(result),
    workspacePath,
    metadata: {
      source: {
        provider: readDocumentAssetRefs(result).length > 0 ? "stratawiki_personal_asset" : "stratawiki_personal",
        sourceId: documentId,
      },
      updatedAt: result.updated_at ?? result.updatedAt ?? result.created_at ?? result.createdAt,
      version: result.version,
      assetRefs: readDocumentAssetRefs(result),
      status: result.status,
    },
    relatedObjects: [],
  })
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
          body: mapDocumentPayloadFromMutation(input, result),
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
          body: mapDocumentPayloadFromMutation(
            {
              ...input,
              layer: documentId.startsWith("personal_wiki:") ? "personal_wiki" : "personal_raw",
            },
            result,
          ),
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
