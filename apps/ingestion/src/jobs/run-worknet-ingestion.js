export async function runWorknetIngestion({
  env,
  logger,
  dryRun,
  sourceId,
  runId,
}) {
  logger.info("ingestion.worknet.bootstrap_ready", {
    runId,
    sourceId,
    dryRun,
  })

  return {
    runId,
    source: "worknet",
    sourceId,
    mode: dryRun ? "dry_run" : "apply",
    status: "bootstrap_ready",
    capabilities: {
      fetch: false,
      map: false,
      write: false,
    },
    stages: [
      {
        name: "fetch",
        status: "pending",
        message: "Will be implemented in issue #25.",
      },
      {
        name: "map_proposals",
        status: "pending",
        message: "Will be implemented in issue #26.",
      },
      {
        name: "write_authority",
        status: "pending",
        message: "Will be implemented in issue #27.",
      },
    ],
    nextStep:
      "Runtime bootstrap is ready. Continue with WorkNet fetch, proposal mapping, and write-client integration in the next issues.",
    env: {
      nodeEnv: env.nodeEnv,
      logLevel: env.logLevel,
      stratawikiConfigured: Boolean(env.stratawikiBaseUrl),
    },
    completedAt: new Date().toISOString(),
  }
}
