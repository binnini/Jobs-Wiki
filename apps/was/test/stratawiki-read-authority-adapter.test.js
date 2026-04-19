import test from "node:test"
import assert from "node:assert/strict"
import {
  createStratawikiReadAuthorityAdapter,
} from "../src/adapters/read-authority/stratawiki-read-authority-adapter.js"

const SNAPSHOT_POINTER = {
  current_snapshot_id: "fact_snap:recruiting:test",
  fact_snapshot_id: "fact_snap:recruiting:test",
  updated_at: "2026-04-19T00:36:15.801Z",
}

const POSTINGS = [
  {
    canonical_key: "job_posting:159436",
    fact_snapshot_id: "fact_snap:recruiting:test",
    updated_at: "2026-04-19T00:36:15.801Z",
    attributes_json: {
      title: "2026년 제1회 공무직 신입사원 채용(버스운전원 등)",
      summary: "상세 모집요강 참조",
      opens_at: "20260413",
      closes_at: "20260424",
      source_url: "https://example.test/postings/159436",
      location_text: "인천",
      employment_type: "정규직",
      requirements_text: "운전 경력 우대",
      selection_process_text: "서류전형 -> 면접전형",
    },
  },
  {
    canonical_key: "job_posting:159423",
    fact_snapshot_id: "fact_snap:recruiting:test",
    updated_at: "2026-04-19T00:36:15.801Z",
    attributes_json: {
      title: "2026년 상반기 신입직원 채용",
      summary: "사무행정 外",
      opens_at: "20260420",
      closes_at: "20260427",
      source_url: "https://example.test/postings/159423",
      location_text: "울산 남구",
      employment_type: "채용형 인턴",
      requirements_text: "정보기술(IT), 통계",
      selection_process_text: "서류전형 -> 필기전형 -> 면접전형",
    },
  },
]

const COMPANIES = [
  {
    canonical_key: "company:E000000320",
    attributes_json: {
      name: "인천교통공사",
      summary: "종합교통 공기업",
      description: "도시철도와 버스 운영",
      homepage_url: "http://www.ictr.or.kr",
      main_business: "도시철도 건설,운영",
    },
  },
  {
    canonical_key: "company:E000001197",
    attributes_json: {
      name: "울산항만공사",
      summary: "공공 항만 운영기관",
      description: "울산항 개발과 운영",
    },
  },
]

const ROLES = [
  {
    canonical_key: "role:542002",
    attributes_json: {
      display_name: "버스 운전원",
    },
  },
  {
    canonical_key: "role:017",
    attributes_json: {
      display_name: "경영지원 사무",
    },
  },
  {
    canonical_key: "role:10",
    attributes_json: {
      display_name: "정보기술",
    },
  },
]

const RELATIONS = [
  {
    relation_type: "posted_by",
    from_canonical_key: "job_posting:159436",
    to_canonical_key: "company:E000000320",
  },
  {
    relation_type: "posted_by",
    from_canonical_key: "job_posting:159423",
    to_canonical_key: "company:E000001197",
  },
  {
    relation_type: "for_role",
    from_canonical_key: "job_posting:159436",
    to_canonical_key: "role:542002",
  },
  {
    relation_type: "for_role",
    from_canonical_key: "job_posting:159423",
    to_canonical_key: "role:017",
  },
  {
    relation_type: "for_role",
    from_canonical_key: "job_posting:159423",
    to_canonical_key: "role:10",
  },
]

function createQueryJsonStub() {
  return async function queryJson({ sql }) {
    if (sql.includes("FROM ops.snapshot_pointer")) {
      return SNAPSHOT_POINTER
    }

    if (sql.includes("entity_type = 'job_posting'")) {
      return POSTINGS
    }

    if (sql.includes("entity_type = 'company'")) {
      return COMPANIES
    }

    if (sql.includes("entity_type = 'role'")) {
      return ROLES
    }

    if (sql.includes("FROM fact.relation_envelopes")) {
      return RELATIONS
    }

    throw new Error(`Unexpected SQL in test stub: ${sql}`)
  }
}

function createAdapter() {
  return createStratawikiReadAuthorityAdapter({
    env: {
      readDatabaseUrl: "postgresql://example.test/stratawiki",
      readPsqlBin: "psql",
      readDomain: "recruiting",
      readScope: "shared",
    },
    queryJson: createQueryJsonStub(),
    now: () => new Date("2026-04-19T00:00:00.000Z"),
  })
}

test("real read adapter maps live records into opportunity list projections", async () => {
  const adapter = createAdapter()
  const response = await adapter.listOpportunities({
    query: {
      limit: 1,
    },
  })

  assert.equal(response.items.length, 1)
  assert.equal(response.items[0].title, "2026년 제1회 공무직 신입사원 채용(버스운전원 등)")
  assert.equal(response.items[0].companyName, "인천교통공사")
  assert.deepEqual(response.items[0].roleLabels, ["버스 운전원"])
  assert.equal(response.items[0].status, "closing_soon")
  assert.equal(response.items[0].urgencyLabel, "D-5")
  assert.equal(response.nextCursor, "cursor_001")
  assert.equal(response.sync.visibility, "applied")
})

test("real read adapter maps one opportunity detail with source, company, and evidence", async () => {
  const adapter = createAdapter()
  const listResponse = await adapter.listOpportunities()
  const opportunityId = listResponse.items[0].opportunityId
  const detail = await adapter.getOpportunityDetail({
    opportunityId,
  })

  assert.equal(detail.opportunityId, opportunityId)
  assert.equal(detail.source.provider, "worknet")
  assert.equal(detail.source.sourceId, "159436")
  assert.equal(detail.company.name, "인천교통공사")
  assert.equal(detail.roles.length, 1)
  assert.equal(detail.roles[0].label, "버스 운전원")
  assert.equal(detail.analysis.riskSummary.includes("source-only"), true)
  assert.equal(detail.evidence[0].provenance.connector, "worknet")
  assert.equal(detail.sync.version, "fact_snap:recruiting:test")
})

test("real read adapter returns a fallback workspace summary when personal context is absent", async () => {
  const adapter = createAdapter()
  const summary = await adapter.getWorkspaceSummary({
    userContext: {
      profileId: "profile_001",
    },
  })

  assert.equal(summary.profileSnapshot.targetRole, "Profile profile_001 pending context hydration")
  assert.equal(summary.recommendedOpportunities.length, 2)
  assert.equal(summary.marketBrief.notableCompanies[0], "인천교통공사")
  assert.equal(summary.skillsGap.recommendedToStrengthen.includes("Provision personal profile context"), true)
})

test("real read adapter returns time-sorted calendar records", async () => {
  const adapter = createAdapter()
  const calendar = await adapter.getCalendar({
    query: {
      from: "2026-04-24",
      to: "2026-04-27",
    },
  })

  assert.equal(calendar.items.length, 2)
  assert.equal(calendar.items[0].label, "2026년 제1회 공무직 신입사원 채용(버스운전원 등) closes")
  assert.equal(calendar.items[0].companyName, "인천교통공사")
  assert.equal(calendar.items[1].companyName, "울산항만공사")
})

test("real read adapter raises not_found for malformed opportunity ids", async () => {
  const adapter = createAdapter()

  await assert.rejects(
    () =>
      adapter.getOpportunityDetail({
        opportunityId: "opp_not_a_real_identifier",
      }),
    {
      code: "not_found",
    },
  )
})
