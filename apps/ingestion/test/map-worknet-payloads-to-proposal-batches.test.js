import test from "node:test"
import assert from "node:assert/strict"

import { mapWorknetPayloadsToProposalBatches } from "../src/jobs/map-worknet-payloads-to-proposal-batches.js"

function createNoopLogger() {
  return {
    info() {},
    warn() {},
    error() {},
    debug() {},
  }
}

test("mapWorknetPayloadsToProposalBatches creates proposal batches and summary counts", () => {
  const result = mapWorknetPayloadsToProposalBatches({
    env: {
      stratawikiRecruitingPackVersion: "2026-04-18",
    },
    logger: createNoopLogger(),
    runId: "map-run-1",
    fetchResult: {
      source: "worknet",
      sourceId: "worknet.recruiting",
      sourcePayloads: [
        {
          sourceRef: {
            sourceId: "EMP-1",
            title: "Backend Engineer",
            companyName: "Jobs Wiki",
          },
          payload: {
            payloadVersion: "recruiting-source-payload/v1",
            source: {
              provider: "worknet",
              kind: "open_recruitment",
              sourceId: "EMP-1",
              fetchedAt: "2026-04-20T00:00:00.000Z",
              sourceUrl: "https://example.com/jobs/EMP-1",
            },
            posting: {
              title: "Backend Engineer",
              companyName: "Jobs Wiki",
              summary: "Production AI delivery role",
            },
            company: {
              sourceCompanyId: "COMP-1",
              name: "Jobs Wiki",
              companyType: "startup",
            },
            jobs: [
              {
                sourceCode: "J001",
                name: "Backend Engineer",
              },
            ],
            recruitmentSections: [],
            selectionSteps: [],
            attachments: [],
          },
        },
      ],
    },
  })

  assert.equal(result.summary.mappedBatches, 1)
  assert.equal(result.summary.factProposalCount, 3)
  assert.equal(result.summary.relationProposalCount, 2)
  assert.equal(result.batchReports[0]?.sourceId, "EMP-1")
  assert.equal(result.batchReports[0]?.factProposalCount, 3)
  assert.equal(result.proposalBatches[0]?.batch.domain, "recruiting")
  assert.equal(result.proposalBatches[0]?.batch.pack_version, "2026-04-18")
})
