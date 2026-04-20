export const WORKNET_RECRUITING_SOURCE_ID = "worknet.recruiting"

export class WorknetSourceFetchError extends Error {
  constructor(
    message,
    {
      sourceId,
      fetchWindow,
      fetchSummary,
      sourceReports,
      cause,
    } = {},
  ) {
    super(message, cause ? { cause } : undefined)
    this.name = "WorknetSourceFetchError"
    this.code = "worknet_source_fetch_failed"
    this.sourceId = sourceId
    this.fetchWindow = fetchWindow
    this.fetchSummary = fetchSummary
    this.sourceReports = sourceReports
  }
}

export function resolveWorknetSourceId(sourceId) {
  const normalized = String(
    sourceId ?? WORKNET_RECRUITING_SOURCE_ID,
  ).trim()

  if (normalized === "") {
    return WORKNET_RECRUITING_SOURCE_ID
  }

  if (normalized !== WORKNET_RECRUITING_SOURCE_ID) {
    throw new Error(
      `Unsupported WorkNet sourceId: ${sourceId}. Current baseline supports only ${WORKNET_RECRUITING_SOURCE_ID}.`,
    )
  }

  return normalized
}

function buildFetchSummary({ sourceId, fetchWindow, sourcePage, sourceReports }) {
  const fetchedSources = sourceReports.filter(
    (report) => report.status === "fetched",
  ).length
  const failedSources = sourceReports.filter(
    (report) => report.status === "failed",
  ).length

  return {
    sourceId,
    listedSources: sourceReports.length,
    fetchedSources,
    failedSources,
    totalAvailableSources: sourcePage.total,
    fetchWindow,
  }
}

export async function fetchWorknetSourcePayloads({
  env,
  logger,
  sourceId,
  runId,
  clients,
  fetchPage = env.worknetFetchPage,
  fetchSize = env.worknetFetchSize,
  attempt = 1,
}) {
  if (!clients?.worknetRecruiting) {
    throw new Error(
      "WorkNet source fetch requires a worknetRecruiting client.",
    )
  }

  if (!env.worknetKeys.employment) {
    throw new Error(
      "Missing WorkNet employment auth key. Set EMPLOYMENT_INFO or WORKNET_EMPLOYMENT_AUTH_KEY before running WorkNet ingestion.",
    )
  }

  const resolvedSourceId = resolveWorknetSourceId(sourceId)

  logger.info("ingestion.worknet.fetch.started", {
    runId,
    sourceId: resolvedSourceId,
    fetchPage,
    fetchSize,
    attempt,
  })

  const sourcePage = await clients.worknetRecruiting.listRecruitingSources({
    authKey: env.worknetKeys.employment,
    page: fetchPage,
    size: fetchSize,
    sortBy: "posted_at",
    sortDirection: "DESC",
  })
  const sourceRefs = sourcePage.items ?? []
  const sourcePayloads = []
  const sourceReports = []
  const fetchWindow = {
    page: sourcePage.page,
    size: sourcePage.size,
    attempt,
  }

  for (const sourceRef of sourceRefs) {
    try {
      const payload = await clients.worknetRecruiting.getRecruitingSource({
        authKey: env.worknetKeys.employment,
        sourceId: sourceRef.sourceId,
      })

      sourcePayloads.push({
        sourceRef,
        payload,
      })
      sourceReports.push({
        sourceId: sourceRef.sourceId,
        title: sourceRef.title,
        companyName: sourceRef.companyName,
        status: "fetched",
        payloadVersion: payload.payloadVersion,
        payloadSourceId: payload.source.sourceId,
        contentHash: payload.source.contentHash ?? null,
      })
    } catch (error) {
      sourceReports.push({
        sourceId: sourceRef.sourceId,
        title: sourceRef.title,
        companyName: sourceRef.companyName,
        status: "failed",
        message: error.message,
      })

      const fetchSummary = buildFetchSummary({
        sourceId: resolvedSourceId,
        fetchWindow,
        sourcePage,
        sourceReports,
      })

      throw new WorknetSourceFetchError(
        `WorkNet source fetch failed for ${sourceRef.sourceId}: ${error.message}`,
        {
          sourceId: resolvedSourceId,
          fetchWindow,
          fetchSummary,
          sourceReports,
          cause: error,
        },
      )
    }
  }

  const fetchSummary = buildFetchSummary({
    sourceId: resolvedSourceId,
    fetchWindow,
    sourcePage,
    sourceReports,
  })

  logger.info("ingestion.worknet.fetch.completed", {
    runId,
    sourceId: resolvedSourceId,
    fetchedSources: fetchSummary.fetchedSources,
    failedSources: fetchSummary.failedSources,
    listedSources: fetchSummary.listedSources,
    page: fetchWindow.page,
    size: fetchWindow.size,
    attempt,
  })

  return {
    runId,
    source: "worknet",
    sourceId: resolvedSourceId,
    fetchWindow,
    sourcePage,
    sourceRefs,
    sourcePayloads,
    sourceReports,
    summary: fetchSummary,
    completedAt: new Date().toISOString(),
  }
}
