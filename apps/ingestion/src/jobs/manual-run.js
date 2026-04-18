import { randomUUID } from "node:crypto"
import { loadEnv } from "../config/env.js"
import { createClients } from "../clients/index.js"
import { readCliOptions, printHelp } from "../lib/cli.js"
import { createLogger } from "../lib/logger.js"
import { runWorknetIngestion } from "./run-worknet-ingestion.js"

async function main() {
  const cliOptions = readCliOptions()

  if (cliOptions.showHelp) {
    printHelp()
    return
  }

  const env = loadEnv()
  const source = cliOptions.source ?? env.defaultSource

  if (source !== "worknet") {
    throw new Error(
      `Unsupported ingestion source: ${source}. Current baseline supports only worknet.`,
    )
  }

  const dryRun =
    cliOptions.dryRun === undefined ? env.defaultDryRun : cliOptions.dryRun
  const logger = createLogger({
    service: env.serviceName,
    level: env.logLevel,
  })
  const clients = createClients(env)
  const runId = randomUUID()

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

  logger.info("ingestion.manual_run.completed", {
    runId,
    source,
    dryRun,
    status: summary.status,
  })

  console.info(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      level: "error",
      event: "ingestion.manual_run.failed",
      service: "jobs-wiki-ingestion",
      message: error.message,
    }),
  )

  process.exitCode = 1
})
