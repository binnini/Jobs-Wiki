import {
  readIncrementalState,
  updateIncrementalState,
  writeIncrementalState,
} from "../lib/incremental-state-store.js"
import { fetchWorknetSourcePayloads } from "./fetch-worknet-source-payloads.js"
import { runWorknetIngestion } from "./run-worknet-ingestion.js"

function buildSourceFingerprint(entry) {
  const sourceId = String(entry?.sourceRef?.sourceId ?? "").trim()
  const contentHash = String(entry?.payload?.source?.contentHash ?? "").trim()
  return contentHash ? `${sourceId}:${contentHash}` : sourceId
}

function filterFetchResult(fetchResult, allowedFingerprints) {
  const filteredPayloads = fetchResult.sourcePayloads.filter((entry) =>
    allowedFingerprints.has(buildSourceFingerprint(entry)),
  )
  const allowedSourceIds = new Set(
    filteredPayloads.map((entry) => String(entry.sourceRef?.sourceId ?? "").trim()).filter(Boolean),
  )

  return {
    ...fetchResult,
    sourceRefs: fetchResult.sourceRefs.filter((sourceRef) =>
      allowedSourceIds.has(String(sourceRef?.sourceId ?? "").trim()),
    ),
    sourcePayloads: filteredPayloads,
    sourceReports: fetchResult.sourceReports.filter((report) =>
      allowedSourceIds.has(String(report?.sourceId ?? "").trim()),
    ),
    summary: {
      ...fetchResult.summary,
      listedSources: allowedSourceIds.size,
      fetchedSources: filteredPayloads.length,
      failedSources: 0,
    },
  }
}

export async function runWorknetIncremental({
  env,
  logger,
  dryRun,
  sourceId,
  runId,
  clients,
  stateDirectory = env.ingestIncrementalStateDir,
  maxPages = env.ingestIncrementalMaxPages,
  fetchSize = env.worknetFetchSize,
  stopAfterSeenPages = env.ingestIncrementalStopAfterSeenPages,
  recentFingerprintLimit = env.ingestIncrementalRecentFingerprintLimit,
  readState = readIncrementalState,
  writeState = writeIncrementalState,
  fetchSources = fetchWorknetSourcePayloads,
  runIngestion = runWorknetIngestion,
}) {
  const previousState = await readState({
    directory: stateDirectory,
    sourceId,
  })
  const seenFingerprints = new Set(previousState.recentFingerprints)
  const processedEntries = []
  const pageReports = []
  let pagesScanned = 0
  let seenOnlyPages = 0
  let stopReason = "max_pages_reached"

  for (let page = 1; page <= maxPages; page += 1) {
    pagesScanned += 1
    const fetchResult = await fetchSources({
      env,
      logger,
      sourceId,
      runId: `${runId}-page-${page}`,
      clients,
      fetchPage: page,
      fetchSize,
      attempt: 1,
    })

    const pageEntries = fetchResult.sourcePayloads.map((entry) => ({
      sourceId: String(entry.sourceRef?.sourceId ?? "").trim(),
      fingerprint: buildSourceFingerprint(entry),
    }))
    const newEntries = pageEntries.filter(
      (entry) => entry.fingerprint && !seenFingerprints.has(entry.fingerprint),
    )

    if (newEntries.length === 0) {
      seenOnlyPages += 1
      pageReports.push({
        page,
        fetchedSources: fetchResult.summary.fetchedSources,
        newSources: 0,
        status: "seen_only",
      })
      if (seenOnlyPages >= stopAfterSeenPages) {
        stopReason = "seen_only_page_reached"
        break
      }
      continue
    }

    seenOnlyPages = 0
    const allowedFingerprints = new Set(newEntries.map((entry) => entry.fingerprint))
    const filteredFetchResult = filterFetchResult(fetchResult, allowedFingerprints)
    const ingestionResult = await runIngestion({
      env,
      logger,
      dryRun,
      sourceId,
      runId: `${runId}-page-${page}`,
      clients,
      fetchPage: page,
      fetchSize,
      attempt: 1,
      prefetchedFetchResult: filteredFetchResult,
    })

    for (const entry of newEntries) {
      seenFingerprints.add(entry.fingerprint)
      processedEntries.push(entry)
    }

    pageReports.push({
      page,
      fetchedSources: fetchResult.summary.fetchedSources,
      newSources: newEntries.length,
      status: ingestionResult.status,
      fetchWindow: ingestionResult.fetchWindow,
    })
  }

  const runRecord = {
    runId,
    source: "worknet",
    sourceId,
    mode: dryRun ? "incremental_dry_run" : "incremental_apply",
    status: dryRun ? "validated" : "ingested",
    incremental: {
      stateDirectory,
      maxPages,
      fetchSize,
      stopAfterSeenPages,
      stopReason,
      pagesScanned,
      newSources: processedEntries.length,
      recentFingerprintLimit,
    },
    pages: pageReports,
    summary: {
      pagesScanned,
      fetchedSources: pageReports.reduce((sum, report) => sum + report.fetchedSources, 0),
      newSources: processedEntries.length,
      validatedBatches: processedEntries.length,
      ingestedBatches: dryRun ? 0 : processedEntries.length,
    },
    completedAt: new Date().toISOString(),
  }

  const nextState = updateIncrementalState({
    previousState,
    sourceId,
    processedEntries,
    recentFingerprintLimit,
    run: {
      runId,
      completedAt: runRecord.completedAt,
      mode: runRecord.mode,
      stopReason,
      pagesScanned,
      newSources: processedEntries.length,
    },
  })
  const persistedState = await writeState({
    directory: stateDirectory,
    sourceId,
    state: nextState,
  })

  return {
    ...runRecord,
    incremental: {
      ...runRecord.incremental,
      statePath: persistedState.path,
      recentFingerprintCount: nextState.recentFingerprints.length,
    },
  }
}
