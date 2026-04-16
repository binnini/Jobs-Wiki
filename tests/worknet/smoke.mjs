import { createHash } from "node:crypto";
import { WorknetClient } from "../../packages/integrations/worknet/src/client.ts";

process.loadEnvFile?.(".env");

const KEYS = {
  employment: process.env.EMPLOYMENT_INFO,
  nationalTraining: process.env.NATIONAL_TRAINING,
  businessTraining: process.env.BUSINESS_TRAINING,
  consortiumTraining: process.env.NATIONAL_HUMAN_RESOURCES,
  jobPrograms: process.env.JOB_SEEKER_EMPLOYMENT,
  smallGiant: process.env.SMALL_GIANT_COMPANY,
  department: process.env.DEPARTMENT_INFO,
  jobInfo: process.env.JOB_INFORMATION,
  jobDescription: process.env.JOB_DESCRIPTIONS,
  workStudy: process.env.WORK_WITH_STUDY_TRAINING,
};

function requireEnv(name, value) {
  if (!value) throw new Error(`Missing env key: ${name}`);
  return value;
}

function sanitize(value) {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const client = new WorknetClient({ keys: KEYS });

async function testEmploymentEventListAndDetail() {
  requireEnv("EMPLOYMENT_INFO", KEYS.employment);
  const list = await client.listEmploymentEvents({
    page: 1,
    size: 5,
  });
  const first = list.items[0];
  if (!first?.eventNo || !first?.areaCode) throw new Error("No eventNo/areaCode found");

  const detail = await client.getEmploymentEventDetail({
    areaCode: first.areaCode,
    eventNo: first.eventNo,
  });
  if (!detail.eventName) throw new Error("Employment event detail is empty");
  return { eventNo: sanitize(first.eventNo), areaCd: first.areaCode };
}

async function testOpenRecruitListAndDetail() {
  requireEnv("EMPLOYMENT_INFO", KEYS.employment);
  const list = await client.listOpenRecruitments({ page: 1, size: 5 });
  const first = list.items[0];
  if (!first?.empSeqno) throw new Error("No empSeqno found");

  const detail = await client.getOpenRecruitmentDetail({ empSeqno: first.empSeqno });
  if (!detail.title) throw new Error("Open recruitment detail is empty");
  return { empSeqno: sanitize(first.empSeqno) };
}

async function testOpenRecruitCompanyListAndDetail() {
  requireEnv("EMPLOYMENT_INFO", KEYS.employment);
  const list = await client.listOpenRecruitCompanies({ page: 1, size: 5 });
  const first = list.items[0];
  if (!first?.empCoNo) throw new Error("No empCoNo found");

  const detail = await client.getOpenRecruitCompanyDetail({ empCoNo: first.empCoNo });
  if (!detail.companyName) throw new Error("Open recruit company detail is empty");
  return { empCoNo: sanitize(first.empCoNo) };
}

async function testTrainingFamily(kind, envKeyName, keyValue, endpoints) {
  requireEnv(envKeyName, keyValue);
  const list = await client.listTrainings({
    kind,
    page: 1,
    size: 5,
    startDate: "20260101",
    endDate: "20261231",
    sort: "ASC",
    sortColumn: "2",
  });
  const first = list.items[0];
  if (!first?.trainingCourseId) throw new Error(`No trainingCourseId found for ${kind}`);

  const detail = await client.getTrainingDetail({
    kind,
    trainingCourseId: first.trainingCourseId,
    trainingCourseDegree: first.trainingCourseDegree,
    trainingOrganizationId: first.trainingInstitutionId,
  });
  if (!detail.baseInfo.trainingCourseId) throw new Error(`${kind} training detail is empty`);

  const schedules = await client.listTrainingSchedules({
    kind,
    trainingCourseId: first.trainingCourseId,
    trainingCourseDegree: first.trainingCourseDegree,
    trainingOrganizationId: first.trainingInstitutionId,
  });
  if (!Array.isArray(schedules)) throw new Error(`${kind} training schedules failed`);

  return {
    trprId: sanitize(first.trainingCourseId),
    trprDegr: first.trainingCourseDegree,
    torgId: sanitize(first.trainingInstitutionId),
  };
}

async function testJobPrograms() {
  requireEnv("JOB_SEEKER_EMPLOYMENT", KEYS.jobPrograms);
  const page = await client.listJobPrograms({ page: 1, size: 5 });
  const first = page.items[0];
  return {
    orgName: sanitize(first?.orgName),
    programName: sanitize(first?.programName),
  };
}

async function testSmallGiantList() {
  requireEnv("SMALL_GIANT_COMPANY", KEYS.smallGiant);
  const page = await client.listSmallGiantCompanies({ page: 1, size: 5 });
  return { companyName: sanitize(page.items[0]?.companyName) };
}

async function testSmallGiantSpotList() {
  requireEnv("SMALL_GIANT_COMPANY", KEYS.smallGiant);
  const page = await client.request(
    "wk/callOpenApiSvcInfo216L11.do",
    {
      authKey: KEYS.smallGiant,
      returnType: "XML",
      callTp: "L",
      startPage: 1,
      display: 5,
    },
    "testSmallGiantSpotList",
  );
  return { compNm: sanitize(page.match(/<compNm>([\s\S]*?)<\/compNm>/i)?.[1]?.trim()) };
}

async function testYouthExperienceList() {
  requireEnv("SMALL_GIANT_COMPANY", KEYS.smallGiant);
  const xml = await client.request(
    "wk/callOpenApiSvcInfo216L21.do",
    {
      authKey: KEYS.smallGiant,
      returnType: "XML",
      callTp: "L",
      startPage: 1,
      display: 5,
      sregDtmValCd: 6,
    },
    "testYouthExperienceList",
  );
  return { wantedAuthNo: sanitize(xml.match(/<wantedAuthNo>([\s\S]*?)<\/wantedAuthNo>/i)?.[1]?.trim()) };
}

async function testYouthFriendlyList() {
  requireEnv("SMALL_GIANT_COMPANY", KEYS.smallGiant);
  const xml = await client.request(
    "wk/callOpenApiSvcInfo216L31.do",
    {
      authKey: KEYS.smallGiant,
      returnType: "XML",
      startPage: 1,
      display: 5,
    },
    "testYouthFriendlyList",
  );
  return { companyName: sanitize(xml.match(/<coNm>([\s\S]*?)<\/coNm>/i)?.[1]?.trim()) };
}

async function testDepartmentListAndDetails() {
  const searchKeywords = ["디자인", "컴퓨터", "게임"];
  let list;
  for (const keyword of searchKeywords) {
    const result = await client.searchDepartments({
      authKey: requireEnv("DEPARTMENT_INFO", KEYS.department),
      searchType: "K",
      keyword,
    });
    if (result.length > 0) {
      list = result;
      break;
    }
  }
  if (!list) throw new Error("No department list result found");

  const general = list.find((item) => item.majorGb === "1");
  const special = list.find((item) => item.majorGb === "2");
  if (!general) throw new Error("No general department found");

  const generalDetail = await client.getGeneralDepartmentDetail({
    categoryId: general.categoryId,
    departmentId: general.departmentId,
  });
  if (!generalDetail.departmentName) throw new Error("General department detail is empty");

  if (!special) {
    return {
      generalDepartmentId: sanitize(general.departmentId),
      specialDepartmentId: undefined,
    };
  }

  const specialDetail = await client.getSpecialDepartmentDetail({
    categoryId: special.categoryId,
    departmentId: special.departmentId,
  });
  if (!specialDetail.departmentName) throw new Error("Special department detail is empty");

  return {
    generalDepartmentId: sanitize(general.departmentId),
    specialDepartmentId: sanitize(special.departmentId),
  };
}

async function testJobListAndDetails() {
  const jobs = await client.searchJobs({
    authKey: requireEnv("JOB_INFORMATION", KEYS.jobInfo),
    searchType: "K",
    keyword: "개발",
  });
  const first = jobs[0];
  if (!first?.jobCode) throw new Error("No jobCode found");

  const summary = await client.getJobSummaryDetail({ jobCode: first.jobCode });
  const work = await client.getJobWorkDetail({ jobCode: first.jobCode });
  const education = await client.getJobEducationDetail({ jobCode: first.jobCode });
  const salary = await client.getJobSalaryProspectDetail({ jobCode: first.jobCode });
  const ability = await client.getJobAbilityKnowledgeEnvironmentDetail({
    jobCode: first.jobCode,
  });
  const character = await client.getJobCharacterInterestValueDetail({
    jobCode: first.jobCode,
  });
  const activity = await client.getJobActivityDetail({ jobCode: first.jobCode });

  if (!summary.jobCode || !work.jobCode || !education.jobCode || !salary.jobCode) {
    throw new Error("Job detail failed");
  }
  if (!ability.jobCode || !character.jobCode || !activity.jobCode) {
    throw new Error("Job metric detail failed");
  }

  return { jobCd: sanitize(first.jobCode) };
}

const TESTS = [
  ["employment-event", testEmploymentEventListAndDetail],
  ["open-recruitment", testOpenRecruitListAndDetail],
  ["open-recruit-company", testOpenRecruitCompanyListAndDetail],
  [
    "training-national",
    () =>
      testTrainingFamily("national", "NATIONAL_TRAINING", KEYS.nationalTraining),
  ],
  [
    "training-business",
    () =>
      testTrainingFamily("business", "BUSINESS_TRAINING", KEYS.businessTraining),
  ],
  [
    "training-consortium",
    () =>
      testTrainingFamily("consortium", "NATIONAL_HUMAN_RESOURCES", KEYS.consortiumTraining),
  ],
  ["job-programs", testJobPrograms],
  [
    "training-work-study",
    () =>
      testTrainingFamily("work-study", "WORK_WITH_STUDY_TRAINING", KEYS.workStudy),
  ],
  ["small-giant", testSmallGiantList],
  ["small-giant-spot", testSmallGiantSpotList],
  ["youth-experience", testYouthExperienceList],
  ["youth-friendly", testYouthFriendlyList],
  ["department", testDepartmentListAndDetails],
  ["job", testJobListAndDetails],
];

async function main() {
  const results = [];
  let failed = false;

  for (const [name, fn] of TESTS) {
    const startedAt = Date.now();
    try {
      const detail = await fn();
      results.push({
        name,
        ok: true,
        durationMs: Date.now() - startedAt,
        detail,
      });
      console.log(`PASS ${name} ${Date.now() - startedAt}ms`);
    } catch (error) {
      failed = true;
      results.push({
        name,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`FAIL ${name} ${Date.now() - startedAt}ms`);
      console.error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log(JSON.stringify({ results }, null, 2));
  if (failed) process.exitCode = 1;
}

await main();
