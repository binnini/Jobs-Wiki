import { spawnSync } from "node:child_process"
import {
  createStratawikiPersonalKnowledgeClient,
} from "../ask/stratawiki-personal-knowledge-client.js"
import {
  loadProfileContextCatalog,
  resolveProfileContextEntry,
} from "../ask/profile-context-catalog.js"
import {
  createNotFoundError,
  createTemporarilyUnavailableError,
  createUnknownFailureError,
} from "../../http/errors.js"
import { normalizeWorkspacePath } from "../../mappers/workspace-tree-model.js"

const CLOSE_SOON_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const OPPORTUNITY_ID_PREFIX = "opp_"

function formatOpportunityCursor(offset) {
  return `cursor_${String(offset).padStart(3, "0")}`
}

function trimText(value, maxLength = 160) {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.replaceAll("&#xd;", " ").replace(/\s+/g, " ").trim()

  if (normalized === "") {
    return undefined
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

function escapeSqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function encodeOpportunityId(canonicalKey) {
  return `${OPPORTUNITY_ID_PREFIX}${Buffer.from(canonicalKey, "utf8").toString("base64url")}`
}

function decodeOpportunityId(opportunityId) {
  if (
    typeof opportunityId !== "string" ||
    !opportunityId.startsWith(OPPORTUNITY_ID_PREFIX)
  ) {
    return undefined
  }

  try {
    const decoded = Buffer.from(
      opportunityId.slice(OPPORTUNITY_ID_PREFIX.length),
      "base64url",
    ).toString("utf8")

    return decoded.startsWith("job_posting:") ? decoded : undefined
  } catch {
    return undefined
  }
}

function parseCompactDate(value) {
  if (typeof value !== "string" || !/^\d{8}$/.test(value)) {
    return undefined
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  const normalized = new Date(Date.UTC(year, month - 1, day))

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    return undefined
  }

  return {
    year,
    month,
    day,
  }
}

function formatKstDateTime(dateParts, { endOfDay = false } = {}) {
  if (!dateParts) {
    return undefined
  }

  const year = String(dateParts.year).padStart(4, "0")
  const month = String(dateParts.month).padStart(2, "0")
  const day = String(dateParts.day).padStart(2, "0")
  const clock = endOfDay ? "23:59:59" : "09:00:00"

  return `${year}-${month}-${day}T${clock}+09:00`
}

function formatKstEndOfDayUtcIso(dateParts) {
  if (!dateParts) {
    return undefined
  }

  return new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 14, 59, 59),
  ).toISOString()
}

function toKstCalendarDayStart(now) {
  const kstDate = new Date(now.getTime() + KST_OFFSET_MS)

  return Date.UTC(
    kstDate.getUTCFullYear(),
    kstDate.getUTCMonth(),
    kstDate.getUTCDate(),
  )
}

function computeClosingInDays(dateParts, now) {
  if (!dateParts) {
    return undefined
  }

  const closeDay = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day)
  const currentDay = toKstCalendarDayStart(now)

  return Math.round((closeDay - currentDay) / DAY_MS)
}

function deriveStatus(closingInDays) {
  if (closingInDays === undefined) {
    return "unknown"
  }

  if (closingInDays < 0) {
    return "closed"
  }

  if (closingInDays <= CLOSE_SOON_DAYS) {
    return "closing_soon"
  }

  return "open"
}

function deriveUrgencyLabel(status, closingInDays) {
  if (status === "closed") {
    return "Closed"
  }

  if (closingInDays === undefined) {
    return undefined
  }

  return `D-${closingInDays}`
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function getRoleLabel(roleRecord) {
  return (
    roleRecord?.attributes_json?.display_name ??
    roleRecord?.attributes_json?.normalized_name ??
    roleRecord?.attributes_json?.source_code
  )
}

function createProjectionSync(snapshotStatus, fallbackVersion) {
  if (snapshotStatus?.fact_snapshot_id || snapshotStatus?.current_snapshot_id) {
    const version =
      snapshotStatus.current_snapshot_id ??
      snapshotStatus.fact_snapshot_id ??
      fallbackVersion
    const visibleAt = snapshotStatus.published_at ?? snapshotStatus.updated_at

    if (snapshotStatus.has_pending_outbox) {
      return {
        visibility: "pending",
        version,
        visibleAt,
      }
    }

    if (!snapshotStatus.published_at) {
      return {
        visibility: "partial",
        version,
        visibleAt,
      }
    }

    return {
      visibility: "applied",
      version,
      visibleAt,
    }
  }

  return fallbackVersion
    ? {
        visibility: "unknown",
        version: fallbackVersion,
      }
    : {
        visibility: "stale",
      }
}

function buildDescriptionMarkdown(attributes, companyRecord, roleLabels) {
  const sections = [trimText(attributes.summary, 500)]

  if (companyRecord?.attributes_json?.description) {
    sections.push(`## Company\n${trimText(companyRecord.attributes_json.description, 800)}`)
  }

  if (roleLabels.length > 0) {
    sections.push(`## Roles\n- ${roleLabels.join("\n- ")}`)
  }

  if (attributes.requirements_text) {
    sections.push(`## Requirements\n${trimText(attributes.requirements_text, 1200)}`)
  }

  if (attributes.selection_process_text) {
    sections.push(
      `## Selection Process\n${trimText(attributes.selection_process_text, 1200)}`,
    )
  }

  return sections.filter(Boolean).join("\n\n")
}

function buildAnalysis({ attributes, companyRecord, roleLabels, status }) {
  const fitScore = Math.min(
    95,
    45 +
      (attributes.summary ? 10 : 0) +
      (attributes.requirements_text ? 15 : 0) +
      (attributes.selection_process_text ? 10 : 0) +
      (companyRecord ? 10 : 0) +
      Math.min(roleLabels.length * 3, 12) +
      (status === "closed" ? -5 : 0),
  )

  return {
    fitScore,
    strengthsSummary:
      roleLabels.length > 0
        ? `Structured role and company evidence is available for ${roleLabels.slice(0, 2).join(" / ")}.`
        : "Structured company and source evidence is available from the current WorkNet snapshot.",
    riskSummary:
      "Personal profile context is not provisioned in StrataWiki yet, so this fit remains source-only.",
  }
}

function buildEvidence({ sourceId, sourceUrl, summary, requirementsText, factSnapshotId }) {
  return [
    compactObject({
      evidenceId: `evidence:worknet:${sourceId}`,
      kind: "fact",
      label: "Imported WorkNet opportunity record",
      excerpt: trimText(summary ?? requirementsText, 240),
      provenance: compactObject({
        connector: "worknet",
        sourceId,
        sourceUrl,
        factSnapshotId,
      }),
    }),
  ]
}

function buildOpportunityRecord(
  postingRecord,
  { companyKeyByPostingKey, roleKeysByPostingKey, companyByKey, roleByKey, now },
) {
  const canonicalKey = postingRecord.canonical_key
  const sourceId = canonicalKey.split(":").slice(1).join(":")
  const attributes = postingRecord.attributes_json ?? {}
  const companyRecord = companyByKey.get(companyKeyByPostingKey.get(canonicalKey))
  const roleLabels = (roleKeysByPostingKey.get(canonicalKey) ?? [])
    .map((roleKey) => getRoleLabel(roleByKey.get(roleKey)))
    .filter(Boolean)
  const closesAtDate = parseCompactDate(attributes.closes_at)
  const closingInDays = computeClosingInDays(closesAtDate, now)
  const status = deriveStatus(closingInDays)

  return {
    opportunityId: encodeOpportunityId(canonicalKey),
    objectId: canonicalKey,
    canonicalKey,
    title: attributes.title ?? canonicalKey,
    companyName: companyRecord?.attributes_json?.name,
    roleLabels,
    summary: trimText(attributes.summary, 280) ?? attributes.title ?? canonicalKey,
    employmentType: trimText(attributes.employment_type, 120),
    opensAt: formatKstDateTime(parseCompactDate(attributes.opens_at)),
    closesAt: formatKstDateTime(closesAtDate, { endOfDay: true }),
    status,
    urgencyLabel: deriveUrgencyLabel(status, closingInDays),
    closingInDays,
    whyMatched:
      roleLabels.length > 0
        ? `Role taxonomy captured: ${roleLabels.slice(0, 2).join(", ")}`
        : trimText(attributes.requirements_text, 120) ??
          "Imported from the live WorkNet recruiting snapshot.",
    sourceLabel: "worknet",
    source: {
      provider: "worknet",
      sourceId,
      sourceUrl: attributes.source_url,
    },
    company: companyRecord
      ? {
          objectId: companyRecord.canonical_key,
          name: companyRecord.attributes_json?.name,
          summary:
            trimText(companyRecord.attributes_json?.summary, 200) ??
            trimText(companyRecord.attributes_json?.description, 200),
          homepageUrl: companyRecord.attributes_json?.homepage_url,
          mainBusiness: companyRecord.attributes_json?.main_business,
        }
      : undefined,
    roles: (roleKeysByPostingKey.get(canonicalKey) ?? [])
      .map((roleKey) => {
        const roleRecord = roleByKey.get(roleKey)
        const label = getRoleLabel(roleRecord)

        return label
          ? {
              objectId: roleKey,
              label,
            }
          : undefined
      })
      .filter(Boolean),
    qualification: compactObject({
      locationText: trimText(attributes.location_text, 240),
      requirementsText: trimText(attributes.requirements_text, 1200),
      selectionProcessText: trimText(attributes.selection_process_text, 1200),
    }),
    analysis: buildAnalysis({
      attributes,
      companyRecord,
      roleLabels,
      status,
    }),
    descriptionMarkdown: buildDescriptionMarkdown(attributes, companyRecord, roleLabels),
    evidence: buildEvidence({
      sourceId,
      sourceUrl: attributes.source_url,
      summary: attributes.summary,
      requirementsText: attributes.requirements_text,
      factSnapshotId: postingRecord.fact_snapshot_id,
    }),
    relatedDocuments: undefined,
    calendarStartsAt: formatKstEndOfDayUtcIso(closesAtDate),
    factSnapshotId: postingRecord.fact_snapshot_id,
    updatedAt: postingRecord.updated_at,
  }
}

function compareOpportunityRecords(left, right) {
  const leftPriority =
    left.status === "closing_soon" ? 0 : left.status === "open" ? 1 : left.status === "unknown" ? 2 : 3
  const rightPriority =
    right.status === "closing_soon" ? 0 : right.status === "open" ? 1 : right.status === "unknown" ? 2 : 3

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority
  }

  if (left.closingInDays !== undefined && right.closingInDays !== undefined) {
    if (left.closingInDays !== right.closingInDays) {
      return left.closingInDays - right.closingInDays
    }
  } else if (left.closingInDays !== undefined || right.closingInDays !== undefined) {
    return left.closingInDays === undefined ? 1 : -1
  }

  return left.title.localeCompare(right.title, "ko")
}

function buildReadModel({ postings, companies, roles, relations, snapshotStatus, now }) {
  const companyByKey = new Map(
    companies.map((companyRecord) => [companyRecord.canonical_key, companyRecord]),
  )
  const roleByKey = new Map(roles.map((roleRecord) => [roleRecord.canonical_key, roleRecord]))
  const companyKeyByPostingKey = new Map()
  const roleKeysByPostingKey = new Map()

  for (const relationRecord of relations) {
    if (relationRecord.relation_type === "posted_by") {
      companyKeyByPostingKey.set(
        relationRecord.from_canonical_key,
        relationRecord.to_canonical_key,
      )
      continue
    }

    if (relationRecord.relation_type === "for_role") {
      const existingRoleKeys =
        roleKeysByPostingKey.get(relationRecord.from_canonical_key) ?? []

      existingRoleKeys.push(relationRecord.to_canonical_key)
      roleKeysByPostingKey.set(relationRecord.from_canonical_key, existingRoleKeys)
    }
  }

  const opportunityItems = postings
    .map((postingRecord) =>
      buildOpportunityRecord(postingRecord, {
        companyKeyByPostingKey,
        roleKeysByPostingKey,
        companyByKey,
        roleByKey,
        now,
      }),
    )
    .sort(compareOpportunityRecords)
  const opportunityById = new Map(
    opportunityItems.map((opportunityItem) => [opportunityItem.opportunityId, opportunityItem]),
  )
  const fallbackVersion = opportunityItems[0]?.factSnapshotId
  const sync = createProjectionSync(snapshotStatus, fallbackVersion)

  return {
    sync,
    opportunityItems,
    opportunityById,
    companyNames: Array.from(
      new Set(opportunityItems.map((item) => item.companyName).filter(Boolean)),
    ),
    roleLabels: Array.from(
      new Set(opportunityItems.flatMap((item) => item.roleLabels ?? []).filter(Boolean)),
    ),
  }
}

function buildWorkspaceSummaryRecord(readModel, userContext) {
  const recommendedOpportunities = readModel.opportunityItems
    .filter((item) => item.status !== "closed")
    .slice(0, 3)
  const highlightedOpportunity =
    recommendedOpportunities[0] ?? readModel.opportunityItems[0]

  return {
    profileSnapshot: {
      targetRole: userContext?.profileId
        ? `Profile ${userContext.profileId} pending context hydration`
        : "Profile context pending",
      experience: "Personal profile context is not provisioned in StrataWiki yet.",
      education: "N/A",
      location:
        highlightedOpportunity?.qualification?.locationText ??
        "Multiple locations in current recruiting snapshot",
      domain: "recruiting",
      skills: readModel.roleLabels.slice(0, 4),
      sourceSummary: [
        `${readModel.opportunityItems.length} ingested opportunities`,
        `${readModel.companyNames.length} companies`,
        `${readModel.roleLabels.length} role signals`,
      ],
    },
    recommendedOpportunities,
    marketBrief: {
      signals: [
        `${readModel.opportunityItems.length} live recruiting opportunities are visible in the current snapshot.`,
        readModel.sync.visibleAt
          ? `Latest fact snapshot published at ${readModel.sync.visibleAt}.`
          : "No published fact snapshot metadata is currently available.",
      ],
      risingSkills: readModel.roleLabels.slice(0, 3),
      notableCompanies: readModel.companyNames.slice(0, 3),
    },
    skillsGap: {
      strong: [
        "Canonical opportunity ingestion is live.",
        "Company and role joins are available for current postings.",
      ],
      requested: readModel.roleLabels.slice(0, 3),
      recommendedToStrengthen: [
        "Provision personal profile context",
        "Publish interpretation snapshots",
        "Enable evidence-backed fit scoring",
      ],
    },
    actionQueue: recommendedOpportunities.slice(0, 2).map((item, index) => ({
      actionId: `action_review_${index + 1}_${item.opportunityId}`,
      label: `Review ${item.title}`,
      description:
        item.urgencyLabel && item.companyName
          ? `${item.companyName} closes on ${item.urgencyLabel}.`
          : `Review the latest imported opportunity: ${item.title}.`,
      relatedOpportunityId: item.opportunityId,
      relatedOpportunityTitle: item.title,
    })),
    askFollowUps: [
      "Which imported opportunities are closing soonest?",
      "What profile context is missing before source-only fit can become personalized?",
    ],
    sync: readModel.sync,
  }
}

function parseWorkspaceDocumentId(documentId) {
  if (typeof documentId !== "string") {
    return undefined
  }

  const separatorIndex = documentId.indexOf(":")

  if (separatorIndex < 0) {
    return undefined
  }

  const layer = documentId.slice(0, separatorIndex)
  const recordId = documentId.slice(separatorIndex + 1)

  if (!recordId) {
    return undefined
  }

  if (!["shared", "personal_raw", "personal_wiki"].includes(layer)) {
    return undefined
  }

  return {
    layer,
    recordId,
  }
}

function compactOptionalObject(value) {
  if (!value) {
    return undefined
  }

  const compactedValue = compactObject(value)
  return Object.keys(compactedValue).length > 0 ? compactedValue : undefined
}

function buildMarkdownBody({ title, summary, attributes }) {
  const sections = []

  if (summary) {
    sections.push(summary)
  }

  if (attributes?.requirements_text) {
    sections.push(`## Requirements\n${trimText(attributes.requirements_text, 1200)}`)
  }

  if (attributes?.selection_process_text) {
    sections.push(
      `## Selection Process\n${trimText(attributes.selection_process_text, 1200)}`,
    )
  }

  if (sections.length === 0 && title) {
    sections.push(title)
  }

  return sections.filter(Boolean).join("\n\n")
}

function mapSharedInterpretationDocument(parsedDocumentId, record) {
  const title = record?.title ?? parsedDocumentId.recordId
  const summary = trimText(record?.summary, 280)

  return {
    documentId: `shared:${record.id}`,
    title,
    layer: "shared",
    writable: false,
    bodyMarkdown: buildMarkdownBody({
      title,
      summary,
    }),
    summary,
    metadata: compactOptionalObject({
      source: {
        provider: "stratawiki",
        sourceId: record?.id,
      },
      updatedAt: record?.updated_at,
      tags: record?.tags,
    }),
    relatedObjects: undefined,
  }
}

function mapSharedFactDocument(parsedDocumentId, record) {
  const title =
    record?.attributes?.title ??
    record?.attributes?.name ??
    parsedDocumentId.recordId
  const summary = extractFactExcerpt(record)

  return {
    documentId: `shared:${record.id}`,
    title,
    layer: "shared",
    writable: false,
    bodyMarkdown: buildMarkdownBody({
      title,
      summary,
      attributes: record?.attributes,
    }),
    summary,
    metadata: compactOptionalObject({
      source: {
        provider: "stratawiki",
        sourceId: record?.id,
      },
      updatedAt: record?.updated_at,
      tags: record?.tags,
    }),
    relatedObjects: undefined,
  }
}

function mapPersonalDocument(parsedDocumentId, record) {
  const title = record?.title ?? parsedDocumentId.recordId
  const summary =
    trimText(record?.summary, 280) ??
    trimText(record?.body_markdown, 280)
  const assetRefs = Array.isArray(record?.asset_refs)
    ? record.asset_refs.filter((value) => typeof value === "string" && value.trim() !== "")
    : undefined

  return {
    documentId: `${parsedDocumentId.layer}:${record.document_id ?? record.id}`,
    title,
    layer: parsedDocumentId.layer,
    writable: true,
    bodyMarkdown:
      record?.body_markdown ??
      buildMarkdownBody({
        title,
        summary,
        attributes: record?.attributes,
      }),
    summary,
    metadata: compactOptionalObject({
      source: {
        provider: assetRefs?.length ? "stratawiki_personal_asset" : "stratawiki_personal",
        sourceId: record?.document_id ?? record?.id,
      },
      updatedAt: record?.updated_at ?? record?.created_at,
      tags: record?.tags,
      version: record?.version,
      assetRefs,
      status: record?.status,
    }),
    relatedObjects: undefined,
  }
}

function mapPersonalWorkspaceItem(record, { subspace } = {}) {
  const recordId = record?.document_id ?? record?.id

  if (typeof recordId !== "string" || recordId.trim() === "") {
    return undefined
  }

  const resolvedSubspace = subspace ?? record?.subspace
  const layer = resolvedSubspace === "wiki" ? "personal_wiki" : "personal_raw"

  return {
    objectId: `${layer}:${recordId}`,
    objectKind: "document",
    title: record?.title ?? recordId,
    kind: "document",
    layer,
    path: `/documents/${encodeURIComponent(`${layer}:${recordId}`)}`,
    workspacePath: normalizeWorkspacePath({
      sectionId: layer,
      nodeType: "document",
      segments: [layer === "personal_wiki" ? "notes" : "inbox", recordId],
      label: record?.title ?? recordId,
      path: `/documents/${encodeURIComponent(`${layer}:${recordId}`)}`,
    }),
  }
}

async function listPersonalWorkspaceItems({
  env,
  userContext,
  personalKnowledgeClient,
  profileContextCatalog,
}) {
  const profileContextEntry = resolveProfileContextEntry({
    catalog: profileContextCatalog,
    userContext,
    domain: env.readDomain ?? "recruiting",
  })

  if (!profileContextEntry || !personalKnowledgeClient.listPersonalDocuments) {
    return {
      personalRawItems: [],
      personalWikiItems: [],
    }
  }

  const [rawResponse, wikiResponse] = await Promise.all([
    personalKnowledgeClient.listPersonalDocuments({
      tenantId: profileContextEntry.tenantId,
      userId: profileContextEntry.userId,
      subspace: "raw",
      status: "active",
    }),
    personalKnowledgeClient.listPersonalDocuments({
      tenantId: profileContextEntry.tenantId,
      userId: profileContextEntry.userId,
      subspace: "wiki",
      status: "active",
    }),
  ])

  return {
    personalRawItems:
      (rawResponse?.items ?? [])
        .map((item) => mapPersonalWorkspaceItem(item, { subspace: "raw" }))
        .filter(Boolean),
    personalWikiItems:
      (wikiResponse?.items ?? [])
        .map((item) => mapPersonalWorkspaceItem(item, { subspace: "wiki" }))
        .filter(Boolean),
  }
}

async function loadDocumentDetail({
  documentId,
  userContext,
  env,
  personalKnowledgeClient,
  profileContextCatalog,
}) {
  const parsedDocumentId = parseWorkspaceDocumentId(documentId)

  if (!parsedDocumentId) {
    throw createNotFoundError("document not found", {
      documentId,
    })
  }

  if (parsedDocumentId.layer === "shared") {
    if (parsedDocumentId.recordId.startsWith("interp:")) {
      const response = await personalKnowledgeClient.getInterpretationRecord({
        interpretationId: parsedDocumentId.recordId,
      })

      return mapSharedInterpretationDocument(
        parsedDocumentId,
        response?.record ?? response,
      )
    }

    if (parsedDocumentId.recordId.startsWith("fact:")) {
      const response = await personalKnowledgeClient.getFactRecord({
        factId: parsedDocumentId.recordId,
      })

      return mapSharedFactDocument(parsedDocumentId, response?.record ?? response)
    }
  }

  if (
    parsedDocumentId.layer === "personal_raw" ||
    parsedDocumentId.layer === "personal_wiki"
  ) {
    const profileContextEntry = resolveProfileContextEntry({
      catalog: profileContextCatalog,
      userContext,
      domain: env.readDomain ?? "recruiting",
    })

    if (!profileContextEntry) {
      throw createNotFoundError("document not found", {
        documentId,
      })
    }

    const response =
      /^personal:(raw|wiki):/.test(parsedDocumentId.recordId) ||
      !parsedDocumentId.recordId.startsWith("personal:")
        ? await personalKnowledgeClient.getPersonalDocument({
            tenantId: profileContextEntry.tenantId,
            userId: profileContextEntry.userId,
            documentId: parsedDocumentId.recordId,
          })
        : await personalKnowledgeClient.getPersonalRecord({
            tenantId: profileContextEntry.tenantId,
            userId: profileContextEntry.userId,
            personalId: parsedDocumentId.recordId,
          })

    return mapPersonalDocument(
      parsedDocumentId,
      response?.document ?? response?.record ?? response,
    )
  }

  throw createNotFoundError("document not found", {
    documentId,
  })
}

async function buildWorkspaceRecord(
  readModel,
  { env, userContext, personalKnowledgeClient, profileContextCatalog } = {},
) {
  const personalItems = await listPersonalWorkspaceItems({
    env,
    userContext,
    personalKnowledgeClient,
    profileContextCatalog,
  })

  return {
    sections: [
      {
        sectionId: "shared",
        label: "shared",
        items: [
          {
            objectId: "report:baseline",
            objectKind: "report",
            title: "기본 리포트",
            kind: "report",
            layer: "shared",
            path: "/workspace",
            active: true,
            workspacePath: normalizeWorkspacePath({
              sectionId: "shared",
              nodeType: "special_view",
              segments: ["workspace"],
              label: "기본 리포트",
              path: "/workspace",
            }),
          },
          {
            objectId: "calendar:applications",
            objectKind: "calendar",
            title: "지원 일정",
            kind: "calendar",
            layer: "shared",
            path: "/calendar",
            workspacePath: normalizeWorkspacePath({
              sectionId: "shared",
              nodeType: "special_view",
              segments: ["calendar"],
              label: "지원 일정",
              path: "/calendar",
            }),
          },
          ...readModel.opportunityItems.slice(0, 3).map((item) => ({
            objectId: item.objectId,
            objectKind: "opportunity",
            title: item.title,
            kind: "opportunity",
            layer: "shared",
            path: `/opportunities/${encodeURIComponent(item.opportunityId)}`,
            workspacePath: normalizeWorkspacePath({
              sectionId: "shared",
              nodeType: "special_view",
              segments: ["opportunities", item.title ?? item.opportunityId ?? "item"],
              label: item.title,
              path: `/opportunities/${encodeURIComponent(item.opportunityId)}`,
            }),
          })),
        ],
      },
      {
        sectionId: "personal_raw",
        label: "personal/raw",
        items: personalItems.personalRawItems,
      },
      {
        sectionId: "personal_wiki",
        label: "personal/wiki",
        items: personalItems.personalWikiItems,
      },
    ],
    activeProjection: {
      projection: "report",
      objectId: "report:baseline",
    },
    sync: readModel.sync,
  }
}

async function queryJsonWithPsql({ psqlBin, connectionString, sql }) {
  const result = spawnSync(
    psqlBin,
    [connectionString, "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql],
    {
      encoding: "utf8",
    },
  )

  if (result.error) {
    throw createTemporarilyUnavailableError(
      "Failed to start the StrataWiki read query process.",
      {
        adapter: "stratawiki_read_authority",
        psqlBin,
        message: result.error.message,
      },
    )
  }

  if (result.status !== 0) {
    throw createTemporarilyUnavailableError(
      "Failed to query the StrataWiki read database.",
      {
        adapter: "stratawiki_read_authority",
        stderr: trimText(result.stderr, 240),
      },
    )
  }

  const output = result.stdout.trim()

  if (output === "") {
    return undefined
  }

  try {
    return JSON.parse(output)
  } catch (error) {
    throw createUnknownFailureError(
      "The StrataWiki read query returned invalid JSON.",
      {
        adapter: "stratawiki_read_authority",
      },
      error,
    )
  }
}

function buildReadQueries({ domain, scope }) {
  const domainLiteral = escapeSqlLiteral(domain)
  const scopeLiteral = escapeSqlLiteral(scope)

  return {
    snapshotPointer: `
      SELECT row_to_json(t)
      FROM (
        SELECT
          p.current_snapshot_id,
          p.fact_snapshot_id,
          p.updated_at,
          pub.published_at,
          EXISTS (
            SELECT 1
            FROM ops.outbox_event e
            WHERE e.aggregate_layer = 'fact'
              AND e.aggregate_id = p.current_snapshot_id
              AND e.status IN ('pending', 'claimed')
          ) AS has_pending_outbox
        FROM ops.snapshot_pointer p
        LEFT JOIN ops.snapshot_publication pub
          ON pub.snapshot_id = p.current_snapshot_id
          AND pub.layer = p.layer
          AND pub.domain = p.domain
        WHERE p.layer = 'fact' AND p.domain = ${domainLiteral}
        LIMIT 1
      ) t;
    `,
    postings: `
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.canonical_key), '[]'::json)
      FROM (
        SELECT canonical_key, attributes_json, fact_snapshot_id, updated_at
        FROM fact.record_envelopes
        WHERE domain = ${domainLiteral}
          AND scope = ${scopeLiteral}
          AND entity_type = 'job_posting'
          AND status = 'active'
      ) t;
    `,
    companies: `
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.canonical_key), '[]'::json)
      FROM (
        SELECT canonical_key, attributes_json
        FROM fact.record_envelopes
        WHERE domain = ${domainLiteral}
          AND scope = ${scopeLiteral}
          AND entity_type = 'company'
          AND status = 'active'
      ) t;
    `,
    roles: `
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.canonical_key), '[]'::json)
      FROM (
        SELECT canonical_key, attributes_json
        FROM fact.record_envelopes
        WHERE domain = ${domainLiteral}
          AND scope = ${scopeLiteral}
          AND entity_type = 'role'
          AND status = 'active'
      ) t;
    `,
    relations: `
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.relation_type, t.from_canonical_key, t.to_canonical_key), '[]'::json)
      FROM (
        SELECT relation_type, from_canonical_key, to_canonical_key
        FROM fact.relation_envelopes
        WHERE domain = ${domainLiteral}
          AND scope = ${scopeLiteral}
          AND relation_type IN ('posted_by', 'for_role')
      ) t;
    `,
  }
}

async function loadReadModel({ env, queryJson, now }) {
  const queries = buildReadQueries({
    domain: env.readDomain,
    scope: env.readScope,
  })
  const [snapshotStatus, postings, companies, roles, relations] = await Promise.all([
    queryJson({
      sql: queries.snapshotPointer,
      connectionString: env.readDatabaseUrl,
      psqlBin: env.readPsqlBin,
    }),
    queryJson({
      sql: queries.postings,
      connectionString: env.readDatabaseUrl,
      psqlBin: env.readPsqlBin,
    }),
    queryJson({
      sql: queries.companies,
      connectionString: env.readDatabaseUrl,
      psqlBin: env.readPsqlBin,
    }),
    queryJson({
      sql: queries.roles,
      connectionString: env.readDatabaseUrl,
      psqlBin: env.readPsqlBin,
    }),
    queryJson({
      sql: queries.relations,
      connectionString: env.readDatabaseUrl,
      psqlBin: env.readPsqlBin,
    }),
  ])

  return buildReadModel({
    postings: postings ?? [],
    companies: companies ?? [],
    roles: roles ?? [],
    relations: relations ?? [],
    snapshotStatus,
    now,
  })
}

export function createStratawikiReadAuthorityAdapter({
  env = {},
  queryJson = queryJsonWithPsql,
  now = () => new Date(),
  personalKnowledgeClient = createStratawikiPersonalKnowledgeClient({ env }),
} = {}) {
  const profileContextCatalog = loadProfileContextCatalog(env.profileContextCatalogPath)

  return {
    async getWorkspace({ userContext } = {}) {
      const readModel = await loadReadModel({
        env,
        queryJson,
        now: now(),
      })

      return buildWorkspaceRecord(readModel, {
        env,
        userContext,
        personalKnowledgeClient,
        profileContextCatalog,
      })
    },

    async getWorkspaceSummary({ userContext } = {}) {
      const readModel = await loadReadModel({
        env,
        queryJson,
        now: now(),
      })

      return buildWorkspaceSummaryRecord(readModel, userContext)
    },

    async getDocumentDetail({ documentId, userContext } = {}) {
      const documentRecord = await loadDocumentDetail({
        documentId,
        userContext,
        env,
        personalKnowledgeClient,
        profileContextCatalog,
      })

      return {
        ...documentRecord,
        sync: {
          visibility: "unknown",
        },
      }
    },

    async listOpportunities({ query } = {}) {
      const readModel = await loadReadModel({
        env,
        queryJson,
        now: now(),
      })

      const filteredItems = readModel.opportunityItems.filter((item) => {
        if (query?.status && item.status !== query.status) {
          return false
        }

        if (
          query?.closingWithinDays !== undefined &&
          (item.closingInDays === undefined ||
            item.closingInDays > query.closingWithinDays)
        ) {
          return false
        }

        return true
      })
      const startIndex = query?.cursorOffset ?? 0
      const limit = query?.limit ?? filteredItems.length
      const items = filteredItems.slice(startIndex, startIndex + limit)
      const nextOffset = startIndex + items.length

      return {
        items,
        nextCursor:
          nextOffset < filteredItems.length
            ? formatOpportunityCursor(nextOffset)
            : undefined,
        sync: readModel.sync,
      }
    },

    async getOpportunityDetail({ opportunityId }) {
      const canonicalKey = decodeOpportunityId(opportunityId)

      if (!canonicalKey) {
        throw createNotFoundError("opportunity not found", {
          opportunityId,
        })
      }

      const readModel = await loadReadModel({
        env,
        queryJson,
        now: now(),
      })
      const record = readModel.opportunityById.get(opportunityId)

      if (!record || record.canonicalKey !== canonicalKey) {
        throw createNotFoundError("opportunity not found", {
          opportunityId,
        })
      }

      return {
        opportunityId: record.opportunityId,
        objectId: record.objectId,
        title: record.title,
        summary: record.summary,
        descriptionMarkdown: record.descriptionMarkdown,
        employmentType: record.employmentType,
        opensAt: record.opensAt,
        closesAt: record.closesAt,
        status: record.status,
        source: record.source,
        company: record.company,
        roles: record.roles,
        qualification: record.qualification,
        analysis: record.analysis,
        evidence: record.evidence,
        relatedDocuments: record.relatedDocuments,
        sync: readModel.sync,
      }
    },

    async getCalendar({ query } = {}) {
      const readModel = await loadReadModel({
        env,
        queryJson,
        now: now(),
      })
      const filteredItems = readModel.opportunityItems
        .filter((item) => item.calendarStartsAt)
        .map((item) => ({
          calendarItemId: `calendar_${item.opportunityId}`,
          kind: "opportunity_deadline",
          label: `${item.title} closes`,
          startsAt: item.calendarStartsAt,
          opportunityId: item.opportunityId,
          objectId: item.objectId,
          objectKind: "opportunity",
          objectTitle: item.title,
          urgencyLabel: item.urgencyLabel,
          companyName: item.companyName,
        }))
        .filter((item) => {
          const startsAt = Date.parse(item.startsAt)

          if (query?.from && startsAt < Date.parse(`${query.from}T00:00:00.000Z`)) {
            return false
          }

          if (query?.to && startsAt > Date.parse(`${query.to}T23:59:59.999Z`)) {
            return false
          }

          return true
        })
        .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))

      return {
        items: filteredItems,
        sync: readModel.sync,
      }
    },
  }
}
