export type WorknetXmlReturnType = "XML";
export type WorknetStructuredReturnType = "JSON";
export type WorknetReturnType =
  | WorknetXmlReturnType
  | WorknetStructuredReturnType;

export type PaginationMeta = {
  total: number;
  page: number;
  size: number;
};

export type PaginatedResult<T> = PaginationMeta & {
  items: T[];
};

export type EmploymentEventAreaCode =
  | "51"
  | "52"
  | "53"
  | "54"
  | "55"
  | "56";

export type OpenRecruitCompanyTypeCode =
  | "10"
  | "20"
  | "30"
  | "40"
  | "50";

export type EmploymentTypeCode =
  | "10"
  | "20"
  | "30"
  | "40"
  | "50"
  | "60";

export type CareerTypeCode = "10" | "20" | "30" | "40";

export type EducationLevelCode =
  | "10"
  | "20"
  | "30"
  | "40"
  | "50"
  | "99";

export type SortOrder = "asc" | "desc" | "ASC" | "DESC";

export type WorknetRequestContext = {
  authKey: string;
  returnType?: WorknetReturnType;
};

export type EmploymentEventListParams = WorknetRequestContext & {
  page: number;
  size: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  areaCode?: EmploymentEventAreaCode;
};

export type EmploymentEventListItem = {
  areaCode: EmploymentEventAreaCode;
  areaName: string;
  eventNo: string;
  eventName: string;
  eventTerm: string;
  startDate: string;
};

export type EmploymentEventDetailParams = WorknetRequestContext & {
  areaCode: EmploymentEventAreaCode;
  eventNo: string;
};

export type EmploymentEventDetail = {
  eventName: string;
  eventTerm: string;
  eventPlace?: string;
  participatingCompanyInfo?: string;
  additionalNotes?: string;
  inquiryPhone?: string;
  fax?: string;
  charger?: string;
  email?: string;
  visitPath?: string;
};

export type OpenRecruitListParams = WorknetRequestContext & {
  page: number;
  size: number;
  companyTypeCodes?: OpenRecruitCompanyTypeCode[];
  employmentTypeCodes?: EmploymentTypeCode[];
  careerTypeCodes?: CareerTypeCode[];
  educationLevelCodes?: EducationLevelCode[];
  jobsCode?: string;
  title?: string;
  businessNumber?: string;
  sortField?: "regDt" | "coNm";
  sortOrder?: SortOrder;
};

export type OpenRecruitListItem = {
  empSeqno: string;
  title: string;
  companyName: string;
  companyTypeName?: string;
  startDate?: string;
  endDate?: string;
  employmentTypeName?: string;
  logoUrl?: string;
  detailUrl?: string;
  mobileUrl?: string;
};

export type OpenRecruitDetailParams = WorknetRequestContext & {
  empSeqno: string;
  includeSelfIntroQuestions?: boolean;
  includeSelectionSteps?: boolean;
  includeRecruitmentSections?: boolean;
};

export type OpenRecruitJob = {
  jobsCode?: string;
  jobsName?: string;
};

export type OpenRecruitAttachment = {
  fileName: string;
};

export type OpenRecruitSelectionStep = {
  name?: string;
  schedule?: string;
  content?: string;
  memo?: string;
};

export type OpenRecruitSection = {
  name?: string;
  jobDescription?: string;
  selectionContent?: string;
  workRegion?: string;
  careerRequirement?: string;
  educationRequirement?: string;
  otherRequirement?: string;
  recruitmentCount?: string;
  memo?: string;
};

export type OpenRecruitDetail = {
  empSeqno: string;
  title: string;
  companyName: string;
  companyTypeName?: string;
  startDate?: string;
  endDate?: string;
  employmentTypeName?: string;
  submitDocumentContent?: string;
  receiptMethodContent?: string;
  acceptanceAnnouncementContent?: string;
  inquiryContent?: string;
  etcContent?: string;
  companyHomepage?: string;
  detailUrl?: string;
  mobileUrl?: string;
  jobs: OpenRecruitJob[];
  selfIntroQuestions: string[];
  selectionSteps: OpenRecruitSelectionStep[];
  recruitmentSummary?: string;
  recruitmentSections: OpenRecruitSection[];
  commonRequirementContent?: string;
  attachments: OpenRecruitAttachment[];
};

export type OpenRecruitCompanyListParams = WorknetRequestContext & {
  page: number;
  size: number;
  companyTypeCodes?: OpenRecruitCompanyTypeCode[];
  companyName?: string;
  sortField?: "regDt" | "coNm";
  sortOrder?: SortOrder;
};

export type OpenRecruitCompanyListItem = {
  empCoNo: string;
  companyName: string;
  companyTypeName?: string;
  businessNumber?: string;
  latitude?: string;
  longitude?: string;
  logoUrl?: string;
  companyIntroSummary?: string;
  companyIntro?: string;
  homepage?: string;
  mainBusiness?: string;
};

export type OpenRecruitCompanyDetailParams = WorknetRequestContext & {
  empCoNo: string;
};

export type WelfareItem = {
  categoryName?: string;
  content?: string;
};

export type CompanyHistoryItem = {
  year?: string;
  month?: string;
  content?: string;
};

export type RightPeopleItem = {
  keyword?: string;
  description?: string;
};

export type OpenRecruitCompanyDetail = {
  empCoNo: string;
  companyName: string;
  companyTypeName?: string;
  logoUrl?: string;
  homepage?: string;
  businessNumber?: string;
  latitude?: string;
  longitude?: string;
  mainBusiness?: string;
  companyIntroSummary?: string;
  companyIntro?: string;
  welfare: WelfareItem[];
  history: CompanyHistoryItem[];
  rightPeople: RightPeopleItem[];
};

export type HrdTrainingKind =
  | "national"
  | "business"
  | "consortium"
  | "work-study";

export type HrdTrainingListParams = WorknetRequestContext & {
  kind: HrdTrainingKind;
  page: number;
  size: number;
  startDate: string;
  endDate: string;
  sort: Exclude<SortOrder, "asc" | "desc">;
  sortColumn: "1" | "2" | "3" | "5" | "6";
  weekendCode?: "1" | "2" | "3" | "9";
  area1?: string;
  area2?: string;
  ncs1?: string;
  ncs2?: string;
  ncs3?: string;
  ncs4?: string;
  courseTraceType?: string;
  trainingGroup?: string;
  trainingType?: string;
  processName?: string;
  organizationName?: string;
};

export type HrdTrainingListItem = {
  title?: string;
  subTitle?: string;
  address?: string;
  content?: string;
  courseCost?: string;
  realCost?: string;
  startDate?: string;
  endDate?: string;
  trainTarget?: string;
  trainTargetCode?: string;
  trainingInstitutionId?: string;
  trainingInstitutionCode?: string;
  trainingAreaCode?: string;
  trainingCourseId?: string;
  trainingCourseDegree?: string;
  ncsCode?: string;
  yardMan?: string;
  registeredCount?: string;
  satisfactionScore?: string;
  employmentRate3?: string;
  employmentRate6?: string;
};

export type HrdTrainingIdentity = WorknetRequestContext & {
  kind: HrdTrainingKind;
  trainingCourseId: string;
  trainingCourseDegree?: string;
  trainingOrganizationId?: string;
};

export type HrdTrainingBaseInfo = {
  institutionName?: string;
  institutionCode?: string;
  address1?: string;
  address2?: string;
  homepage?: string;
  zipCode?: string;
  ncsCode?: string;
  ncsName?: string;
  totalTrainingDays?: string;
  totalTrainingHours?: string;
  governmentSupportAmount?: string;
  actualTrainingCost?: string;
  trainingCourseId?: string;
  trainingCourseDegree?: string;
  trainingCourseName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type HrdTrainingFacility = {
  customerId?: string;
  customerName?: string;
  name?: string;
  holdQuantity?: string;
  areaSquareMeter?: string;
  occupancyCount?: string;
};

export type HrdTrainingEquipment = {
  customerName?: string;
  name?: string;
  holdQuantity?: string;
};

export type HrdTrainingDetail = {
  baseInfo: HrdTrainingBaseInfo;
  detailInfo: Record<string, string | undefined>;
  facilities: HrdTrainingFacility[];
  equipment: HrdTrainingEquipment[];
};

export type HrdTrainingScheduleItem = {
  trainingCourseId?: string;
  trainingCourseDegree?: string;
  trainingCourseName?: string;
  trainingStartDate?: string;
  trainingEndDate?: string;
  totalFixedNumber?: string;
  totalParticipantMarks?: string;
  completedCount?: string;
  totalCost?: string;
  totalApplicantCount?: string;
  employmentRate3?: string;
  employmentCount3?: string;
  employmentRate6?: string;
  employmentCount6?: string;
  hrdEmploymentRate6?: string;
  hrdEmploymentCount6?: string;
};

export type JobProgramListParams = WorknetRequestContext & {
  page: number;
  size: number;
  programStartDate?: string;
  topOrgCode?: string;
  orgCode?: string;
};

export type JobProgramListItem = {
  orgName?: string;
  programName?: string;
  programSubName?: string;
  programTarget?: string;
  startDate?: string;
  endDate?: string;
  openTimeCode?: string;
  openTime?: string;
  operationTime?: string;
  place?: string;
};

export type SmallGiantCompanyListParams = WorknetRequestContext & {
  page: number;
  size: number;
  region?: string;
};

export type SmallGiantCompanyItem = {
  selectedYear?: string;
  brandName?: string;
  companyName: string;
  businessNumber?: string;
  representativeName?: string;
  superIndustryCode?: string;
  superIndustryName?: string;
  industryCode?: string;
  industryName?: string;
  phone?: string;
  regionCode?: string;
  regionName?: string;
  address?: string;
  mainProduct?: string;
  homepage?: string;
  workerCount?: string;
  brandCode?: string;
};

export type DepartmentSearchParams = WorknetRequestContext & {
  searchType: "A" | "K";
  keyword: string;
};

export type DepartmentListItem = {
  majorGb: "1" | "2";
  detailDepartmentName?: string;
  departmentName: string;
  categoryId: string;
  departmentId: string;
};

export type DepartmentDetailParams = WorknetRequestContext & {
  majorGb: "1" | "2";
  categoryId: string;
  departmentId: string;
};

export type DepartmentSummary = {
  categoryName?: string;
  departmentName: string;
  categoryId: string;
  departmentId: string;
  introSummary?: string;
};

export type GeneralDepartmentDetail = DepartmentSummary & {
  aptitudeInterestContent?: string;
  relatedDepartments: string[];
  mainSubjects: string[];
  licenses: string[];
  universities: Array<{
    departmentName?: string;
    universityTypeName?: string;
    universityName?: string;
    universityUrl?: string;
  }>;
  relatedJobs: string[];
};

export type SpecialDepartmentDetail = DepartmentSummary & {
  whatStudy?: string;
  howPrepare?: string;
  jobProspect?: string;
};

export type JobSearchParams = WorknetRequestContext & {
  searchType?: "K" | "C";
  keyword?: string;
  averageSalaryCode?: "10" | "20" | "30" | "40";
  prospectCode?: "1" | "2" | "3" | "4" | "5";
};

export type JobListItem = {
  jobClassCode?: string;
  jobClassName?: string;
  jobCode: string;
  jobName: string;
};

export type JobDetailIdentity = WorknetRequestContext & {
  jobCode: string;
};

export type JobSummaryDetail = {
  jobCode: string;
  largeClassName?: string;
  middleClassName?: string;
  smallClassName?: string;
  summary?: string;
  way?: string;
  relatedMajors: Array<{ code?: string; name?: string }>;
  relatedCertificates: string[];
  salary?: string;
  satisfaction?: string;
  prospect?: string;
  status?: string;
  ability?: string;
  knowledge?: string;
  environment?: string;
  personality?: string;
  interest?: string;
  values?: string;
  activityImportance?: string;
  activityLevels?: string;
  relatedJobs: Array<{ code?: string; name?: string }>;
};

export type JobWorkDetail = {
  jobCode: string;
  summary?: string;
  executionJob?: string;
  relatedJobs: Array<{ code?: string; name?: string }>;
};

export type JobEducationDetail = {
  jobCode: string;
  technicalKnowledge?: string;
  relatedMajors: Array<{ code?: string; name?: string }>;
  relatedOrganizations: Array<{ name?: string; url?: string }>;
  relatedCertificates: string[];
  kecoCodes: Array<{ code?: string; name?: string }>;
};

export type JobSalaryProspectDetail = {
  jobCode: string;
  salary?: string;
  satisfaction?: string;
  prospect?: string;
  prospectSummary: Array<{
    name?: string;
    ratio?: string;
    inquiryYear?: number;
  }>;
  jobStatusList: Array<{ jobCode?: string; jobName?: string }>;
};

export type JobComparisonMetric = {
  name?: string;
  status?: number;
  description?: string;
};

export type JobAbilityKnowledgeEnvironmentDetail = {
  jobCode: string;
  abilityWithinJob: JobComparisonMetric[];
  abilityAcrossJobs: JobComparisonMetric[];
  abilityLevelWithinJob: JobComparisonMetric[];
  abilityLevelAcrossJobs: JobComparisonMetric[];
  knowledgeWithinJob: JobComparisonMetric[];
  knowledgeAcrossJobs: JobComparisonMetric[];
  knowledgeLevelWithinJob: JobComparisonMetric[];
  knowledgeLevelAcrossJobs: JobComparisonMetric[];
  environmentWithinJob: JobComparisonMetric[];
  environmentAcrossJobs: JobComparisonMetric[];
};

export type JobCharacterInterestValueDetail = {
  jobCode: string;
  characterWithinJob: JobComparisonMetric[];
  characterAcrossJobs: JobComparisonMetric[];
  interestWithinJob: JobComparisonMetric[];
  interestAcrossJobs: JobComparisonMetric[];
  valuesWithinJob: JobComparisonMetric[];
  valuesAcrossJobs: JobComparisonMetric[];
};

export type JobActivityDetail = {
  jobCode: string;
  activityImportanceWithinJob: JobComparisonMetric[];
  activityImportanceAcrossJobs: JobComparisonMetric[];
  activityLevelWithinJob: JobComparisonMetric[];
  activityLevelAcrossJobs: JobComparisonMetric[];
};
