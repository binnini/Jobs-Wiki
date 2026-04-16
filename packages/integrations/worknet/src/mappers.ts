import type {
  EmploymentEventDetail,
  EmploymentEventListItem,
  HrdTrainingDetail,
  HrdTrainingListItem,
  HrdTrainingScheduleItem,
  JobComparisonMetric,
  JobEducationDetail,
  JobListItem,
  JobSalaryProspectDetail,
  JobSummaryDetail,
  JobWorkDetail,
  OpenRecruitCompanyDetail,
  OpenRecruitCompanyListItem,
  OpenRecruitDetail,
  OpenRecruitListItem,
  PaginatedResult,
} from "./types.ts";
import {
  findAll,
  findAllLeafText,
  findBlocks,
  findFirst,
  findLast,
  toNumber,
} from "./xml.ts";

export function mapPage<T>(xml: string, items: T[]): PaginatedResult<T> {
  return {
    total: toNumber(findFirst(xml, "total") ?? findFirst(xml, "scn_cnt"), items.length),
    page: toNumber(findFirst(xml, "startPage") ?? findFirst(xml, "pageNum"), 1),
    size: toNumber(findFirst(xml, "display") ?? findFirst(xml, "pageSize"), items.length),
    items,
  };
}

export function mapEmploymentEventListItem(block: string): EmploymentEventListItem {
  return {
    areaCode: findFirst(block, "areaCd") as EmploymentEventListItem["areaCode"],
    areaName: findFirst(block, "area") ?? "",
    eventNo: findFirst(block, "eventNo") ?? "",
    eventName: findFirst(block, "eventNm") ?? "",
    eventTerm: findFirst(block, "eventTerm") ?? "",
    startDate: findFirst(block, "startDt") ?? "",
  };
}

export function mapEmploymentEventDetail(xml: string): EmploymentEventDetail {
  return {
    eventName: findFirst(xml, "eventNm") ?? "",
    eventTerm: findFirst(xml, "eventTerm") ?? "",
    eventPlace: findFirst(xml, "eventPlc"),
    participatingCompanyInfo: findFirst(xml, "joinCoWantedInfo"),
    additionalNotes: findFirst(xml, "subMatter"),
    inquiryPhone: findFirst(xml, "inqTelNo"),
    fax: findFirst(xml, "fax"),
    charger: findFirst(xml, "charger"),
    email: findFirst(xml, "email"),
    visitPath: findFirst(xml, "visitPath"),
  };
}

export function mapOpenRecruitListItem(block: string): OpenRecruitListItem {
  return {
    empSeqno: findFirst(block, "empSeqno") ?? "",
    title: findFirst(block, "empWantedTitle") ?? "",
    companyName: findFirst(block, "empBusiNm") ?? "",
    companyTypeName: findFirst(block, "coClcdNm"),
    startDate: findFirst(block, "empWantedStdt"),
    endDate: findFirst(block, "empWantedEndt"),
    employmentTypeName: findFirst(block, "empWantedTypeNm"),
    logoUrl: findFirst(block, "regLogImgNm"),
    detailUrl: findFirst(block, "empWantedHomepgDetail"),
    mobileUrl: findFirst(block, "empWantedMobileUrl"),
  };
}

export function mapOpenRecruitmentDetail(xml: string): OpenRecruitDetail {
  const jobs = findBlocks(xml, "empJobsListInfo").map((block) => ({
    jobsCode: findFirst(block, "jobsCd"),
    jobsName: findFirst(block, "jobsCdKorNm"),
  }));

  const selfIntroQuestions = findBlocks(xml, "empSelsListInfo")
    .map((block) => findFirst(block, "selfintroQstCont"))
    .filter((value): value is string => Boolean(value));

  const selectionSteps = findBlocks(xml, "empSelsListInfo")
    .filter((block) => findFirst(block, "selsNm"))
    .map((block) => ({
      name: findFirst(block, "selsNm"),
      schedule: findFirst(block, "selsSchdCont"),
      content: findFirst(block, "selsCont"),
      memo: findFirst(block, "selsMemoCont"),
    }));

  const recruitmentSections = findBlocks(xml, "empRecrListInfo").map((block) => ({
    name: findFirst(block, "empRecrNm"),
    jobDescription: findFirst(block, "jobCont"),
    selectionContent: findFirst(block, "selsCont"),
    workRegion: findFirst(block, "workRegionNm"),
    careerRequirement: findFirst(block, "empWantedCareerNm"),
    educationRequirement: findFirst(block, "empWantedEduNm"),
    otherRequirement: findFirst(block, "sptCertEtc"),
    recruitmentCount: findFirst(block, "recrPsncnt"),
    memo: findFirst(block, "empRecrMemoCont"),
  }));

  const attachments = findBlocks(xml, "regFileListInfo").map((block) => ({
    fileName: findFirst(block, "regFileNm") ?? "",
  }));

  return {
    empSeqno: findFirst(xml, "empSeqno") ?? "",
    title: findFirst(xml, "empWantedTitle") ?? "",
    companyName: findFirst(xml, "empBusiNm") ?? "",
    companyTypeName: findFirst(xml, "coClcdNm"),
    startDate: findFirst(xml, "empWantedStdt"),
    endDate: findFirst(xml, "empWantedEndt"),
    employmentTypeName: findFirst(xml, "empWantedTypeNm"),
    submitDocumentContent: findFirst(xml, "empSubmitDocCont"),
    receiptMethodContent: findFirst(xml, "empRcptMthdCont"),
    acceptanceAnnouncementContent: findFirst(xml, "empAcptPsnAnncCont"),
    inquiryContent: findFirst(xml, "inqryCont"),
    etcContent: findFirst(xml, "empnEtcCont"),
    companyHomepage: findFirst(xml, "empWantedHomepg"),
    detailUrl: findFirst(xml, "empWantedHomepgDetail"),
    mobileUrl: findFirst(xml, "empWantedMobileUrl"),
    jobs,
    selfIntroQuestions,
    selectionSteps,
    recruitmentSummary: findFirst(xml, "empnRecrSummaryCont"),
    recruitmentSections,
    commonRequirementContent: findFirst(xml, "recrCommCont"),
    attachments,
  };
}

export function mapOpenRecruitCompanyListItem(block: string): OpenRecruitCompanyListItem {
  return {
    empCoNo: findFirst(block, "empCoNo") ?? "",
    companyName: findFirst(block, "coNm") ?? findFirst(block, "coClcdNm") ?? "",
    companyTypeName: findFirst(block, "coClcdNm"),
    businessNumber: findFirst(block, "busino"),
    latitude: findFirst(block, "mapCoorY"),
    longitude: findFirst(block, "mapCoorX"),
    logoUrl: findFirst(block, "regLogImgNm"),
    companyIntroSummary: findFirst(block, "coIntroSummaryCont"),
    companyIntro: findFirst(block, "coIntroCont"),
    homepage: findFirst(block, "homepg"),
    mainBusiness: findFirst(block, "mainBusiCont"),
  };
}

export function mapOpenRecruitCompanyDetail(xml: string): OpenRecruitCompanyDetail {
  return {
    empCoNo: findFirst(xml, "empCoNo") ?? "",
    companyName: findFirst(xml, "coNm") ?? "",
    companyTypeName: findFirst(xml, "coClcdNm"),
    logoUrl: findFirst(xml, "regLogImgNm"),
    homepage: findFirst(xml, "homepg"),
    businessNumber: findFirst(xml, "busino"),
    latitude: findFirst(xml, "mapCoorY"),
    longitude: findFirst(xml, "mapCoorX"),
    mainBusiness: findFirst(xml, "mainBusiCont"),
    companyIntroSummary: findFirst(xml, "coIntroSummaryCont"),
    companyIntro: findFirst(xml, "coIntroCont"),
    welfare: findBlocks(xml, "welfareListInfo").map((block) => ({
      categoryName: findFirst(block, "cdKorNm"),
      content: findFirst(block, "welfareCont"),
    })),
    history: findBlocks(xml, "historyListInfo").map((block) => ({
      year: findFirst(block, "histYr"),
      month: findFirst(block, "histMm"),
      content: findFirst(block, "histCont"),
    })),
    rightPeople: findBlocks(xml, "rightPeopleListInfo").map((block) => ({
      keyword: findFirst(block, "psnrightKeywordNm"),
      description: findFirst(block, "psnrightDesc"),
    })),
  };
}

export function mapHrdTrainingListItem(block: string): HrdTrainingListItem {
  return {
    title: findFirst(block, "title"),
    subTitle: findFirst(block, "subTitle"),
    address: findFirst(block, "address"),
    content: findFirst(block, "contents"),
    courseCost: findFirst(block, "courseMan"),
    realCost: findFirst(block, "realMan"),
    startDate: findFirst(block, "traStartDate"),
    endDate: findFirst(block, "traEndDate"),
    trainTarget: findFirst(block, "trainTarget"),
    trainTargetCode: findFirst(block, "trainTargetCd"),
    trainingInstitutionId: findFirst(block, "trainstCstId"),
    trainingInstitutionCode: findFirst(block, "instCd"),
    trainingAreaCode: findFirst(block, "trngAreaCd"),
    trainingCourseId: findFirst(block, "trprId"),
    trainingCourseDegree: findFirst(block, "trprDegr"),
    ncsCode: findFirst(block, "ncsCd"),
    yardMan: findFirst(block, "yardMan"),
    registeredCount: findFirst(block, "regCourseMan"),
    satisfactionScore: findFirst(block, "stdgScor"),
    employmentRate3: findFirst(block, "eiEmplRate3"),
    employmentRate6: findFirst(block, "eiEmplRate6"),
  };
}

export function mapHrdTrainingDetail(
  xml: string,
  identity: {
    trainingCourseId: string;
    trainingCourseDegree?: string;
  },
): HrdTrainingDetail {
  const facilities = findBlocks(xml, "inst_facility_info_list").map((block) => ({
    customerId: findFirst(block, "cstmrId"),
    customerName: findFirst(block, "cstmrNm"),
    name: findFirst(block, "trafcltyNm"),
    holdQuantity: findFirst(block, "holdQy"),
    areaSquareMeter: findFirst(block, "fcltyArCn"),
    occupancyCount: findFirst(block, "ocuAcptnNmprCn"),
  }));

  const equipment = findBlocks(xml, "inst_eqnm_info_list").map((block) => ({
    customerName: findFirst(block, "cstmrNm"),
    name: findFirst(block, "eqpmnNm"),
    holdQuantity: findFirst(block, "holdQy"),
  }));

  return {
    baseInfo: {
      institutionName: findFirst(xml, "inoNm") ?? facilities[0]?.customerName,
      institutionCode: findFirst(xml, "instIno"),
      address1: findFirst(xml, "addr1"),
      address2: findFirst(xml, "addr2"),
      homepage: findFirst(xml, "hpAddr"),
      zipCode: findFirst(xml, "zipCd"),
      ncsCode: findFirst(xml, "ncsCd"),
      ncsName: findFirst(xml, "ncsNm"),
      totalTrainingDays: findFirst(xml, "trDcnt"),
      totalTrainingHours: findFirst(xml, "trtm"),
      governmentSupportAmount: findFirst(xml, "perTrco"),
      actualTrainingCost: findFirst(xml, "instPerTrco"),
      trainingCourseId: findFirst(xml, "trprId") ?? identity.trainingCourseId,
      trainingCourseDegree: findFirst(xml, "trprDegr") ?? identity.trainingCourseDegree,
      trainingCourseName: findFirst(xml, "trprNm"),
      contactName: findFirst(xml, "trprChap"),
      contactEmail: findFirst(xml, "trprChapEmail"),
      contactPhone: findFirst(xml, "trprChapTel"),
    },
    detailInfo: {
      fieldName: findFirst(xml, "govBusiNm"),
      trainingType: findFirst(xml, "torgGbnCd"),
      totalTrainingDays: findFirst(xml, "totTraingDyct"),
      totalTrainingTime: findFirst(xml, "totTraingTime"),
      ownExpense: findFirst(xml, "tgcrGnrlTrneOwepAllt"),
    },
    facilities,
    equipment,
  };
}

export function mapHrdTrainingScheduleItem(block: string): HrdTrainingScheduleItem {
  return {
    trainingCourseId: findFirst(block, "trprId"),
    trainingCourseDegree: findFirst(block, "trprDegr"),
    trainingCourseName: findFirst(block, "trprNm"),
    trainingStartDate: findFirst(block, "trStaDt"),
    trainingEndDate: findFirst(block, "trEndDt"),
    totalFixedNumber: findFirst(block, "totFxnum"),
    totalParticipantMarks: findFirst(block, "totParMks"),
    completedCount: findFirst(block, "finiCnt"),
    totalCost: findFirst(block, "totTrco"),
    totalApplicantCount: findFirst(block, "totTrpCnt"),
    employmentRate3: findFirst(block, "eiEmplRate3"),
    employmentCount3: findFirst(block, "eiEmplCnt3"),
    employmentRate6: findFirst(block, "eiEmplRate6"),
    employmentCount6: findFirst(block, "eiEmplCnt6"),
    hrdEmploymentRate6: findFirst(block, "hrdEmplRate6"),
    hrdEmploymentCount6: findFirst(block, "hrdEmplCnt6"),
  };
}

export function mapJobListItem(block: string): JobListItem {
  return {
    jobClassCode: findFirst(block, "jobClcd"),
    jobClassName: findFirst(block, "jobClcdNM"),
    jobCode: findFirst(block, "jobCd") ?? "",
    jobName: findFirst(block, "jobNm") ?? "",
  };
}

export function mapJobSummaryDetail(xml: string): JobSummaryDetail {
  const leafJobSums = findAllLeafText(xml, "jobSum");
  return {
    jobCode: findFirst(xml, "jobCd") ?? "",
    largeClassName: findFirst(xml, "jobLrclNm"),
    middleClassName: findFirst(xml, "jobMdclNm"),
    smallClassName: findFirst(xml, "jobSmclNm"),
    summary: leafJobSums.length > 0 ? leafJobSums.at(-1) : findLast(xml, "jobSum"),
    way: findFirst(xml, "way"),
    relatedMajors: findBlocks(xml, "relMajorList").map((block) => ({
      code: findFirst(block, "majorCd"),
      name: findFirst(block, "majorNm"),
    })),
    relatedCertificates: findAll(xml, "certNm"),
    salary: findFirst(xml, "sal"),
    satisfaction: findFirst(xml, "jobSatis"),
    prospect: findFirst(xml, "jobProspect"),
    status: findFirst(xml, "jobStatus"),
    ability: findFirst(xml, "jobAbil"),
    knowledge: findFirst(xml, "knowldg"),
    environment: findFirst(xml, "jobEnv"),
    personality: findFirst(xml, "jobChr"),
    interest: findFirst(xml, "jobIntrst"),
    values: findFirst(xml, "jobVals"),
    activityImportance: findFirst(xml, "jobActvImprtncs"),
    activityLevels: findFirst(xml, "jobActvLvls"),
    relatedJobs: findBlocks(xml, "relJobList").map((block) => ({
      code: findFirst(block, "jobCd"),
      name: findFirst(block, "jobNm"),
    })),
  };
}

export function mapJobWorkDetail(xml: string): JobWorkDetail {
  return {
    jobCode: findFirst(xml, "jobCd") ?? "",
    summary: findFirst(xml, "jobSum"),
    executionJob: findFirst(xml, "execJob"),
    relatedJobs: findBlocks(xml, "relJobList").map((block) => ({
      code: findFirst(block, "jobCd"),
      name: findFirst(block, "jobNm"),
    })),
  };
}

export function mapJobEducationDetail(xml: string): JobEducationDetail {
  return {
    jobCode: findFirst(xml, "jobCd") ?? "",
    technicalKnowledge: findFirst(xml, "technKnow"),
    relatedMajors: findBlocks(xml, "relMajorList").map((block) => ({
      code: findFirst(block, "majorCd"),
      name: findFirst(block, "majorNm"),
    })),
    relatedOrganizations: findBlocks(xml, "relOrgList").map((block) => ({
      name: findFirst(block, "orgNm"),
      url: findFirst(block, "orgSiteUrl"),
    })),
    relatedCertificates: findAll(xml, "certNm"),
    kecoCodes: findBlocks(xml, "kecoList").map((block) => ({
      code: findFirst(block, "kecoCd"),
      name: findFirst(block, "kecoNm"),
    })),
  };
}

export function mapJobSalaryProspectDetail(xml: string): JobSalaryProspectDetail {
  return {
    jobCode: findFirst(xml, "jobCd") ?? "",
    salary: findFirst(xml, "sal"),
    satisfaction: findFirst(xml, "jobSatis"),
    prospect: findFirst(xml, "jobProspect"),
    prospectSummary: findBlocks(xml, "jobSumProspect").map((block) => ({
      name: findFirst(block, "jobProspectNm"),
      ratio: findFirst(block, "jobProspectRatio"),
      inquiryYear: toNumber(findFirst(block, "jobProspectInqYr"), 0),
    })),
    jobStatusList: findBlocks(xml, "jobStatusList").map((block) => ({
      jobCode: findFirst(block, "jobCd"),
      jobName: findFirst(block, "jobNm"),
    })),
  };
}

export function mapMetricBlocks(
  xml: string,
  tag: string,
  nameTag: string,
  statusTag: string,
  descriptionTag: string,
): JobComparisonMetric[] {
  return findBlocks(xml, tag).map((block) => ({
    name: findFirst(block, nameTag),
    status: toNumber(findFirst(block, statusTag), 0),
    description: findFirst(block, descriptionTag),
  }));
}
