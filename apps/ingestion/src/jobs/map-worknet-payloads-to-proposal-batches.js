import { createHash } from "node:crypto"
import { createStratawikiRecruitingProposalBatch } from "../mappers/stratawiki-domain-proposal-batch.js"

function hashValue(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12)
}

function createBatchId({ runId, sourceId }) {
  return `jobs-wiki-${runId}-${hashValue(sourceId)}`
}

export function mapWorknetPayloadsToProposalBatches({
  env,
  logger,
  runId,
  fetchResult,
}) {
  const batchReports = []
  const proposalBatches = []
  let totalFactProposals = 0
  let totalRelationProposals = 0

  for (const { sourceRef, payload } of fetchResult.sourcePayloads) {
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

    proposalBatches.push({
      sourceRef,
      payload,
      batchId,
      batch: batchPayload.batch,
    })
    batchReports.push({
      sourceId: sourceRef.sourceId,
      batchId,
      title: sourceRef.title,
      companyName: sourceRef.companyName,
      factProposalCount: batchPayload.batch.facts.length,
      relationProposalCount: batchPayload.batch.relations.length,
    })
  }

  const summary = {
    mappedBatches: proposalBatches.length,
    factProposalCount: totalFactProposals,
    relationProposalCount: totalRelationProposals,
  }

  logger.info("ingestion.worknet.map.completed", {
    runId,
    sourceId: fetchResult.sourceId,
    mappedBatches: summary.mappedBatches,
    factProposalCount: summary.factProposalCount,
    relationProposalCount: summary.relationProposalCount,
  })

  return {
    runId,
    source: fetchResult.source,
    sourceId: fetchResult.sourceId,
    proposalBatches,
    batchReports,
    summary,
    completedAt: new Date().toISOString(),
  }
}
