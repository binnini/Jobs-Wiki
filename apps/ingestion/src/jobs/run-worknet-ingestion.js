import { createHash } from "node:crypto"
import { createStratawikiRecruitingProposalBatch } from "../mappers/stratawiki-domain-proposal-batch.js"

function hashValue(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12)
}

function createBatchId({ runId, sourceId }) {
  return `jobs-wiki-${runId}-${hashValue(sourceId)}`
}

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
}) {
  if (!clients?.stratawiki || !clients?.worknetRecruiting) {
    throw new Error(
      "WorkNet ingestion requires both stratawiki and worknetRecruiting clients.",
    )
  }

  if (!env.worknetKeys.employment) {
    throw new Error(
      "Missing WorkNet employment auth key. Set EMPLOYMENT_INFO or WORKNET_EMPLOYMENT_AUTH_KEY before running WorkNet ingestion.",
    )
  }

  await clients.stratawiki.assertWriteRuntimeConfig()

  logger.info("ingestion.worknet.started", {
    runId,
    sourceId,
    dryRun,
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

  const batchReports = []
  let totalFactProposals = 0
  let totalRelationProposals = 0

  for (const sourceRef of sourceRefs) {
    const payload = await clients.worknetRecruiting.getRecruitingSource({
      authKey: env.worknetKeys.employment,
      sourceId: sourceRef.sourceId,
    })

    const batchId = createBatchId({
      runId,
      sourceId: sourceRef.sourceId,
    })
    const batchPayload = createStratawikiRecruitingProposalBatch(payload, {
      batchId,
      packVersion:
        env.stratawikiRecruitingPackVersion ?? undefined,
    })

    totalFactProposals += batchPayload.batch.facts.length
    totalRelationProposals += batchPayload.batch.relations.length

    const validation = await clients.stratawiki.validateDomainProposalBatch({
      batch: batchPayload.batch,
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
        batch: batchPayload.batch,
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

    batchReports.push({
      sourceId: sourceRef.sourceId,
      batchId,
      title: sourceRef.title,
      companyName: sourceRef.companyName,
      factProposalCount: batchPayload.batch.facts.length,
      relationProposalCount: batchPayload.batch.relations.length,
      validation: summarizeValidation(validation),
      ingest: ingest ? summarizeIngest(ingest) : null,
    })
  }

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
        fetched: sourceRefs.length,
        page: sourcePage.page,
        size: sourcePage.size,
        total: sourcePage.total,
      },
      {
        name: "map_proposals",
        status: "completed",
        batches: batchReports.length,
        facts: totalFactProposals,
        relations: totalRelationProposals,
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
      fetchedSources: sourceRefs.length,
      validatedBatches: batchReports.length,
      ingestedBatches: dryRun ? 0 : batchReports.length,
      factProposalCount: totalFactProposals,
      relationProposalCount: totalRelationProposals,
    },
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
