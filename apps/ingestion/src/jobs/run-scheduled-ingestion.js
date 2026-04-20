import { runWithRetry } from "../lib/retry.js"
import { runWorknetIngestion } from "./run-worknet-ingestion.js"

function wait(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

export async function runScheduledIngestion({
  env,
  logger,
  dryRun,
  sourceId,
  runId,
  clients,
  cycles = env.ingestScheduleCycles,
  intervalMs = env.ingestScheduleIntervalMs,
  maxAttempts = env.ingestMaxAttempts,
  retryDelayMs = env.ingestRetryDelayMs,
  runIngestion = runWorknetIngestion,
  retry = runWithRetry,
  sleep = wait,
}) {
  const cycleReports = []

  for (let cycleIndex = 0; cycleIndex < cycles; cycleIndex += 1) {
    const cycleNumber = cycleIndex + 1

    logger.info("ingestion.worknet.scheduled.cycle_started", {
      runId,
      sourceId,
      cycleNumber,
      cycles,
      dryRun,
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
            runId: `${runId}-cycle-${cycleNumber}`,
            clients,
            attempt,
          }),
        {
          maxAttempts,
          delayMs: retryDelayMs,
          onRetry: ({ attempt, nextAttempt, error, delayMs }) => {
            logger.info("ingestion.worknet.scheduled.retry_scheduled", {
              runId,
              sourceId,
              cycleNumber,
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
        mode: "scheduled",
        cycleNumber,
        cycles,
        intervalMs,
        sourceId,
      }
      throw error
    }

    cycleReports.push({
      cycle: cycleNumber,
      attempts: execution.attempt,
      summary: execution.result,
    })

    if (cycleNumber < cycles && intervalMs > 0) {
      await sleep(intervalMs)
    }
  }

  return {
    runId,
    source: "worknet",
    sourceId,
    mode: dryRun ? "scheduled_dry_run" : "scheduled_apply",
    status: dryRun ? "validated" : "ingested",
    schedule: {
      cycles,
      intervalMs,
    },
    retryPolicy: {
      maxAttempts,
      delayMs: retryDelayMs,
    },
    summary: {
      cyclesCompleted: cycleReports.length,
      fetchedSources: cycleReports.reduce(
        (sum, report) => sum + (report.summary.summary?.fetchedSources ?? 0),
        0,
      ),
      validatedBatches: cycleReports.reduce(
        (sum, report) => sum + (report.summary.summary?.validatedBatches ?? 0),
        0,
      ),
      ingestedBatches: cycleReports.reduce(
        (sum, report) => sum + (report.summary.summary?.ingestedBatches ?? 0),
        0,
      ),
    },
    cycles: cycleReports.map((report) => ({
      cycle: report.cycle,
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
