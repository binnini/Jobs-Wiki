import { fetchWorknetSourcePayloads } from "./fetch-worknet-source-payloads.js"
import { mapWorknetPayloadsToProposalBatches } from "./map-worknet-payloads-to-proposal-batches.js"

function summarizeValidation(validationResult) {
  return {
    ok: Boolean(validationResult?.ok),
    dryRun: Boolean(validationResult?.dry_run),
    factDecisions: Array.isArray(validationResult?.fact_decisions)
      ? validationResult.fact_decisions.length
      : 0,
    relationDecisions: Array.isArray(validationResult?.relation_decisions)
      ? validationResult.relation_decisions.length
      : 0,
    rejectionCount: Array.isArray(validationResult?.rejections)
      ? validationResult.rejections.length
      : 0,
  }
}

function summarizeIngest(ingestResult) {
  return {
    ok: Boolean(ingestResult?.ok),
    committed: Boolean(ingestResult?.committed),
    factSnapshot:
      ingestResult?.fact_snapshot_id ??
      ingestResult?.fact_snapshot ??
      ingestResult?.audit?.fact_snapshot ??
      null,
  }
}

export async function runWorknetIngestion({
  env,
  logger,
  dryRun,
  sourceId,
  runId,
  clients,
  fetchPage = env.worknetFetchPage,
  fetchSize = env.worknetFetchSize,
  attempt = 1,
  prefetchedFetchResult = null,
}) {
  if (!clients?.stratawiki || !clients?.worknetRecruiting) {
    throw new Error(
      "WorkNet ingestion requires both stratawiki and worknetRecruiting clients.",
    )
  }

  logger.info("ingestion.worknet.started", {
    runId,
    sourceId,
    dryRun,
    fetchPage,
    fetchSize,
    attempt,
  })

  const fetchResult =
    prefetchedFetchResult ??
    (await fetchWorknetSourcePayloads({
      env,
      logger,
      sourceId,
      runId,
      clients,
      fetchPage,
      fetchSize,
      attempt,
    }))
  await clients.stratawiki.assertWriteRuntimeConfig()
  const mappingResult = mapWorknetPayloadsToProposalBatches({
    env,
    logger,
    runId,
    fetchResult,
  })

  for (const proposalBatch of mappingResult.proposalBatches) {
    const { sourceRef, batchId, batch } = proposalBatch
    const validation = await clients.stratawiki.validateDomainProposalBatch({
      batch,
      requestId: `jobs-wiki-validate-${batchId}`,
      idempotencyKey: `jobs-wiki-validate:${batchId}`,
    })

    if (!validation?.ok) {
      throw new Error(
        `StrataWiki validation failed for source ${sourceRef.sourceId}: ${JSON.stringify(
          validation?.rejections ?? validation,
        )}`,
      )
    }

    let ingest = null
    if (!dryRun) {
      ingest = await clients.stratawiki.ingestDomainProposalBatch({
        batch,
        requestId: `jobs-wiki-ingest-${batchId}`,
        idempotencyKey: `jobs-wiki-ingest:${batchId}`,
      })

      if (!ingest?.ok) {
        throw new Error(
          `StrataWiki ingest failed for source ${sourceRef.sourceId}: ${JSON.stringify(
            ingest?.rejections ?? ingest,
          )}`,
        )
      }
    }

    const batchReport = mappingResult.batchReports.find(
      (report) => report.batchId === batchId,
    )

    batchReport.validation = summarizeValidation(validation)
    batchReport.ingest = ingest ? summarizeIngest(ingest) : null
  }

  const sourceRefs = fetchResult.sourceRefs
  const batchReports = mappingResult.batchReports.map((report) => ({
    sourceId: report.sourceId,
    batchId: report.batchId,
    title: report.title,
    companyName: report.companyName,
    factProposalCount: report.factProposalCount,
    relationProposalCount: report.relationProposalCount,
    validation: report.validation,
    ingest: report.ingest,
  }))

  return {
    runId,
    source: "worknet",
    sourceId,
    mode: dryRun ? "dry_run" : "apply",
    status: dryRun ? "validated" : "ingested",
    fetchWindow: {
      page: fetchPage,
      size: fetchSize,
      attempt,
    },
    capabilities: {
      fetch: true,
      map: true,
      write: true,
    },
    stages: [
      {
        name: "fetch",
        status: "completed",
        listed: fetchResult.summary.listedSources,
        fetched: fetchResult.summary.fetchedSources,
        failed: fetchResult.summary.failedSources,
        page: fetchResult.fetchWindow.page,
        size: fetchResult.fetchWindow.size,
        total: fetchResult.summary.totalAvailableSources,
      },
      {
        name: "map_proposals",
        status: "completed",
        batches: mappingResult.summary.mappedBatches,
        facts: mappingResult.summary.factProposalCount,
        relations: mappingResult.summary.relationProposalCount,
      },
      {
        name: "write_authority",
        status: dryRun ? "validated" : "ingested",
        wrapperPath: clients.stratawiki.wrapperPath,
        validatedBatches: batchReports.length,
        ingestedBatches: dryRun ? 0 : batchReports.length,
      },
    ],
    summary: {
      listedSources: fetchResult.summary.listedSources,
      fetchedSources: fetchResult.summary.fetchedSources,
      failedSources: fetchResult.summary.failedSources,
      validatedBatches: batchReports.length,
      ingestedBatches: dryRun ? 0 : batchReports.length,
      factProposalCount: mappingResult.summary.factProposalCount,
      relationProposalCount: mappingResult.summary.relationProposalCount,
    },
    sources: fetchResult.sourceReports,
    batches: batchReports,
    env: {
      nodeEnv: env.nodeEnv,
      logLevel: env.logLevel,
      worknetConfigured: env.worknetConfigured,
      worknetKeyPresence: env.worknetKeyPresence,
      stratawikiConfigured: env.stratawikiConfigured,
      stratawikiCliWrapper: env.stratawikiCliWrapper,
      stratawikiDomainPackPaths: env.stratawikiDomainPackPaths,
      stratawikiActiveDomainPacks: env.stratawikiActiveDomainPacks,
    },
    completedAt: new Date().toISOString(),
  }
}
