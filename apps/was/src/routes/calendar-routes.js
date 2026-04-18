import { mapCalendar } from "../mappers/calendar-mapper.js"
import { getCalendarService } from "../services/get-calendar-service.js"
import { validateCalendarQuery } from "../validators/calendar-validator.js"

export function createCalendarRoutes({ adapters }) {
  return [
    {
      method: "GET",
      path: "/api/calendar",
      name: "getCalendar",
      async handler(context) {
        const query = validateCalendarQuery(context.searchParams)
        const result = await getCalendarService({
          readAuthority: adapters.readAuthority,
          userContext: context.userContext,
          query,
        })

        return {
          status: 200,
          body: mapCalendar(result),
        }
      },
    },
  ]
}
