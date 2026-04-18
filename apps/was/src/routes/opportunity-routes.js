import { mapOpportunityDetail } from "../mappers/opportunity-detail-mapper.js"
import { mapOpportunityList } from "../mappers/opportunity-list-mapper.js"
import { getOpportunityDetailService } from "../services/get-opportunity-detail-service.js"
import { listOpportunitiesService } from "../services/list-opportunities-service.js"
import {
  validateOpportunityId,
  validateOpportunityListQuery,
} from "../validators/opportunity-validator.js"

export function createOpportunityRoutes({ adapters }) {
  return [
    {
      method: "GET",
      path: "/api/opportunities",
      name: "listOpportunities",
      async handler(context) {
        const query = validateOpportunityListQuery(context.searchParams)
        const result = await listOpportunitiesService({
          readAuthority: adapters.readAuthority,
          userContext: context.userContext,
          query,
        })

        return {
          status: 200,
          body: mapOpportunityList(result),
        }
      },
    },
    {
      method: "GET",
      path: "/api/opportunities/:opportunityId",
      name: "getOpportunityDetail",
      async handler(context) {
        const opportunityId = validateOpportunityId(context.params.opportunityId)
        const result = await getOpportunityDetailService({
          readAuthority: adapters.readAuthority,
          userContext: context.userContext,
          opportunityId,
        })

        return {
          status: 200,
          body: mapOpportunityDetail(result),
        }
      },
    },
  ]
}
