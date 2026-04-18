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

async function main() {
  let env
  let logger
  let runId
  let source
  let dryRun

  try {
    const cliOptions = readCliOptions()

    if (cliOptions.showHelp) {
      printHelp()
      return
    }

    env = loadEnv()
    source = cliOptions.source ?? env.defaultSource

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
      dryRun,
      nodeEnv: env.nodeEnv,
      worknetConfigured: env.worknetConfigured,
      stratawikiConfigured: clients.stratawiki.configured,
    })

    let summary

    if (source === "worknet") {
      summary = await runWorknetIngestion({
        env,
        logger,
        dryRun,
        sourceId: env.worknetSourceId,
        runId,
        clients,
      })
    }

    const persistedSummary = await persistRunSummary(summary, {
      directory: env.ingestRunSummaryDir,
    })
    summary.persistedSummaryPath = persistedSummary.path

    logger.info("ingestion.manual_run.completed", {
      runId,
      source,
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
        persistedSummaryPath,
        message: error.message,
      }),
    )

    process.exitCode = 1
  }
}

main()
