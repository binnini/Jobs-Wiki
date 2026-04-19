import { createStratawikiReadAuthorityAdapter } from "../read-authority/stratawiki-read-authority-adapter.js"

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

export function createStratawikiAskAdapter({
  env,
  readAuthority,
  now = () => new Date(),
} = {}) {
  const adapter =
    readAuthority ?? createStratawikiReadAuthorityAdapter({ env, now })

  return {
    async askWorkspace({ userContext, question, opportunityId }) {
      const generatedAt = now()

      if (opportunityId) {
        const [detail, relatedList] = await Promise.all([
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
        ])

        const relatedOpportunities = (relatedList.items ?? [])
          .filter((item) => item.opportunityId !== opportunityId)
          .slice(0, 3)

        return {
          sync: deriveAskSync(detail.sync, relatedList.sync),
          answer: buildOpportunityAnswer({
            question,
            detail,
            relatedOpportunities,
            now: generatedAt,
          }),
          evidence: detail.evidence ?? [],
          relatedOpportunities,
          relatedDocuments: detail.relatedDocuments ?? [],
        }
      }

      const [summary, relatedList] = await Promise.all([
        adapter.getWorkspaceSummary({
          userContext,
        }),
        adapter.listOpportunities({
          userContext,
          query: {
            limit: 3,
          },
        }),
      ])

      const relatedOpportunities = relatedList.items ?? []
      const genericEvidence = await collectGenericEvidence({
        readAuthority: adapter,
        opportunities: relatedOpportunities,
      })

      return {
        sync: deriveAskSync(summary.sync, relatedList.sync),
        answer: buildGenericAnswer({
          question,
          summary,
          opportunities: relatedOpportunities,
          evidence: genericEvidence.evidence,
          now: generatedAt,
        }),
        evidence: genericEvidence.evidence,
        relatedOpportunities,
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
