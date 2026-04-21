import { randomUUID } from "node:crypto"
import { loadEnv } from "../config/env.js"
import { createClients } from "../clients/index.js"
import { readCliOptions, printHelp } from "../lib/cli.js"
import { createLogger } from "../lib/logger.js"
import {
  buildFailureRunSummary,
  persistRunSummary,
} from "../lib/run-summary-store.js"
import { runWorknetIngestion } from "./run-worknet-ingestion.js"
import { runScheduledIngestion } from "./run-scheduled-ingestion.js"
import { runWorknetBackfill } from "./run-worknet-backfill.js"
import { runWorknetIncremental } from "./run-worknet-incremental.js"

async function main() {
  let env
  let logger
  let runId
  let source
  let dryRun
  let mode

  try {
    const cliOptions = readCliOptions()

    if (cliOptions.showHelp) {
      printHelp()
      return
    }

    env = loadEnv()
    source = cliOptions.source ?? env.defaultSource
    mode = cliOptions.mode ?? "manual"

    if (source !== "worknet") {
      throw new Error(
        `Unsupported ingestion source: ${source}. Current baseline supports only worknet.`,
      )
    }

    dryRun =
      cliOptions.dryRun === undefined ? env.defaultDryRun : cliOptions.dryRun
    logger = createLogger({
      service: env.serviceName,
      level: env.logLevel,
    })
    const clients = createClients(env)
    runId = randomUUID()

    logger.info("ingestion.manual_run.started", {
      runId,
      source,
      mode,
      dryRun,
      nodeEnv: env.nodeEnv,
      worknetConfigured: env.worknetConfigured,
      stratawikiConfigured: clients.stratawiki.configured,
    })

    let summary

    if (source === "worknet") {
      const sharedOptions = {
        env,
        logger,
        dryRun,
        sourceId: env.worknetSourceId,
        runId,
        clients,
      }

      if (mode === "scheduled") {
        summary = await runScheduledIngestion({
          ...sharedOptions,
          cycles: cliOptions.cycles ?? env.ingestScheduleCycles,
          intervalMs: env.ingestScheduleIntervalMs,
          maxAttempts: cliOptions.retryAttempts ?? env.ingestMaxAttempts,
          retryDelayMs: cliOptions.retryDelayMs ?? env.ingestRetryDelayMs,
        })
      } else if (mode === "incremental") {
        summary = await runWorknetIncremental({
          ...sharedOptions,
          maxPages: cliOptions.maxPages ?? env.ingestIncrementalMaxPages,
          fetchSize: cliOptions.size ?? env.worknetFetchSize,
          stateDirectory:
            cliOptions.stateDir ?? env.ingestIncrementalStateDir,
          stopAfterSeenPages: env.ingestIncrementalStopAfterSeenPages,
          recentFingerprintLimit: env.ingestIncrementalRecentFingerprintLimit,
        })
      } else if (mode === "backfill") {
        summary = await runWorknetBackfill({
          ...sharedOptions,
          startPage: cliOptions.backfillStartPage ?? env.worknetBackfillStartPage,
          pages: cliOptions.backfillPages ?? env.worknetBackfillPages,
          fetchSize: cliOptions.size ?? env.worknetFetchSize,
          maxAttempts: cliOptions.retryAttempts ?? env.ingestMaxAttempts,
          retryDelayMs: cliOptions.retryDelayMs ?? env.ingestRetryDelayMs,
        })
      } else {
        summary = await runWorknetIngestion({
          ...sharedOptions,
          fetchPage: cliOptions.page ?? env.worknetFetchPage,
          fetchSize: cliOptions.size ?? env.worknetFetchSize,
          attempt: 1,
        })
      }
    }

    const persistedSummary = await persistRunSummary(summary, {
      directory: env.ingestRunSummaryDir,
    })
    summary.persistedSummaryPath = persistedSummary.path

    logger.info("ingestion.manual_run.completed", {
      runId,
      source,
      mode,
      dryRun,
      status: summary.status,
      persistedSummaryPath: summary.persistedSummaryPath,
    })

    console.info(JSON.stringify(summary, null, 2))
  } catch (error) {
    let persistedSummaryPath

    if (env && runId && source) {
      try {
        const failureSummary = buildFailureRunSummary({
          runId,
          source,
          mode,
          dryRun,
          env,
          error,
        })
        const persistedSummary = await persistRunSummary(failureSummary, {
          directory: env.ingestRunSummaryDir,
        })
        persistedSummaryPath = persistedSummary.path
      } catch (persistError) {
        if (logger) {
          logger.error("ingestion.manual_run.summary_persist_failed", {
            runId,
            source,
            mode,
            message: persistError.message,
          })
        }
      }
    }

    console.error(
      JSON.stringify({
        level: "error",
        event: "ingestion.manual_run.failed",
        service: env?.serviceName ?? "jobs-wiki-ingestion",
        runId,
        source,
        mode,
        persistedSummaryPath,
        message: error.message,
      }),
    )

    process.exitCode = 1
  }
}

main()
