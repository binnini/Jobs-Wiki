import { mapDocumentDetail } from "../mappers/document-detail-mapper.js"
import { getDocumentDetailService } from "../services/get-document-detail-service.js"
import { validateDocumentId } from "../validators/document-validator.js"

export function createDocumentRoutes({ adapters }) {
  return [
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
  ]
}
