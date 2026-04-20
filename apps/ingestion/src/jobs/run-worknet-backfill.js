import { runWithRetry } from "../lib/retry.js"
import { runWorknetIngestion } from "./run-worknet-ingestion.js"

export async function runWorknetBackfill({
  env,
  logger,
  dryRun,
  sourceId,
  runId,
  clients,
  startPage = env.worknetBackfillStartPage,
  pages = env.worknetBackfillPages,
  fetchSize = env.worknetFetchSize,
  maxAttempts = env.ingestMaxAttempts,
  retryDelayMs = env.ingestRetryDelayMs,
  runIngestion = runWorknetIngestion,
  retry = runWithRetry,
}) {
  const pageReports = []

  for (let offset = 0; offset < pages; offset += 1) {
    const fetchPage = startPage + offset

    logger.info("ingestion.worknet.backfill.page_started", {
      runId,
      sourceId,
      dryRun,
      fetchPage,
      fetchSize,
      maxAttempts,
    })

    let execution

    try {
      execution = await retry(
        ({ attempt }) =>
          runIngestion({
            env,
            logger,
            dryRun,
            sourceId,
            runId: `${runId}-page-${fetchPage}`,
            clients,
            fetchPage,
            fetchSize,
            attempt,
          }),
        {
          maxAttempts,
          delayMs: retryDelayMs,
          onRetry: ({ attempt, nextAttempt, error, delayMs }) => {
            logger.info("ingestion.worknet.backfill.retry_scheduled", {
              runId,
              sourceId,
              fetchPage,
              attempt,
              nextAttempt,
              retryDelayMs: delayMs,
              message: error.message,
            })
          },
        },
      )
    } catch (error) {
      error.context = {
        ...(error.context ?? {}),
        mode: "backfill",
        fetchPage,
        startPage,
        pages,
        fetchSize,
        sourceId,
      }
      throw error
    }

    pageReports.push({
      page: fetchPage,
      attempts: execution.attempt,
      summary: execution.result,
    })
  }

  return {
    runId,
    source: "worknet",
    sourceId,
    mode: dryRun ? "backfill_dry_run" : "backfill_apply",
    status: dryRun ? "validated" : "ingested",
    backfill: {
      startPage,
      pages,
      fetchSize,
    },
    retryPolicy: {
      maxAttempts,
      delayMs: retryDelayMs,
    },
    summary: {
      pagesProcessed: pageReports.length,
      fetchedSources: pageReports.reduce(
        (sum, report) => sum + (report.summary.summary?.fetchedSources ?? 0),
        0,
      ),
      validatedBatches: pageReports.reduce(
        (sum, report) => sum + (report.summary.summary?.validatedBatches ?? 0),
        0,
      ),
      ingestedBatches: pageReports.reduce(
        (sum, report) => sum + (report.summary.summary?.ingestedBatches ?? 0),
        0,
      ),
    },
    pages: pageReports.map((report) => ({
      page: report.page,
      attempts: report.attempts,
      status: report.summary.status,
      fetchedSources: report.summary.summary?.fetchedSources ?? 0,
      validatedBatches: report.summary.summary?.validatedBatches ?? 0,
      ingestedBatches: report.summary.summary?.ingestedBatches ?? 0,
      fetchWindow: report.summary.fetchWindow,
    })),
    completedAt: new Date().toISOString(),
  }
}
