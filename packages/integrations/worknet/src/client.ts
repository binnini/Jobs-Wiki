import type { WorknetApiAdapter, WorknetJobApi } from "./adapter.ts";
import type {
  HrdTrainingIdentity,
  HrdTrainingKind,
  HrdTrainingListParams,
  JobDetailIdentity,
  JobProgramListParams,
  JobSearchParams,
  SmallGiantCompanyListParams,
} from "./types.ts";
import {
  mapEmploymentEventDetail,
  mapEmploymentEventListItem,
  mapHrdTrainingDetail,
  mapHrdTrainingListItem,
  mapHrdTrainingScheduleItem,
  mapJobEducationDetail,
  mapJobListItem,
  mapJobSalaryProspectDetail,
  mapJobSummaryDetail,
  mapJobWorkDetail,
  mapMetricBlocks,
  mapOpenRecruitCompanyDetail,
  mapOpenRecruitCompanyListItem,
  mapOpenRecruitListItem,
  mapOpenRecruitmentDetail,
  mapPage,
} from "./mappers.ts";
import { buildUrl, findAll, findBlocks, findFirst, toBoolFlag } from "./xml.ts";

const DEFAULT_BASE_URL = "https://www.work24.go.kr/cm/openApi/call";

const TRAINING_ENDPOINTS: Record<
  HrdTrainingKind,
  { list: string; detail: string; schedule: string }
> = {
  national: {
    list: "hr/callOpenApiSvcInfo310L01.do",
    detail: "hr/callOpenApiSvcInfo310L02.do",
    schedule: "hr/callOpenApiSvcInfo310L03.do",
  },
  business: {
    list: "hr/callOpenApiSvcInfo311L01.do",
    detail: "hr/callOpenApiSvcInfo311D01.do",
    schedule: "hr/callOpenApiSvcInfo311D02.do",
  },
  consortium: {
    list: "hr/callOpenApiSvcInfo312L01.do",
    detail: "hr/callOpenApiSvcInfo312D01.do",
    schedule: "hr/callOpenApiSvcInfo312D02.do",
  },
  "work-study": {
    list: "hr/callOpenApiSvcInfo313L01.do",
    detail: "hr/callOpenApiSvcInfo313D01.do",
    schedule: "hr/callOpenApiSvcInfo313D02.do",
  },
};

export type WorknetAuthKeyMap = {
  employment?: string;
  nationalTraining?: string;
  businessTraining?: string;
  consortiumTraining?: string;
  jobPrograms?: string;
  smallGiant?: string;
  department?: string;
  jobInfo?: string;
  jobDescription?: string;
  workStudy?: string;
};

export type WorknetClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  keys?: WorknetAuthKeyMap;
};

function mapDetailKey(category: string): keyof WorknetAuthKeyMap {
  switch (category) {
    case "employment":
      return "employment";
    case "national":
      return "nationalTraining";
    case "business":
      return "businessTraining";
    case "consortium":
      return "consortiumTraining";
    case "jobPrograms":
      return "jobPrograms";
    case "smallGiant":
      return "smallGiant";
    case "department":
      return "department";
    case "jobInfo":
      return "jobInfo";
    case "jobDescription":
      return "jobDescription";
    case "work-study":
      return "workStudy";
    default:
      return category as keyof WorknetAuthKeyMap;
  }
}

export class WorknetClient implements WorknetApiAdapter {
  readonly baseUrl: string;
  readonly fetchImpl: typeof fetch;
  readonly keys: WorknetAuthKeyMap;

  constructor(options: WorknetClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.keys = options.keys ?? {};

    if (typeof this.fetchImpl !== "function") {
      throw new Error("WorknetClient requires fetch");
    }
  }

  resolveAuthKey(category: string, override?: string): string {
    if (override) return override;
    const key = this.keys[mapDetailKey(category)];
    if (!key) {
      throw new Error(`Missing authKey for category: ${category}`);
    }
    return key;
  }

  async request(
    path: string,
    query: Record<string, unknown>,
    context: string,
  ): Promise<string> {
    const url = buildUrl(this.baseUrl, path, query);
    const response = await this.fetchImpl(url, {
      headers: {
        "user-agent": "Jobs-Wiki-WorknetClient/1.0",
        accept: "application/xml,text/xml,*/*",
      },
    });
    const xml = await response.text();
    if (!response.ok) {
      throw new Error(`${context} failed: HTTP ${response.status}: ${xml.slice(0, 200)}`);
    }
    return xml;
  }

  async listEmploymentEvents(params: Parameters<WorknetApiAdapter["listEmploymentEvents"]>[0]) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo210L11.do",
      {
        authKey: this.resolveAuthKey("employment", params.authKey),
        returnType: params.returnType ?? "XML",
        callTp: "L",
        startPage: params.page,
        display: params.size,
        srchBgnDt: params.startDate,
        srchEndDt: params.endDate,
        keyword: params.keyword,
        areaCd: params.areaCode,
      },
      "listEmploymentEvents",
    );
    return mapPage(xml, findBlocks(xml, "empEvent").map(mapEmploymentEventListItem));
  }

  async getEmploymentEventDetail(
    params: Parameters<WorknetApiAdapter["getEmploymentEventDetail"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo210D11.do",
      {
        authKey: this.resolveAuthKey("employment", params.authKey),
        returnType: params.returnType ?? "XML",
        callTp: "D",
        areaCd: params.areaCode,
        eventNo: params.eventNo,
      },
      "getEmploymentEventDetail",
    );
    return mapEmploymentEventDetail(xml);
  }

  async listOpenRecruitments(
    params: Parameters<WorknetApiAdapter["listOpenRecruitments"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo210L21.do",
      {
        authKey: this.resolveAuthKey("employment", params.authKey),
        callTp: "L",
        returnType: params.returnType ?? "XML",
        startPage: params.page,
        display: params.size,
        coClcd: params.companyTypeCodes,
        empWantedTypeCd: params.employmentTypeCodes,
        empWantedCareerCd: params.careerTypeCodes,
        jobsCd: params.jobsCode,
        empWantedTitle: params.title,
        empWantedEduCd: params.educationLevelCodes,
        sortField: params.sortField,
        sortOrderBy: params.sortOrder,
        busino: params.businessNumber,
      },
      "listOpenRecruitments",
    );
    return mapPage(xml, findBlocks(xml, "dhsOpenEmpInfo").map(mapOpenRecruitListItem));
  }

  async getOpenRecruitmentDetail(
    params: Parameters<WorknetApiAdapter["getOpenRecruitmentDetail"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo210D21.do",
      {
        authKey: this.resolveAuthKey("employment", params.authKey),
        returnType: params.returnType ?? "XML",
        callTp: "D",
        empSeqno: params.empSeqno,
        empSelfintroOfferYn: toBoolFlag(params.includeSelfIntroQuestions, "Y"),
        empSelsOfferYn: toBoolFlag(params.includeSelectionSteps, "Y"),
        empRecrOfferYn: toBoolFlag(params.includeRecruitmentSections, "Y"),
      },
      "getOpenRecruitmentDetail",
    );
    return mapOpenRecruitmentDetail(xml);
  }

  async listOpenRecruitCompanies(
    params: Parameters<WorknetApiAdapter["listOpenRecruitCompanies"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo210L31.do",
      {
        authKey: this.resolveAuthKey("employment", params.authKey),
        callTp: "L",
        returnType: params.returnType ?? "XML",
        startPage: params.page,
        display: params.size,
        coClcd: params.companyTypeCodes,
        sortField: params.sortField,
        sortOrderBy: params.sortOrder,
        coNm: params.companyName,
      },
      "listOpenRecruitCompanies",
    );
    return mapPage(
      xml,
      findBlocks(xml, "dhsOpenEmpHireInfo").map(mapOpenRecruitCompanyListItem),
    );
  }

  async getOpenRecruitCompanyDetail(
    params: Parameters<WorknetApiAdapter["getOpenRecruitCompanyDetail"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo210D31.do",
      {
        authKey: this.resolveAuthKey("employment", params.authKey),
        returnType: params.returnType ?? "XML",
        callTp: "D",
        empCoNo: params.empCoNo,
      },
      "getOpenRecruitCompanyDetail",
    );
    return mapOpenRecruitCompanyDetail(xml);
  }

  async listTrainings(params: HrdTrainingListParams) {
    const endpoints = TRAINING_ENDPOINTS[params.kind];
    const xml = await this.request(
      endpoints.list,
      {
        authKey: this.resolveAuthKey(params.kind, params.authKey),
        returnType: params.returnType ?? "XML",
        outType: 1,
        pageNum: params.page,
        pageSize: params.size,
        wkendSe: params.weekendCode,
        srchTraArea1: params.area1,
        srchTraArea2: params.area2,
        srchNcs1: params.ncs1,
        srchNcs2: params.ncs2,
        srchNcs3: params.ncs3,
        srchNcs4: params.ncs4,
        crseTracseSe: params.courseTraceType,
        srchTraGbn: params.trainingGroup,
        srchTraType: params.trainingType,
        srchTraStDt: params.startDate,
        srchTraEndDt: params.endDate,
        srchTraProcessNm: params.processName,
        srchTraOrganNm: params.organizationName,
        sort: params.sort,
        sortCol: params.sortColumn,
      },
      "listTrainings",
    );
    return mapPage(xml, findBlocks(xml, "scn_list").map(mapHrdTrainingListItem));
  }

  async getTrainingDetail(params: HrdTrainingIdentity) {
    const endpoints = TRAINING_ENDPOINTS[params.kind];
    const xml = await this.request(
      endpoints.detail,
      {
        authKey: this.resolveAuthKey(params.kind, params.authKey),
        returnType: params.returnType ?? "XML",
        outType: 2,
        srchTrprId: params.trainingCourseId,
        srchTrprDegr: params.trainingCourseDegree,
        srchTorgId: params.trainingOrganizationId,
      },
      "getTrainingDetail",
    );
    return mapHrdTrainingDetail(xml, {
      trainingCourseId: params.trainingCourseId,
      trainingCourseDegree: params.trainingCourseDegree,
    });
  }

  async listTrainingSchedules(params: HrdTrainingIdentity) {
    const endpoints = TRAINING_ENDPOINTS[params.kind];
    const xml = await this.request(
      endpoints.schedule,
      {
        authKey: this.resolveAuthKey(params.kind, params.authKey),
        returnType: params.returnType ?? "XML",
        outType: 2,
        srchTrprId: params.trainingCourseId,
        srchTrprDegr: params.trainingCourseDegree,
        srchTorgId: params.trainingOrganizationId,
      },
      "listTrainingSchedules",
    );
    return findBlocks(xml, "scn_list").map(mapHrdTrainingScheduleItem);
  }

  async listJobPrograms(params: JobProgramListParams) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo217L01.do",
      {
        authKey: this.resolveAuthKey("jobPrograms", params.authKey),
        returnType: params.returnType ?? "XML",
        startPage: params.page,
        display: params.size,
        pgmStdt: params.programStartDate,
        topOrgCd: params.topOrgCode,
        orgCd: params.orgCode,
      },
      "listJobPrograms",
    );
    return mapPage(xml, findBlocks(xml, "empPgmSchdInvite").map((block) => ({
      orgName: findFirst(block, "orgNm"),
      programName: findFirst(block, "pgmNm"),
      programSubName: findFirst(block, "pgmSubNm"),
      programTarget: findFirst(block, "pgmTarget"),
      startDate: findFirst(block, "pgmStdt"),
      endDate: findFirst(block, "pgmEndt"),
      openTimeCode: findFirst(block, "openTimeClcd"),
      openTime: findFirst(block, "openTime"),
      operationTime: findFirst(block, "operationTime"),
      place: findFirst(block, "openPlcCont"),
    })));
  }

  async listSmallGiantCompanies(params: SmallGiantCompanyListParams) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo216L01.do",
      {
        authKey: this.resolveAuthKey("smallGiant", params.authKey),
        returnType: params.returnType ?? "XML",
        startPage: params.page,
        display: params.size,
        region: params.region,
      },
      "listSmallGiantCompanies",
    );
    return mapPage(
      xml,
      findBlocks(xml, "smallGiant").map((block) => ({
        selectedYear: findFirst(block, "selYear"),
        brandName: findFirst(block, "sgBrandNm"),
        companyName: findFirst(block, "coNm") ?? "",
        businessNumber: findFirst(block, "busiNo"),
        representativeName: findFirst(block, "reperNm"),
        superIndustryCode: findFirst(block, "superIndTpCd"),
        superIndustryName: findFirst(block, "superIndTpNm"),
        industryCode: findFirst(block, "indTpCd"),
        industryName: findFirst(block, "indTpNm"),
        phone: findFirst(block, "coTelNo"),
        regionCode: findFirst(block, "regionCd"),
        regionName: findFirst(block, "regionNm"),
        address: findFirst(block, "coAddr"),
        mainProduct: findFirst(block, "coMainProd"),
        homepage: findFirst(block, "coHomePage"),
        workerCount: findFirst(block, "alwaysWorkerCnt"),
        brandCode: findFirst(block, "smlgntCoClcd"),
      })),
    );
  }

  async searchDepartments(params: Parameters<WorknetApiAdapter["searchDepartments"]>[0]) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo213L01.do",
      {
        authKey: this.resolveAuthKey("department", params.authKey),
        returnType: params.returnType ?? "XML",
        target: "MAJORCD",
        srchType: params.searchType,
        keyword: params.keyword,
      },
      "searchDepartments",
    );
    return findBlocks(xml, "majorList").map((block) => ({
      majorGb: findFirst(block, "majorGb") as "1" | "2",
      detailDepartmentName: findFirst(block, "knowDtlSchDptNm"),
      departmentName: findFirst(block, "knowSchDptNm") ?? "",
      categoryId: findFirst(block, "empCurtState1Id") ?? "",
      departmentId: findFirst(block, "empCurtState2Id") ?? "",
    }));
  }

  async getGeneralDepartmentDetail(
    params: Parameters<WorknetApiAdapter["getGeneralDepartmentDetail"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo213D01.do",
      {
        authKey: this.resolveAuthKey("department", params.authKey),
        returnType: params.returnType ?? "XML",
        target: "MAJORDTL",
        majorGb: 1,
        empCurtState1Id: params.categoryId ?? params.empCurtState1Id,
        empCurtState2Id: params.departmentId ?? params.empCurtState2Id,
      },
      "getGeneralDepartmentDetail",
    );
    return {
      categoryName: findFirst(xml, "knowDptNm"),
      departmentName: findFirst(xml, "knowSchDptNm") ?? "",
      categoryId: findFirst(xml, "knowDptId") ?? "",
      departmentId: findFirst(xml, "knowSchDptId") ?? "",
      introSummary: findFirst(xml, "schDptIntroSum"),
      aptitudeInterestContent: findFirst(xml, "aptdIntrstCont"),
      relatedDepartments: findAll(xml, "knowDtlSchDptNm"),
      mainSubjects: findAll(xml, "mainEdusbjCont"),
      licenses: findAll(xml, "adoptCertCont"),
      universities: findBlocks(xml, "schDptList").map((block) => ({
        departmentName: findFirst(block, "schDptNm"),
        universityTypeName: findFirst(block, "univGbnNm"),
        universityName: findFirst(block, "univNm"),
        universityUrl: findFirst(block, "univUrl"),
      })),
      relatedJobs: findAll(xml, "knowJobNm"),
    };
  }

  async getSpecialDepartmentDetail(
    params: Parameters<WorknetApiAdapter["getSpecialDepartmentDetail"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo213D02.do",
      {
        authKey: this.resolveAuthKey("department", params.authKey),
        returnType: params.returnType ?? "XML",
        target: "MAJORDTL",
        majorGb: 2,
        empCurtState1Id: params.categoryId ?? params.empCurtState1Id,
        empCurtState2Id: params.departmentId ?? params.empCurtState2Id,
      },
      "getSpecialDepartmentDetail",
    );
    return {
      categoryName: findFirst(xml, "knowDptNm"),
      departmentName: findFirst(xml, "knowSchDptNm") ?? "",
      categoryId: findFirst(xml, "knowDptId") ?? "",
      departmentId: findFirst(xml, "knowSchDptId") ?? "",
      introSummary: findFirst(xml, "schDptIntroSum"),
      whatStudy: findFirst(xml, "whatStudy"),
      howPrepare: findFirst(xml, "howPrepare"),
      jobProspect: findFirst(xml, "jobPropect"),
    };
  }

  async searchJobs(params: JobSearchParams) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo212L01.do",
      {
        authKey: this.resolveAuthKey("jobInfo", params.authKey),
        returnType: params.returnType ?? "XML",
        target: "JOBCD",
        srchType: params.searchType ?? "K",
        keyword: params.keyword,
        avgSal: params.averageSalaryCode,
        prospect: params.prospectCode,
      },
      "searchJobs",
    );
    return findBlocks(xml, "jobList").map(mapJobListItem);
  }

  async getJobSummaryDetail(params: JobDetailIdentity) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo212D01.do",
      {
        authKey: this.resolveAuthKey("jobInfo", params.authKey),
        returnType: params.returnType ?? "XML",
        target: "JOBDTL",
        jobGb: 1,
        jobCd: params.jobCode,
        dtlGb: 1,
      },
      "getJobSummaryDetail",
    );
    return mapJobSummaryDetail(xml);
  }

  async getJobWorkDetail(params: JobDetailIdentity) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo212D02.do",
      {
        authKey: params.authKey ?? this.resolveAuthKey("jobInfo"),
        returnType: params.returnType ?? "XML",
        target: "JOBDTL",
        jobGb: 1,
        jobCd: params.jobCode,
        dtlGb: 2,
      },
      "getJobWorkDetail",
    );
    return mapJobWorkDetail(xml);
  }

  async getJobEducationDetail(params: JobDetailIdentity) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo212D03.do",
      {
        authKey: params.authKey ?? this.resolveAuthKey("jobInfo"),
        returnType: params.returnType ?? "XML",
        target: "JOBDTL",
        jobGb: 1,
        jobCd: params.jobCode,
        dtlGb: 3,
      },
      "getJobEducationDetail",
    );
    return mapJobEducationDetail(xml);
  }

  async getJobSalaryProspectDetail(params: JobDetailIdentity) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo212D04.do",
      {
        authKey: params.authKey ?? this.resolveAuthKey("jobInfo"),
        returnType: params.returnType ?? "XML",
        target: "JOBDTL",
        jobGb: 1,
        jobCd: params.jobCode,
        dtlGb: 4,
      },
      "getJobSalaryProspectDetail",
    );
    return mapJobSalaryProspectDetail(xml);
  }

  async getJobAbilityKnowledgeEnvironmentDetail(
    params: Parameters<WorknetJobApi["getJobAbilityKnowledgeEnvironmentDetail"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo212D05.do",
      {
        authKey: params.authKey ?? this.resolveAuthKey("jobInfo"),
        returnType: params.returnType ?? "XML",
        target: "JOBDTL",
        jobGb: 1,
        jobCd: params.jobCode,
        dtlGb: 5,
      },
      "getJobAbilityKnowledgeEnvironmentDetail",
    );
    return {
      jobCode: findFirst(xml, "jobCd") ?? "",
      abilityWithinJob: mapMetricBlocks(
        xml,
        "jobAbilCmpr",
        "jobAblNmCmpr",
        "jobAblStatusCmpr",
        "jobAblContCmpr",
      ),
      abilityAcrossJobs: mapMetricBlocks(
        xml,
        "jobAbil",
        "jobAblNm",
        "jobAblStatus",
        "jobAblCont",
      ),
      abilityLevelWithinJob: mapMetricBlocks(
        xml,
        "jobAbilLvlCmpr",
        "jobAblLvlNmCmpr",
        "jobAblLvlStatusCmpr",
        "jobAblLvlContCmpr",
      ),
      abilityLevelAcrossJobs: mapMetricBlocks(
        xml,
        "jobAbilLvl",
        "jobAblLvlNm",
        "jobAblLvlStatus",
        "jobAblLvlCont",
      ),
      knowledgeWithinJob: mapMetricBlocks(
        xml,
        "KnwldgCmpr",
        "knwldgNmCmpr",
        "knwldgStatusCmpr",
        "knwldgContCmpr",
      ),
      knowledgeAcrossJobs: mapMetricBlocks(
        xml,
        "Knwldg",
        "knwldgNm",
        "knwldgStatus",
        "knwldgCont",
      ),
      knowledgeLevelWithinJob: mapMetricBlocks(
        xml,
        "KnwldgLvlCmpr",
        "knwldgLvlNmCmpr",
        "knwldgLvlStatusCmpr",
        "knwldgLvlContCmpr",
      ),
      knowledgeLevelAcrossJobs: mapMetricBlocks(
        xml,
        "KnwldgLvl",
        "knwldgLvlNm",
        "knwldgLvlStatus",
        "knwldgLvlCont",
      ),
      environmentWithinJob: mapMetricBlocks(
        xml,
        "jobsEnvCmpr",
        "jobEnvNmCmpr",
        "jobEnvStatusCmpr",
        "jobEnvContCmpr",
      ),
      environmentAcrossJobs: mapMetricBlocks(
        xml,
        "jobsEnv",
        "jobEnvNm",
        "jobEnvStatus",
        "jobEnvCont",
      ),
    };
  }

  async getJobCharacterInterestValueDetail(
    params: Parameters<WorknetJobApi["getJobCharacterInterestValueDetail"]>[0],
  ) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo212D06.do",
      {
        authKey: params.authKey ?? this.resolveAuthKey("jobInfo"),
        returnType: params.returnType ?? "XML",
        target: "JOBDTL",
        jobGb: 1,
        jobCd: params.jobCode,
        dtlGb: 6,
      },
      "getJobCharacterInterestValueDetail",
    );
    return {
      jobCode: findFirst(xml, "jobCd") ?? "",
      characterWithinJob: mapMetricBlocks(
        xml,
        "jobChrCmpr",
        "jobChrNmCmpr",
        "jobChrStatusCmpr",
        "jobChrContCmpr",
      ),
      characterAcrossJobs: mapMetricBlocks(
        xml,
        "jobChr",
        "jobChrNm",
        "jobChrStatus",
        "jobChrCont",
      ),
      interestWithinJob: mapMetricBlocks(
        xml,
        "jobIntrstCmpr",
        "intrstNmCmpr",
        "intrstStatusCmpr",
        "intrstContCmpr",
      ),
      interestAcrossJobs: mapMetricBlocks(
        xml,
        "jobIntrst",
        "intrstNm",
        "intrstStatus",
        "intrstCont",
      ),
      valuesWithinJob: mapMetricBlocks(
        xml,
        "jobValsCmpr",
        "valsNmCmpr",
        "valsStatusCmpr",
        "valsContCmpr",
      ),
      valuesAcrossJobs: mapMetricBlocks(
        xml,
        "jobVals",
        "valsNm",
        "valsStatus",
        "valsCont",
      ),
    };
  }

  async getJobActivityDetail(params: Parameters<WorknetJobApi["getJobActivityDetail"]>[0]) {
    const xml = await this.request(
      "wk/callOpenApiSvcInfo212D07.do",
      {
        authKey: params.authKey ?? this.resolveAuthKey("jobInfo"),
        returnType: params.returnType ?? "XML",
        target: "JOBDTL",
        jobGb: 1,
        jobCd: params.jobCode,
        dtlGb: 7,
      },
      "getJobActivityDetail",
    );
    return {
      jobCode: findFirst(xml, "jobCd") ?? "",
      activityImportanceWithinJob: mapMetricBlocks(
        xml,
        "jobActvImprtncCmpr",
        "jobActvImprtncNmCmpr",
        "jobActvImprtncStatusCmpr",
        "jobActvImprtncContCmpr",
      ),
      activityImportanceAcrossJobs: mapMetricBlocks(
        xml,
        "jobActvImprtnc",
        "jobActvImprtncNm",
        "jobActvImprtncStatus",
        "jobActvImprtncCont",
      ),
      activityLevelWithinJob: mapMetricBlocks(
        xml,
        "jobActvLvlCmpr",
        "jobActvLvlNmCmpr",
        "jobActvLvlStatusCmpr",
        "jobActvLvlContCmpr",
      ),
      activityLevelAcrossJobs: mapMetricBlocks(
        xml,
        "jobActvLvl",
        "jobActvLvlNm",
        "jobActvLvlStatus",
        "jobActvLvlCont",
      ),
    };
  }
}
