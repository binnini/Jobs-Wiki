import {
  RECRUITING_PACK_VERSION,
  createProposalBatchFromWorknetRecruitingPayload,
} from "../../../../packages/domain-packs/recruiting/mapper.ts"

export function createStratawikiRecruitingProposalBatch(
  payload,
  {
    batchId,
    producer = "jobs-wiki",
    packVersion = RECRUITING_PACK_VERSION,
  } = {},
) {
  const mappedBatch = createProposalBatchFromWorknetRecruitingPayload(payload, {
    producer,
    packVersion,
  })

  return {
    batch: {
      batch_id: batchId,
      domain: mappedBatch.domain,
      producer,
      pack_version: packVersion,
      facts: mappedBatch.facts.map((fact) => ({
        proposal_id: fact.proposalId,
        domain: fact.domain,
        entity_type: fact.entityType,
        attributes: fact.attributes,
        ...(fact.identityHints
          ? { identity_hints: fact.identityHints }
          : {}),
        evidence: fact.evidence.map((item) => ({
          connector: item.connector,
          source_id: item.sourceId,
          ...(item.pointer ? { pointer: item.pointer } : {}),
        })),
      })),
      relations: mappedBatch.relations.map((relation) => ({
        proposal_id: relation.proposalId,
        domain: relation.domain,
        relation_type: relation.relationType,
        from_ref: {
          proposal_id: relation.fromRef.proposalId,
        },
        to_ref: {
          proposal_id: relation.toRef.proposalId,
        },
        ...(relation.attributes ? { attributes: relation.attributes } : {}),
        evidence: relation.evidence.map((item) => ({
          connector: item.connector,
          source_id: item.sourceId,
          ...(item.pointer ? { pointer: item.pointer } : {}),
        })),
      })),
    },
  }
}
