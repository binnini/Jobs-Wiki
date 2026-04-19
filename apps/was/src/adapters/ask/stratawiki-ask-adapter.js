import { createStratawikiReadAuthorityAdapter } from "../read-authority/stratawiki-read-authority-adapter.js"
import {
  loadProfileContextCatalog,
  resolveProfileContextEntry,
} from "./profile-context-catalog.js"
import { createStratawikiPersonalKnowledgeClient } from "./stratawiki-personal-knowledge-client.js"

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  )
}

function trimText(value, maxLength = 220) {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.replace(/\s+/g, " ").trim()

  if (normalized === "") {
    return undefined
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

function createAnswerId(now) {
  return `ans_${now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`
}

function buildRoleSummary(detail) {
  const roleLabels = detail.roles?.map((role) => role.label).filter(Boolean) ?? []

  return roleLabels.length > 0 ? roleLabels.join(", ") : "role taxonomy pending"
}

function extractFactExcerpt(record) {
  return (
    trimText(record?.attributes?.summary, 220) ??
    trimText(record?.attributes?.requirements_text, 220) ??
    trimText(record?.attributes?.title, 220)
  )
}

function buildEvidenceItem(kind, record, metadata = {}) {
  if (!record) {
    return null
  }

  if (kind === "personal") {
    return compactObject({
      evidenceId: record.id,
      kind: "personal",
      label: record.title ?? record.id,
      excerpt: trimText(record.summary, 220),
      documentTitle: record.title,
      provenance: record.profile_version ?? metadata.profileVersion,
    })
  }

  if (kind === "interpretation") {
    return compactObject({
      evidenceId: record.id,
      kind: "interpretation",
      label: record.title ?? record.id,
      excerpt: trimText(record.summary, 220),
      documentTitle: record.title,
      provenance:
        record.provenance?.interpretation_snapshot_id ??
        metadata.interpretationSnapshot,
    })
  }

  return compactObject({
    evidenceId: record.id,
    kind: "fact",
    label: record.attributes?.title ?? record.attributes?.name ?? record.id,
    excerpt: extractFactExcerpt(record),
    documentTitle: record.attributes?.title ?? record.attributes?.name,
    provenance:
      record.fact_snapshot_id ??
      record.provenance?.fact_snapshot_id ??
      metadata.factSnapshot,
  })
}

function buildRelatedDocument(kind, record) {
  if (!record) {
    return null
  }

  return compactObject({
    documentObjectId: record.id,
    documentObjectKind: kind,
    documentTitle:
      record.title ?? record.attributes?.title ?? record.attributes?.name ?? record.id,
    role: kind,
    excerpt:
      trimText(record.summary, 240) ??
      extractFactExcerpt(record),
  })
}

function buildOpportunityAnswer({ question, detail, relatedOpportunities, now }) {
  const sections = [
    `### Opportunity focus`,
    `Question: ${question}`,
    [
      `${detail.title}`,
      detail.company?.name ? `at ${detail.company.name}` : undefined,
      `is currently grounded in live WorkNet-ingested evidence.`,
    ]
      .filter(Boolean)
      .join(" "),
    `### Evidence already visible`,
    detail.analysis?.strengthsSummary ??
      trimText(detail.summary, 240) ??
      "Structured opportunity evidence is available.",
    `### Constraint to call out`,
    detail.analysis?.riskSummary ??
      "Personal profile context is not provisioned yet, so this answer stays source-first.",
    `### Concrete next step`,
    [
      detail.qualification?.requirementsText
        ? `Connect your story to: ${trimText(detail.qualification.requirementsText, 200)}.`
        : undefined,
      detail.qualification?.selectionProcessText
        ? `Prepare for process: ${trimText(detail.qualification.selectionProcessText, 200)}.`
        : undefined,
      `Use the opportunity evidence below and compare it against ${relatedOpportunities[0]?.title ?? "related roles"} next.`,
    ]
      .filter(Boolean)
      .join(" "),
  ]

  return {
    answerId: createAnswerId(now),
    markdown: sections.join("\n\n"),
    generatedAt: now.toISOString(),
  }
}

function buildGenericAnswer({ question, summary, opportunities, evidence, now }) {
  const strongestSignals =
    opportunities.length > 0
      ? opportunities
          .slice(0, 2)
          .map(
            (item) =>
              `${item.title}${item.companyName ? ` (${item.companyName})` : ""}`,
          )
          .join(", ")
      : "no current opportunities"

  const improvementSignals =
    summary.skillsGap?.recommendedToStrengthen?.slice(0, 2).join(", ") ??
    "personal profile context provisioning"

  const sections = [
    `### Workspace reading`,
    `Question: ${question}`,
    `Current live opportunities with the clearest evidence are: ${strongestSignals}.`,
    `### What the current shared snapshot suggests`,
    summary.marketBrief?.signals?.[0] ??
      "The shared recruiting snapshot is available, but personal context is still minimal.",
    `### First improvement target`,
    `Prioritize ${improvementSignals}. This recommendation is grounded in the currently visible opportunity and market signals, not in saved personal profile context.`,
    evidence[0]?.excerpt
      ? `### Evidence anchor\n${evidence[0].excerpt}`
      : undefined,
  ].filter(Boolean)

  return {
    answerId: createAnswerId(now),
    markdown: sections.join("\n\n"),
    generatedAt: now.toISOString(),
  }
}

async function collectGenericEvidence({ readAuthority, opportunities }) {
  const topOpportunityIds = opportunities
    .slice(0, 2)
    .map((item) => item.opportunityId)
    .filter(Boolean)

  const detailResults = await Promise.allSettled(
    topOpportunityIds.map((opportunityId) =>
      readAuthority.getOpportunityDetail({
        opportunityId,
      }),
    ),
  )

  const details = detailResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)

  return {
    evidence: details.flatMap((detail) => detail.evidence ?? []).slice(0, 3),
    relatedDocuments: details
      .flatMap((detail) => detail.relatedDocuments ?? [])
      .slice(0, 3),
  }
}

function deriveAskSync(primarySync, fallbackSync) {
  return primarySync ?? fallbackSync
}

async function ensureProfileContext({
  personalKnowledgeClient,
  profileContext,
}) {
  let existingProfileContext = null
  let provisioningState = "missing"

  try {
    const current = await personalKnowledgeClient.getProfileContext({
      tenantId: profileContext.tenantId,
      userId: profileContext.userId,
    })
    existingProfileContext = current.profile_context ?? null
    provisioningState =
      existingProfileContext?.profile_version === profileContext.profileVersion
        ? "current"
        : "version_mismatch"
  } catch (error) {
    if (error?.code !== "not_found") {
      throw error
    }
  }

  if (provisioningState !== "current") {
    const upserted = await personalKnowledgeClient.upsertProfileContext({
      profileContext: {
        tenant_id: profileContext.tenantId,
        user_id: profileContext.userId,
        profile_version: profileContext.profileVersion,
        goals: profileContext.goals,
        preferences: profileContext.preferences,
        attributes: profileContext.attributes,
      },
    })
    existingProfileContext = upserted.profile_context ?? existingProfileContext
  }

  return {
    provisioningState,
    profileContext: existingProfileContext,
  }
}

function buildPersonalAwareQuestion(question, detail) {
  if (!detail) {
    return question
  }

  const contextLines = [
    `Opportunity title: ${detail.title}`,
    detail.company?.name ? `Company: ${detail.company.name}` : undefined,
    detail.summary ? `Summary: ${trimText(detail.summary, 200)}` : undefined,
    detail.qualification?.requirementsText
      ? `Requirements: ${trimText(detail.qualification.requirementsText, 220)}`
      : undefined,
  ].filter(Boolean)

  return `${question}\n\nOpportunity context:\n${contextLines.join("\n")}`
}

async function collectPersonalAwareArtifacts({
  personalKnowledgeClient,
  personalRecordIds,
  interpretationRecordIds,
  factRecordIds,
  tenantId,
  userId,
}) {
  const [personalResults, interpretationResults, factResults] = await Promise.all([
    Promise.allSettled(
      personalRecordIds.map((personalId) =>
        personalKnowledgeClient.getPersonalRecord({
          tenantId,
          userId,
          personalId,
        }),
      ),
    ),
    Promise.allSettled(
      interpretationRecordIds.map((interpretationId) =>
        personalKnowledgeClient.getInterpretationRecord({
          interpretationId,
        }),
      ),
    ),
    Promise.allSettled(
      factRecordIds.map((factId) =>
        personalKnowledgeClient.getFactRecord({
          factId,
        }),
      ),
    ),
  ])

  return {
    personalRecords: personalResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value.record ?? result.value)
      .filter(Boolean),
    interpretationRecords: interpretationResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value.record ?? result.value)
      .filter(Boolean),
    factRecords: factResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value.record ?? result.value)
      .filter(Boolean),
  }
}

function buildPersonalAwareResult({
  answer,
  artifacts,
  sync,
  relatedOpportunities,
  profileVersion,
  generatedAt,
}) {
  const evidence = [
    ...artifacts.personalRecords.map((record) =>
      buildEvidenceItem("personal", record, {
        profileVersion,
      }),
    ),
    ...artifacts.interpretationRecords.map((record) =>
      buildEvidenceItem("interpretation", record, {
        interpretationSnapshot: answer.provenance?.interpretation_snapshot,
      }),
    ),
    ...artifacts.factRecords.map((record) =>
      buildEvidenceItem("fact", record, {
        factSnapshot: answer.provenance?.fact_snapshot,
      }),
    ),
  ].filter(Boolean)

  const relatedDocuments = [
    ...artifacts.personalRecords.map((record) => buildRelatedDocument("personal", record)),
    ...artifacts.interpretationRecords.map((record) =>
      buildRelatedDocument("interpretation", record),
    ),
    ...artifacts.factRecords.map((record) => buildRelatedDocument("fact", record)),
  ].filter(Boolean)

  return {
    sync,
    answer: {
      answerId: createAnswerId(generatedAt),
      markdown: answer.answer_markdown,
      generatedAt: generatedAt.toISOString(),
    },
    evidence,
    relatedOpportunities,
    relatedDocuments,
  }
}

export function createStratawikiAskAdapter({
  env = {},
  readAuthority,
  personalKnowledgeClient,
  profileContextCatalog,
  now = () => new Date(),
} = {}) {
  const adapter =
    readAuthority ?? createStratawikiReadAuthorityAdapter({ env, now })
  const personalClient =
    personalKnowledgeClient ?? createStratawikiPersonalKnowledgeClient({ env })
  const profileCatalog =
    profileContextCatalog ?? loadProfileContextCatalog(env.profileContextCatalogPath)

  return {
    async askWorkspace({ userContext, question, opportunityId }) {
      const generatedAt = now()

      const opportunityContext = opportunityId
        ? await Promise.all([
            adapter.getOpportunityDetail({
              userContext,
              opportunityId,
            }),
            adapter.listOpportunities({
              userContext,
              query: {
                limit: 4,
              },
            }),
          ]).then(([detail, relatedList]) => ({
            detail,
            relatedList,
            relatedOpportunities: (relatedList.items ?? [])
              .filter((item) => item.opportunityId !== opportunityId)
              .slice(0, 3),
          }))
        : null

      const genericContext = !opportunityContext
        ? await Promise.all([
            adapter.getWorkspaceSummary({
              userContext,
            }),
            adapter.listOpportunities({
              userContext,
              query: {
                limit: 3,
              },
            }),
          ]).then(([summary, relatedList]) => ({
            summary,
            relatedList,
            relatedOpportunities: relatedList.items ?? [],
          }))
        : null

      const resolvedProfile = resolveProfileContextEntry({
        catalog: profileCatalog,
        userContext,
        domain: env.readDomain ?? "recruiting",
      })

      if (resolvedProfile) {
        try {
          await ensureProfileContext({
            personalKnowledgeClient: personalClient,
            profileContext: resolvedProfile,
          })

          const currentSnapshotStatus = await personalClient.getSnapshotStatus()
          const currentFactSnapshot =
            currentSnapshotStatus?.fact_snapshot ??
            currentSnapshotStatus?.layers?.fact?.fact_snapshot_id ??
            null

          const personalAnswer = await personalClient.queryPersonalKnowledge({
            tenantId: resolvedProfile.tenantId,
            userId: resolvedProfile.userId,
            question: buildPersonalAwareQuestion(
              question,
              opportunityContext?.detail,
            ),
            profileVersion: resolvedProfile.profileVersion,
            factSnapshot: currentFactSnapshot,
            save: false,
          })

          const artifacts = await collectPersonalAwareArtifacts({
            personalKnowledgeClient: personalClient,
            personalRecordIds: personalAnswer.personal_records_used ?? [],
            interpretationRecordIds:
              personalAnswer.interpretation_records_used ?? [],
            factRecordIds: personalAnswer.fact_records_used ?? [],
            tenantId: resolvedProfile.tenantId,
            userId: resolvedProfile.userId,
          })

          return buildPersonalAwareResult({
            answer: personalAnswer,
            artifacts,
            sync: deriveAskSync(
              opportunityContext?.detail?.sync ?? genericContext?.summary?.sync,
              opportunityContext?.relatedList?.sync ?? genericContext?.relatedList?.sync,
            ),
            relatedOpportunities:
              opportunityContext?.relatedOpportunities ??
              genericContext?.relatedOpportunities ??
              [],
            profileVersion: resolvedProfile.profileVersion,
            generatedAt,
          })
        } catch (error) {
          if (
            !["not_found", "validation_failed", "temporarily_unavailable"].includes(
              error?.code,
            )
          ) {
            throw error
          }
        }
      }

      if (opportunityContext) {
        return {
          sync: deriveAskSync(
            opportunityContext.detail.sync,
            opportunityContext.relatedList.sync,
          ),
          answer: buildOpportunityAnswer({
            question,
            detail: opportunityContext.detail,
            relatedOpportunities: opportunityContext.relatedOpportunities,
            now: generatedAt,
          }),
          evidence: opportunityContext.detail.evidence ?? [],
          relatedOpportunities: opportunityContext.relatedOpportunities,
          relatedDocuments: opportunityContext.detail.relatedDocuments ?? [],
        }
      }

      const genericEvidence = await collectGenericEvidence({
        readAuthority: adapter,
        opportunities: genericContext.relatedOpportunities,
      })

      return {
        sync: deriveAskSync(genericContext.summary.sync, genericContext.relatedList.sync),
        answer: buildGenericAnswer({
          question,
          summary: genericContext.summary,
          opportunities: genericContext.relatedOpportunities,
          evidence: genericEvidence.evidence,
          now: generatedAt,
        }),
        evidence: genericEvidence.evidence,
        relatedOpportunities: genericContext.relatedOpportunities,
        relatedDocuments: genericEvidence.relatedDocuments.map((document) =>
          compactObject({
            documentObjectId: document.documentObjectId,
            documentObjectKind: document.documentObjectKind,
            documentTitle: document.documentTitle,
            role: document.role,
            excerpt: trimText(document.excerpt, 240),
          }),
        ),
      }
    },
  }
}
