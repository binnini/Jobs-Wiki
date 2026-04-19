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

test("real ask adapter upgrades to personal-aware analysis when profile context is available", async () => {
  const adapter = createStratawikiAskAdapter({
    readAuthority: createReadAuthorityStub(),
    profileContextCatalog: {
      defaultProfileId: "profile_demo_backend",
      profiles: {
        profile_demo_backend: {
          workspaceId: "workspace_demo",
          userId: "profile_demo_backend",
          profileVersion: "profile:v1",
          displayName: "김지훈",
          goals: ["금융 도메인 백엔드 전환"],
          preferences: {
            targetRole: "Backend Engineer",
          },
          attributes: {
            skills: ["Node.js", "REST API"],
          },
        },
      },
    },
    personalKnowledgeClient: {
      async getProfileContext() {
        throw Object.assign(new Error("not found"), {
          code: "not_found",
        })
      },
      async upsertProfileContext({ profileContext }) {
        return {
          profile_context: {
            domain: "recruiting",
            ...profileContext,
          },
        }
      },
      async queryPersonalKnowledge() {
        return {
          status: "ok",
          answer_markdown:
            "## Personalized focus\n지원자님의 Node.js API 최적화 경험을 금융 도메인 운영 안정성 관점으로 재서술하는 것이 좋습니다.",
          personal_records_used: ["personal:1"],
          interpretation_records_used: ["interp:published:1"],
          fact_records_used: ["fact:job:1"],
          provenance: {
            fact_snapshot: "fact_snap:recruiting:test",
            interpretation_snapshot: "interp_snap:recruiting:test",
            profile_version: "profile:v1",
            model_profile: "balanced_default",
            provider: "deterministic",
            model: "test",
          },
        }
      },
      async getSnapshotStatus() {
        return {
          fact_snapshot: "fact_snap:recruiting:test",
        }
      },
      async getPersonalRecord() {
        return {
          record: {
            id: "personal:1",
            title: "나의 백엔드 경험 요약",
            summary: "Node.js API 최적화 경험과 컨테이너 배포 경험이 있음",
            profile_version: "profile:v1",
          },
        }
      },
      async getInterpretationRecord() {
        return {
          record: {
            id: "interp:published:1",
            title: "금융 백엔드 해석",
            summary: "금융 도메인에서는 안정성과 추적 가능성이 중요함",
            provenance: {
              interpretation_snapshot_id: "interp_snap:recruiting:test",
            },
          },
        }
      },
      async getFactRecord() {
        return {
          record: {
            id: "fact:job:1",
            attributes: {
              title: "Backend Engineer",
              summary: "Production AI systems experience preferred.",
            },
            fact_snapshot_id: "fact_snap:recruiting:test",
          },
        }
      },
    },
    now: () => new Date("2026-04-19T02:00:00.000Z"),
  })

  const result = await adapter.askWorkspace({
    userContext: {
      workspaceId: "workspace_demo",
      profileId: "profile_demo_backend",
    },
    question: "내 강점을 어떤 식으로 강조해야 하나요?",
  })

  assert.equal(result.answer.answerId, "ans_20260419020000")
  assert.equal(result.answer.markdown.includes("Personalized focus"), true)
  assert.equal(result.evidence.length, 3)
  assert.equal(result.evidence[0].kind, "personal")
  assert.equal(result.evidence[1].kind, "interpretation")
  assert.equal(result.evidence[2].kind, "fact")
  assert.equal(result.relatedDocuments.length, 3)
})
