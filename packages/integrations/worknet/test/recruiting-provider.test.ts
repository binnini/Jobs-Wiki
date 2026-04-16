import test from "node:test";
import assert from "node:assert/strict";
import {
  WORKNET_RECRUITING_PAYLOAD_VERSION,
  WorknetRecruitingProvider,
} from "../src/recruiting.ts";
import type { WorknetEmploymentApi } from "../src/adapter.ts";

function createEmploymentApiStub(): WorknetEmploymentApi {
  return {
    async listEmploymentEvents() {
      throw new Error("not implemented");
    },
    async getEmploymentEventDetail() {
      throw new Error("not implemented");
    },
    async listOpenRecruitments() {
      return {
        total: 1,
        page: 1,
        size: 1,
        items: [
          {
            empSeqno: "EMP-1",
            title: "백엔드 개발자",
            companyName: "잡스위키",
            companyTypeName: "중견기업",
            startDate: "2026-04-01",
            endDate: "2026-04-30",
            employmentTypeName: "정규직",
            detailUrl: "https://example.com/jobs/EMP-1",
            mobileUrl: "https://m.example.com/jobs/EMP-1",
          },
        ],
      };
    },
    async getOpenRecruitmentDetail() {
      return {
        empSeqno: "EMP-1",
        title: "백엔드 개발자",
        companyName: "잡스위키",
        companyTypeName: "중견기업",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        employmentTypeName: "정규직",
        submitDocumentContent: "이력서, 포트폴리오",
        receiptMethodContent: "홈페이지 접수",
        acceptanceAnnouncementContent: "개별 안내",
        inquiryContent: "recruit@example.com",
        etcContent: "원격 근무 가능",
        companyHomepage: "https://jobswiki.example.com",
        detailUrl: "https://example.com/jobs/EMP-1",
        mobileUrl: "https://m.example.com/jobs/EMP-1",
        jobs: [{ jobsCode: "DEV-001", jobsName: "백엔드 개발" }],
        selfIntroQuestions: ["자기소개를 작성하세요"],
        selectionSteps: [
          {
            name: "서류전형",
            schedule: "4월 2주",
            content: "서류 검토",
            memo: "합격자 개별 통보",
          },
        ],
        recruitmentSummary: "플랫폼 API 개발",
        recruitmentSections: [
          {
            name: "플랫폼팀",
            jobDescription: "API 설계 및 개발",
            selectionContent: "코딩 테스트",
            workRegion: "서울",
            careerRequirement: "3년 이상",
            educationRequirement: "대졸",
            otherRequirement: "Node.js 경험",
            recruitmentCount: "2",
            memo: "우대사항 있음",
          },
        ],
        commonRequirementContent: "협업 역량",
        attachments: [{ fileName: "guide.pdf" }],
      };
    },
    async listOpenRecruitCompanies() {
      return {
        total: 1,
        page: 1,
        size: 1,
        items: [
          {
            empCoNo: "COMP-1",
            companyName: "잡스위키",
            companyTypeName: "중견기업",
            businessNumber: "123-45-67890",
            homepage: "https://jobswiki.example.com",
            companyIntroSummary: "채용 정보 플랫폼",
            companyIntro: "개발자 중심의 채용 데이터 서비스를 운영합니다.",
            mainBusiness: "채용 데이터 플랫폼",
            latitude: "37.0",
            longitude: "127.0",
            logoUrl: "https://example.com/logo.png",
          },
        ],
      };
    },
    async getOpenRecruitCompanyDetail() {
      return {
        empCoNo: "COMP-1",
        companyName: "잡스위키",
        companyTypeName: "중견기업",
        homepage: "https://jobswiki.example.com",
        businessNumber: "123-45-67890",
        latitude: "37.0",
        longitude: "127.0",
        mainBusiness: "채용 데이터 플랫폼",
        companyIntroSummary: "채용 정보 플랫폼",
        companyIntro: "개발자 중심의 채용 데이터 서비스를 운영합니다.",
        logoUrl: "https://example.com/logo.png",
        welfare: [],
        history: [],
        rightPeople: [],
      };
    },
  };
}

test("lists recruiting source refs with domain-facing fields", async () => {
  const provider = new WorknetRecruitingProvider(createEmploymentApiStub(), {
    clock: () => new Date("2026-04-15T00:00:00.000Z"),
  });

  const page = await provider.listRecruitingSources({
    page: 1,
    size: 1,
    titleQuery: "백엔드",
  });

  assert.equal(page.items[0]?.payloadVersion, WORKNET_RECRUITING_PAYLOAD_VERSION);
  assert.equal(page.items[0]?.provider, "worknet");
  assert.equal(page.items[0]?.kind, "open_recruitment");
  assert.equal(page.items[0]?.sourceId, "EMP-1");
  assert.equal(page.items[0]?.title, "백엔드 개발자");
  assert.equal(page.items[0]?.companyName, "잡스위키");
  assert.equal("empSeqno" in page.items[0], false);
});

test("builds normalized recruiting payload without exposing raw-only field names", async () => {
  const provider = new WorknetRecruitingProvider(createEmploymentApiStub(), {
    clock: () => new Date("2026-04-15T00:00:00.000Z"),
  });

  const payload = await provider.getRecruitingSource({
    sourceId: "EMP-1",
  });

  assert.equal(payload.payloadVersion, WORKNET_RECRUITING_PAYLOAD_VERSION);
  assert.equal(payload.source.provider, "worknet");
  assert.equal(payload.source.kind, "open_recruitment");
  assert.equal(payload.posting.title, "백엔드 개발자");
  assert.equal(payload.posting.applicationMethod, "홈페이지 접수");
  assert.equal(payload.company?.name, "잡스위키");
  assert.equal(payload.company?.sourceCompanyId, "COMP-1");
  assert.equal(payload.jobs[0]?.name, "백엔드 개발");
  assert.equal(payload.recruitmentSections[0]?.title, "플랫폼팀");
  assert.equal(payload.selectionSteps[0]?.name, "서류전형");
  assert.equal(payload.attachments[0]?.fileName, "guide.pdf");
  assert.equal(typeof payload.source.contentHash, "string");
  assert.equal("empSeqno" in payload.posting, false);
  assert.equal("empCoNo" in (payload.company ?? {}), false);
  assert.equal(payload.raw, undefined);
});

test("includes optional raw block only when requested", async () => {
  const provider = new WorknetRecruitingProvider(createEmploymentApiStub(), {
    clock: () => new Date("2026-04-15T00:00:00.000Z"),
  });

  const payload = await provider.getRecruitingSource({
    sourceId: "EMP-1",
    includeRaw: true,
  });

  assert.equal(payload.raw?.openRecruitmentDetail?.empSeqno, "EMP-1");
  assert.equal(payload.raw?.openRecruitmentCompanyDetail?.empCoNo, "COMP-1");
});
