export const opportunityListFixture = [
  {
    opportunityId: "opp_backend_platform",
    objectId: "opportunity:backend_platform",
    title: "Backend Platform Engineer",
    companyName: "Northstar Data",
    roleLabels: ["Backend", "Platform"],
    summary: "Internal API platform and developer tooling for a report-first product.",
    employmentType: "full_time",
    opensAt: "2026-04-01",
    closesAt: "2026-04-30",
    status: "open",
    urgencyLabel: "29 days left",
    closingInDays: 12,
    whyMatched: "Strong overlap with Node.js service architecture.",
    sourceLabel: "mock_fixture",
  },
  {
    opportunityId: "opp_product_data",
    objectId: "opportunity:product_data",
    title: "Product Data Analyst",
    companyName: "Fieldline",
    roleLabels: ["Analytics", "SQL"],
    summary: "Opportunity scoring, reporting, and dashboard design for hiring workflows.",
    employmentType: "contract",
    opensAt: "2026-04-05",
    closesAt: "2026-04-24",
    status: "closing_soon",
    urgencyLabel: "Closes soon",
    closingInDays: 6,
    whyMatched: "Relevant to report generation and evidence surfacing.",
    sourceLabel: "mock_fixture",
  },
]

export const opportunityDetailsFixture = {
  opp_backend_platform: {
    opportunityId: "opp_backend_platform",
    objectId: "opportunity:backend_platform",
    title: "Backend Platform Engineer",
    summary: "Build API surfaces for hiring intelligence products.",
    descriptionMarkdown:
      "Lead the WAS layer for report-first workflows, API composition, and adapter boundaries.",
    employmentType: "full_time",
    opensAt: "2026-04-01",
    closesAt: "2026-04-30",
    status: "open",
    source: {
      provider: "mock",
      sourceId: "mock-opp-001",
      sourceUrl: "https://example.test/opportunities/mock-opp-001",
    },
    company: {
      objectId: "company:northstar_data",
      name: "Northstar Data",
      summary: "Builds workflow systems for recruiting and market intelligence.",
      homepageUrl: "https://example.test/northstar-data",
      mainBusiness: "Hiring operations software",
    },
    roles: [
      {
        objectId: "role:backend_engineer",
        label: "Backend Engineer",
      },
      {
        objectId: "role:platform_engineer",
        label: "Platform Engineer",
      },
    ],
    qualification: {
      locationText: "Hybrid / Seoul",
      requirementsText: "Node.js, API design, integration boundaries, observability.",
      selectionProcessText: "Screening -> technical interview -> final loop",
    },
    analysis: {
      fitScore: 81,
      strengthsSummary: "Relevant experience with API and runtime scaffolding.",
      riskSummary: "Needs deeper evidence around large-scale platform migrations.",
    },
    evidence: [
      {
        evidenceId: "evidence_backend_scope",
        kind: "interpretation",
        label: "Past work maps well to service boundary design.",
        documentObjectId: "document:resume",
        documentObjectKind: "document",
        documentTitle: "Resume Snapshot",
        excerpt: "Implemented service orchestration and adapter abstraction in prior role.",
      },
    ],
    relatedDocuments: [
      {
        documentObjectId: "document:note:adapter_boundary",
        documentObjectKind: "note",
        documentTitle: "Adapter Boundary Note",
        role: "interpretation",
        excerpt: "Keep raw provider structure below the adapter boundary.",
      },
    ],
    sync: {
      visibility: "applied",
      version: "mock-v1",
      visibleAt: "2026-04-18T09:00:00.000Z",
    },
  },
  opp_product_data: {
    opportunityId: "opp_product_data",
    objectId: "opportunity:product_data",
    title: "Product Data Analyst",
    summary: "Support report metrics, opportunity scoring, and calendar insight blocks.",
    descriptionMarkdown:
      "Own reporting quality, KPI definitions, and opportunity evidence summaries.",
    employmentType: "contract",
    opensAt: "2026-04-05",
    closesAt: "2026-04-24",
    status: "closing_soon",
    source: {
      provider: "mock",
      sourceId: "mock-opp-002",
      sourceUrl: "https://example.test/opportunities/mock-opp-002",
    },
    company: {
      objectId: "company:fieldline",
      name: "Fieldline",
      summary: "Analytics-heavy hiring workflow products.",
    },
    roles: [
      {
        objectId: "role:data_analyst",
        label: "Data Analyst",
      },
    ],
    qualification: {
      locationText: "Remote",
      requirementsText: "SQL, experimentation, dashboard writing.",
      selectionProcessText: "Portfolio review -> hiring manager -> take-home",
    },
    analysis: {
      fitScore: 72,
      strengthsSummary: "Strong fit for evidence-oriented reporting workflows.",
      riskSummary: "Less direct product analytics evidence than platform work.",
    },
    evidence: [
      {
        evidenceId: "evidence_reporting",
        kind: "fact",
        label: "Has experience shipping analytics dashboards.",
        documentObjectId: "document:portfolio",
        documentObjectKind: "document",
        documentTitle: "Portfolio",
        excerpt: "Built executive KPI dashboards for operational reporting.",
      },
    ],
    relatedDocuments: [
      {
        documentObjectId: "document:note:report_first",
        documentObjectKind: "note",
        documentTitle: "Report-first MVP note",
        role: "fact",
        excerpt: "Report blocks are the main surface in the current MVP baseline.",
      },
    ],
    sync: {
      visibility: "partial",
      version: "mock-v1",
      visibleAt: "2026-04-18T09:00:00.000Z",
    },
  },
}
