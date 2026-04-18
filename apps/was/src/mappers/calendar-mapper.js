import { mapKnowledgeObjectRef, mapProjectionSync } from "./shared.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function mapCalendarObjectRef(item) {
  return compactObject({
    ...mapKnowledgeObjectRef(item.objectId, item.objectKind, item.objectTitle),
    opportunityId:
      item.objectKind === "opportunity" ? item.opportunityId : undefined,
  })
}

export function mapCalendar(record) {
  return {
    projection: "calendar",
    sync: mapProjectionSync(record.sync, "calendar"),
    items: record.items.map((item) =>
      compactObject({
        calendarItemId: item.calendarItemId,
        kind: item.kind,
        label: item.label,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        objectRef: mapCalendarObjectRef(item),
        decoration: compactObject({
          urgencyLabel: item.urgencyLabel,
          companyName: item.companyName,
        }),
      }),
    ),
  }
}
