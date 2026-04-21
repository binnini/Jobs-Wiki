import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  RECRUITING_PACK_VERSION,
  WORKNET_RECRUITING_V1_AMBIGUOUS_FIELDS,
  WORKNET_RECRUITING_V1_OMITTED_FIELDS,
  mapRecruitingSourceToDomainProposalBatch,
} from "../../packages/domain-packs/recruiting/mapper.ts";
import type { RecruitingSourcePayload } from "../../packages/integrations/worknet/src/recruiting.ts";

async function loadJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as T;
}

async function loadJsonFixture<T>(fixtureName: string): Promise<T> {
  return loadJsonFile(`tests/domain-packs/fixtures/${fixtureName}`);
}

test("maps a normalized WorkNet recruiting payload to the recruiting proposal batch", async () => {
  const payload = await loadJsonFixture<RecruitingSourcePayload>(
    "worknet-open-recruitment-source.json",
  );
  const expected = await loadJsonFixture(
    "worknet-open-recruitment-proposal-batch.json",
  );

  const actual = mapRecruitingSourceToDomainProposalBatch(payload);

  assert.deepEqual(actual, expected);
});

test("uses fallback identity hints and omits ambiguous v1-only fields", async () => {
  const payload = await loadJsonFixture<RecruitingSourcePayload>(
    "worknet-open-recruitment-source.json",
  );

  payload.company = {
    ...payload.company,
    sourceCompanyId: undefined,
    businessNumber: undefined,
    name: "  잡스위키  ",
  };
  payload.jobs = [
    { sourceCode: undefined, name: "플랫폼 엔지니어" },
    { sourceCode: "DEV-001" },
    { sourceCode: undefined, name: "플랫폼 엔지니어" },
  ];

  const batch = mapRecruitingSourceToDomainProposalBatch(payload);
  const company = batch.facts.find((fact) => fact.entityType === "company");
  const roles = batch.facts.filter((fact) => fact.entityType === "role");
  const posting = batch.facts.find((fact) => fact.entityType === "job_posting");

  assert.ok(company);
  assert.deepEqual(company.identityHints, {
    normalized_name: "잡스위키",
  });
  assert.match(company.proposalId, /^company:name:[0-9a-f]{12}$/);

  assert.equal(roles.length, 1);
  assert.deepEqual(roles[0]?.identityHints, {
    normalized_name: "플랫폼 엔지니어",
  });
  assert.match(roles[0]?.proposalId ?? "", /^role:name:[0-9a-f]{12}$/);

  assert.ok(posting);
  assert.equal("application_method" in posting.attributes, false);
  assert.equal("required_documents" in posting.attributes, false);
  assert.equal("inquiry" in posting.attributes, false);
  assert.equal("notes" in posting.attributes, false);
  assert.deepEqual(WORKNET_RECRUITING_V1_AMBIGUOUS_FIELDS, ["posting.notes"]);
  assert.ok(WORKNET_RECRUITING_V1_OMITTED_FIELDS.includes("attachments[]"));
});

test("keeps the mapper pack version aligned with the recruiting pack artifact", async () => {
  const pack = await loadJsonFile<{ manifest: { packVersion: string } }>(
    "packages/domain-packs/recruiting/v1.json",
  );

  assert.equal(RECRUITING_PACK_VERSION, pack.manifest.packVersion);
});

test("normalizes WorkNet HTML entities and mixed line breaks in posting text fields", async () => {
  const payload = await loadJsonFixture<RecruitingSourcePayload>(
    "worknet-open-recruitment-source.json",
  );

  payload.posting.summary = "플랫폼 API 개발&#xd;&nbsp;";
  payload.posting.acceptanceAnnouncement = " 개별 안내&#10; ";
  payload.posting.employmentType = " 정규직 | 정규직 | 기타 ";
  payload.recruitmentSections = [
    {
      title: "플랫폼팀",
      roleDescription: "API 설계 및 개발&#xd;",
      selectionDescription: "코딩 테스트&#xd;",
      location: " 서울&nbsp;",
      careerRequirement: "3년 이상&#xd;",
      educationRequirement: "대졸",
      otherRequirement: " Node.js 경험&nbsp;",
      openings: "2",
      note: "우대사항 있음",
    },
  ];
  payload.selectionSteps = [
    {
      name: "서류전형",
      schedule: "4월 2주",
      description: "서류 검토&#xd;",
      note: "합격자 개별 통보&nbsp;",
    },
  ];

  const batch = mapRecruitingSourceToDomainProposalBatch(payload);
  const posting = batch.facts.find((fact) => fact.entityType === "job_posting");

  assert.ok(posting);
  assert.equal(
    posting.attributes.summary,
    "플랫폼 API 개발\n\n플랫폼팀: API 설계 및 개발",
  );
  assert.equal(posting.attributes.employment_type, "정규직");
  assert.equal(posting.attributes.location_text, "서울");
  assert.equal(
    posting.attributes.requirements_text,
    "경력: 3년 이상\n학력: 대졸\n기타 요건: Node.js 경험",
  );
  assert.equal(
    posting.attributes.selection_process_text,
    "플랫폼팀: 코딩 테스트\n서류전형 | 일정: 4월 2주 | 설명: 서류 검토 | 비고: 합격자 개별 통보\n합격 발표: 개별 안내",
  );
});

test("keeps section titles in location and requirements when multiple distinct sections exist", async () => {
  const payload = await loadJsonFixture<RecruitingSourcePayload>(
    "worknet-open-recruitment-ambiguous-source.json",
  );

  payload.posting.employmentType = "정규직|기타|정규직전환형|기타";
  payload.recruitmentSections = [
    {
      title: "데이터팀",
      roleDescription: "배치 파이프라인 운영",
      selectionDescription: "실무 과제",
      location: "서울 강남",
      careerRequirement: "5년 이상",
      educationRequirement: "무관",
      otherRequirement: "SQL 숙련",
    },
    {
      title: "분석플랫폼팀",
      roleDescription: "지표 체계 운영",
      selectionDescription: "케이스 인터뷰",
      location: "서울 강남",
      careerRequirement: "3년 이상",
      educationRequirement: "학사 이상",
      otherRequirement: "Python 숙련",
    },
  ];

  const batch = mapRecruitingSourceToDomainProposalBatch(payload);
  const posting = batch.facts.find((fact) => fact.entityType === "job_posting");

  assert.ok(posting);
  assert.equal(posting.attributes.employment_type, "정규직|정규직전환형");
  assert.equal(
    posting.attributes.location_text,
    "데이터팀: 서울 강남\n분석플랫폼팀: 서울 강남",
  );
  assert.equal(
    posting.attributes.requirements_text,
    "데이터팀 경력: 5년 이상\n분석플랫폼팀 경력: 3년 이상\n데이터팀 학력: 무관\n분석플랫폼팀 학력: 학사 이상\n데이터팀 기타 요건: SQL 숙련\n분석플랫폼팀 기타 요건: Python 숙련",
  );
});
