export async function getCalendarService({
  readAuthority,
  userContext,
  query,
}) {
  return readAuthority.getCalendar({
    userContext,
    query,
  })
}
