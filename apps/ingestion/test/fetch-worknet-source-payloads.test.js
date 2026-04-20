import test from "node:test"
import assert from "node:assert/strict"

import {
  fetchWorknetSourcePayloads,
  WorknetSourceFetchError,
} from "../src/jobs/fetch-worknet-source-payloads.js"

function createNoopLogger() {
  return {
    info() {},
    warn() {},
    error() {},
    debug() {},
  }
}

test("fetchWorknetSourcePayloads lists refs and loads normalized payloads", async () => {
  const result = await fetchWorknetSourcePayloads({
    env: {
      worknetFetchPage: 1,
      worknetFetchSize: 2,
      worknetKeys: {
        employment: "test-key",
      },
    },
    logger: createNoopLogger(),
    sourceId: "worknet.recruiting",
    runId: "fetch-run-1",
    clients: {
      worknetRecruiting: {
        async listRecruitingSources() {
          return {
            total: 2,
            page: 1,
            size: 2,
            items: [
              {
                sourceId: "EMP-1",
                title: "Backend Engineer",
                companyName: "Jobs Wiki",
              },
              {
                sourceId: "EMP-2",
                title: "Data Engineer",
                companyName: "Jobs Wiki",
              },
            ],
          }
        },
        async getRecruitingSource({ sourceId }) {
          return {
            payloadVersion: "recruiting-source-payload/v1",
            source: {
              provider: "worknet",
              kind: "open_recruitment",
              sourceId,
              fetchedAt: "2026-04-20T00:00:00.000Z",
              contentHash: `${sourceId}-hash`,
            },
            posting: {
              title: `${sourceId} title`,
              companyName: "Jobs Wiki",
            },
            jobs: [],
            recruitmentSections: [],
            selectionSteps: [],
            attachments: [],
          }
        },
      },
    },
  })

  assert.equal(result.summary.listedSources, 2)
  assert.equal(result.summary.fetchedSources, 2)
  assert.equal(result.summary.failedSources, 0)
  assert.equal(result.fetchWindow.page, 1)
  assert.equal(result.fetchWindow.size, 2)
  assert.equal(result.sourcePayloads.length, 2)
  assert.equal(result.sourceReports[0]?.status, "fetched")
  assert.equal(result.sourceReports[0]?.payloadSourceId, "EMP-1")
})

test("fetchWorknetSourcePayloads surfaces partial fetch summary on source failure", async () => {
  await assert.rejects(
    () =>
      fetchWorknetSourcePayloads({
        env: {
          worknetFetchPage: 1,
          worknetFetchSize: 2,
          worknetKeys: {
            employment: "test-key",
          },
        },
        logger: createNoopLogger(),
        sourceId: "worknet.recruiting",
        runId: "fetch-run-2",
        clients: {
          worknetRecruiting: {
            async listRecruitingSources() {
              return {
                total: 2,
                page: 1,
                size: 2,
                items: [
                  {
                    sourceId: "EMP-1",
                    title: "Backend Engineer",
                    companyName: "Jobs Wiki",
                  },
                  {
                    sourceId: "EMP-2",
                    title: "Data Engineer",
                    companyName: "Jobs Wiki",
                  },
                ],
              }
            },
            async getRecruitingSource({ sourceId }) {
              if (sourceId === "EMP-2") {
                throw new Error("detail unavailable")
              }

              return {
                payloadVersion: "recruiting-source-payload/v1",
                source: {
                  provider: "worknet",
                  kind: "open_recruitment",
                  sourceId,
                  fetchedAt: "2026-04-20T00:00:00.000Z",
                },
                posting: {
                  title: `${sourceId} title`,
                  companyName: "Jobs Wiki",
                },
                jobs: [],
                recruitmentSections: [],
                selectionSteps: [],
                attachments: [],
              }
            },
          },
        },
      }),
    (error) => {
      assert.equal(error instanceof WorknetSourceFetchError, true)
      assert.equal(error.code, "worknet_source_fetch_failed")
      assert.equal(error.fetchSummary?.listedSources, 2)
      assert.equal(error.fetchSummary?.fetchedSources, 1)
      assert.equal(error.fetchSummary?.failedSources, 1)
      assert.equal(error.sourceReports?.[1]?.status, "failed")
      return true
    },
  )
})
