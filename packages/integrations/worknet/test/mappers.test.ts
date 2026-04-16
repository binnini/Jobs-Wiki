import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  mapEmploymentEventDetail,
  mapEmploymentEventListItem,
  mapHrdTrainingDetail,
  mapJobSummaryDetail,
  mapJobWorkDetail,
  mapOpenRecruitListItem,
  mapOpenRecruitmentDetail,
} from "../src/mappers.ts";

const fixture = async (name: string) =>
  readFile(resolve("packages/integrations/worknet/test/fixtures", name), "utf8");

test("maps employment event list item", async () => {
  const xml = await fixture("employment-event-list.xml");
  const result = mapEmploymentEventListItem(xml);
  assert.equal(result.areaCode, "51");
  assert.equal(result.eventNo, "EVT001");
  assert.equal(result.eventName, "청년 채용박람회");
});

test("maps employment event detail", async () => {
  const xml = await fixture("employment-event-detail.xml");
  const result = mapEmploymentEventDetail(xml);
  assert.equal(result.eventPlace, "서울시청");
  assert.equal(result.inquiryPhone, "02-1234-5678");
});

test("maps open recruitment list item", async () => {
  const xml = await fixture("open-recruit-list-item.xml");
  const result = mapOpenRecruitListItem(xml);
  assert.equal(result.empSeqno, "12345");
  assert.equal(result.companyName, "잡스위키");
  assert.equal(result.employmentTypeName, "정규직");
});

test("maps open recruitment detail", async () => {
  const xml = await fixture("open-recruit-detail.xml");
  const result = mapOpenRecruitmentDetail(xml);
  assert.equal(result.jobs[0]?.jobsName, "서버개발자");
  assert.equal(result.selfIntroQuestions[0], "자기소개를 작성하세요");
  assert.equal(result.selectionSteps[0]?.name, "서류전형");
  assert.equal(result.recruitmentSections[0]?.name, "플랫폼팀");
  assert.equal(result.attachments[0]?.fileName, "guide.pdf");
});

test("falls back to request identity and facility customer when work-study base info is empty", async () => {
  const xml = await fixture("work-study-detail-empty-base.xml");
  const result = mapHrdTrainingDetail(xml, {
    trainingCourseId: "ABG20253001146958",
    trainingCourseDegree: "1",
  });
  assert.equal(result.baseInfo.trainingCourseId, "ABG20253001146958");
  assert.equal(result.baseInfo.trainingCourseDegree, "1");
  assert.equal(result.baseInfo.institutionName, "천안공업고등학교");
});

test("maps nested job summary using last jobSum value", async () => {
  const xml = await fixture("job-summary.xml");
  const result = mapJobSummaryDetail(xml);
  assert.equal(result.jobCode, "K000001163");
  assert.equal(result.summary, "금융상품을 개발한다.");
  assert.equal(result.relatedMajors[0]?.name, "경영학과");
});

test("maps job work detail", async () => {
  const xml = await fixture("job-work.xml");
  const result = mapJobWorkDetail(xml);
  assert.equal(result.executionJob, "시장조사와 상품 설계를 수행한다.");
  assert.equal(result.relatedJobs[0]?.name, "자산운용가");
});
