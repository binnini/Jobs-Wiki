import test from "node:test"
import assert from "node:assert/strict"
import { createStratawikiAskAdapter } from "../src/adapters/ask/stratawiki-ask-adapter.js"

function createReadAuthorityStub() {
  return {
    async getWorkspaceSummary() {
      return {
        profileSnapshot: {
          targetRole: "Profile profile_001 pending context hydration",
        },
        marketBrief: {
          signals: ["Platform and backend roles dominate the current recruiting snapshot."],
        },
        skillsGap: {
          recommendedToStrengthen: [
            "Provision personal profile context",
            "Distributed tracing",
          ],
        },
        sync: {
          visibility: "pending",
          version: "fact_snap:recruiting:test",
          visibleAt: "2026-04-19T00:36:20.000Z",
        },
      }
    },

    async listOpportunities() {
      return {
        items: [
          {
            opportunityId: "opp_job_posting_159436",
            objectId: "job_posting:159436",
            title: "2026년 제1회 공무직 신입사원 채용(버스운전원 등)",
            companyName: "인천교통공사",
            roleLabels: ["버스 운전원"],
            summary: "상세 모집요강 참조",
            closesAt: "2026-04-24T23:59:59+09:00",
            status: "closing_soon",
            urgencyLabel: "D-5",
            closingInDays: 5,
            whyMatched: "Role taxonomy captured: 버스 운전원",
            sourceLabel: "worknet",
          },
          {
            opportunityId: "opp_job_posting_159423",
            objectId: "job_posting:159423",
            title: "2026년 상반기 신입직원 채용",
            companyName: "울산항만공사",
            roleLabels: ["경영지원 사무", "정보기술"],
            summary: "사무행정 外",
            closesAt: "2026-04-27T23:59:59+09:00",
            status: "open",
            urgencyLabel: "D-8",
            closingInDays: 8,
            whyMatched: "Role taxonomy captured: 경영지원 사무, 정보기술",
            sourceLabel: "worknet",
          },
        ],
        sync: {
          visibility: "applied",
          version: "fact_snap:recruiting:test",
          visibleAt: "2026-04-19T00:36:20.000Z",
        },
      }
    },

    async getOpportunityDetail({ opportunityId }) {
      if (opportunityId === "opp_job_posting_159436") {
        return {
          opportunityId,
          title: "2026년 제1회 공무직 신입사원 채용(버스운전원 등)",
          summary: "상세 모집요강 참조",
          company: {
            name: "인천교통공사",
          },
          roles: [
            {
              label: "버스 운전원",
            },
          ],
          qualification: {
            requirementsText: "운전 경력 우대",
            selectionProcessText: "서류전형 -> 면접전형",
          },
          analysis: {
            strengthsSummary:
              "Structured role and company evidence is available for 버스 운전원.",
            riskSummary:
              "Personal profile context is not provisioned in StrataWiki yet, so this fit remains source-only.",
          },
          evidence: [
            {
              evidenceId: "evidence:worknet:159436",
              kind: "fact",
              label: "Imported WorkNet opportunity record",
              excerpt: "상세 모집요강 참조",
              provenance: {
                connector: "worknet",
                sourceId: "159436",
              },
            },
          ],
          relatedDocuments: [
            {
              documentObjectId: "document:worknet:159436",
              documentObjectKind: "document",
              documentTitle: "WorkNet Source 159436",
              role: "fact",
              excerpt: "상세 모집요강 참조",
            },
          ],
          sync: {
            visibility: "pending",
            version: "fact_snap:recruiting:test",
            visibleAt: "2026-04-19T00:36:20.000Z",
          },
        }
      }

      return {
        opportunityId,
        title: "2026년 상반기 신입직원 채용",
        summary: "사무행정 外",
        evidence: [
          {
            evidenceId: "evidence:worknet:159423",
            kind: "fact",
            label: "Imported WorkNet opportunity record",
            excerpt: "사무행정 外",
            provenance: {
              connector: "worknet",
              sourceId: "159423",
            },
          },
        ],
        relatedDocuments: [],
        sync: {
          visibility: "applied",
          version: "fact_snap:recruiting:test",
          visibleAt: "2026-04-19T00:36:20.000Z",
        },
      }
    },
  }
}

test("real ask adapter builds a generic answer from live summary and opportunity evidence", async () => {
  const adapter = createStratawikiAskAdapter({
    readAuthority: createReadAuthorityStub(),
    now: () => new Date("2026-04-19T01:00:00.000Z"),
  })

  const result = await adapter.askWorkspace({
    question: "무엇을 먼저 보완해야 하나요?",
  })

  assert.equal(result.sync.visibility, "pending")
  assert.equal(result.answer.answerId, "ans_20260419010000")
  assert.equal(result.answer.markdown.includes("Platform and backend roles dominate"), true)
  assert.equal(result.answer.markdown.includes("Provision personal profile context"), true)
  assert.equal(result.evidence.length, 2)
  assert.equal(result.evidence[0].provenance.connector, "worknet")
  assert.equal(result.relatedOpportunities.length, 2)
})

test("real ask adapter builds an opportunity-scoped answer from live detail evidence", async () => {
  const adapter = createStratawikiAskAdapter({
    readAuthority: createReadAuthorityStub(),
    now: () => new Date("2026-04-19T01:05:00.000Z"),
  })

  const result = await adapter.askWorkspace({
    question: "이 공고에 어떻게 맞춰야 하나요?",
    opportunityId: "opp_job_posting_159436",
  })

  assert.equal(result.sync.visibility, "pending")
  assert.equal(result.answer.answerId, "ans_20260419010500")
  assert.equal(result.answer.markdown.includes("인천교통공사"), true)
  assert.equal(result.answer.markdown.includes("운전 경력 우대"), true)
  assert.equal(result.evidence.length, 1)
  assert.equal(result.relatedOpportunities.length, 1)
  assert.equal(result.relatedOpportunities[0].opportunityId, "opp_job_posting_159423")
  assert.equal(result.relatedDocuments.length, 1)
})
