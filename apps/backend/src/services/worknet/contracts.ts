export type PageRequest = {
  page: number;
  size: number;
};

export type PageResult<T> = {
  total: number;
  page: number;
  size: number;
  items: T[];
};

export type RecruitmentSearchInput = PageRequest & {
  keyword?: string;
  companyName?: string;
  companyTypes?: string[];
  employmentTypes?: string[];
  careerTypes?: string[];
  educationLevels?: string[];
  jobsCode?: string;
  businessNumber?: string;
};

export type RecruitmentSummary = {
  recruitmentId: string;
  title: string;
  companyName: string;
  companyType?: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  detailUrl?: string;
  mobileUrl?: string;
};

export type RecruitmentDetailView = RecruitmentSummary & {
  submitDocuments?: string;
  receiptMethod?: string;
  acceptanceAnnouncement?: string;
  inquiry?: string;
  note?: string;
  jobs: Array<{
    code?: string;
    name?: string;
  }>;
  selfIntroductionQuestions: string[];
  selectionSteps: Array<{
    name?: string;
    schedule?: string;
    content?: string;
    memo?: string;
  }>;
  sections: Array<{
    name?: string;
    jobDescription?: string;
    workRegion?: string;
    careerRequirement?: string;
    educationRequirement?: string;
    otherRequirement?: string;
    recruitmentCount?: string;
  }>;
  attachments: Array<{
    fileName: string;
  }>;
};

export type RecruitmentCompanySearchInput = PageRequest & {
  companyName?: string;
  companyTypes?: string[];
};

export type RecruitmentCompanySummary = {
  companyId: string;
  companyName: string;
  companyType?: string;
  businessNumber?: string;
  homepage?: string;
  introSummary?: string;
};

export type RecruitmentCompanyProfile = RecruitmentCompanySummary & {
  intro?: string;
  mainBusiness?: string;
  welfare: Array<{
    category?: string;
    content?: string;
  }>;
  history: Array<{
    year?: string;
    month?: string;
    content?: string;
  }>;
  talentKeywords: Array<{
    keyword?: string;
    description?: string;
  }>;
};

export type EmploymentEventSearchInput = PageRequest & {
  areaCode?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
};

export type EmploymentEventSummary = {
  eventId: string;
  areaCode: string;
  areaName?: string;
  name: string;
  term?: string;
  startDate?: string;
};

export type EmploymentEventView = EmploymentEventSummary & {
  place?: string;
  participatingCompanyInfo?: string;
  additionalNotes?: string;
  inquiryPhone?: string;
  fax?: string;
  charger?: string;
  email?: string;
  visitPath?: string;
};

export type TrainingSearchInput = PageRequest & {
  trainingKind: "national" | "business" | "consortium" | "work-study";
  startDate: string;
  endDate: string;
  area1?: string;
  area2?: string;
  ncs1?: string;
  processName?: string;
  organizationName?: string;
};

export type TrainingSummary = {
  courseId?: string;
  courseDegree?: string;
  organizationId?: string;
  title?: string;
  subTitle?: string;
  startDate?: string;
  endDate?: string;
  address?: string;
  trainTarget?: string;
  realCost?: string;
  employmentRate3?: string;
  employmentRate6?: string;
};

export type TrainingSession = {
  courseId?: string;
  courseDegree?: string;
  courseName?: string;
  startDate?: string;
  endDate?: string;
  fixedCount?: string;
  participantCount?: string;
  totalCost?: string;
  employmentRate3?: string;
  employmentRate6?: string;
};

export type TrainingDetailView = {
  summary: TrainingSummary;
  institutionName?: string;
  homepage?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  totalTrainingDays?: string;
  totalTrainingHours?: string;
  governmentSupportAmount?: string;
  facilities: Array<{
    name?: string;
    holdQuantity?: string;
    areaSquareMeter?: string;
    occupancyCount?: string;
  }>;
  equipment: Array<{
    name?: string;
    holdQuantity?: string;
  }>;
  sessions: TrainingSession[];
};

export type JobProgramSearchInput = PageRequest & {
  startDate?: string;
  topOrgCode?: string;
  orgCode?: string;
};

export type JobProgramSummary = {
  orgName?: string;
  programName?: string;
  programSubName?: string;
  target?: string;
  startDate?: string;
  endDate?: string;
  openTime?: string;
  place?: string;
};

export type SmallGiantCompanySearchInput = PageRequest & {
  region?: string;
};

export type SmallGiantCompanySummary = {
  companyName: string;
  businessNumber?: string;
  representativeName?: string;
  regionName?: string;
  industryName?: string;
  homepage?: string;
  workerCount?: string;
  brandName?: string;
};

export type DepartmentSearchInput = {
  keyword: string;
};

export type DepartmentSummary = {
  departmentKey: string;
  departmentType: "general" | "special";
  categoryId: string;
  departmentId: string;
  departmentName: string;
  detailDepartmentName?: string;
};

export type DepartmentView = DepartmentSummary & {
  introSummary?: string;
  aptitudeInterest?: string;
  whatStudy?: string;
  howPrepare?: string;
  jobProspect?: string;
  relatedDepartments: string[];
  subjects: string[];
  licenses: string[];
  relatedJobs: string[];
};

export type JobSearchInput = {
  keyword?: string;
  salaryBand?: string;
  prospect?: string;
};

export type JobSummary = {
  jobCode: string;
  jobName: string;
  classCode?: string;
  className?: string;
};

export type JobView = JobSummary & {
  largeClassName?: string;
  middleClassName?: string;
  smallClassName?: string;
  summary?: string;
  way?: string;
  salary?: string;
  satisfaction?: string;
  prospect?: string;
  status?: string;
  executionJob?: string;
  technicalKnowledge?: string;
  relatedMajors: string[];
  relatedCertificates: string[];
  relatedOrganizations: Array<{
    name?: string;
    url?: string;
  }>;
};

export interface RecruitmentService {
  searchRecruitments(
    input: RecruitmentSearchInput,
  ): Promise<PageResult<RecruitmentSummary>>;

  getRecruitment(recruitmentId: string): Promise<RecruitmentDetailView>;

  searchRecruitmentCompanies(
    input: RecruitmentCompanySearchInput,
  ): Promise<PageResult<RecruitmentCompanySummary>>;

  getRecruitmentCompany(companyId: string): Promise<RecruitmentCompanyProfile>;

  searchEmploymentEvents(
    input: EmploymentEventSearchInput,
  ): Promise<PageResult<EmploymentEventSummary>>;

  getEmploymentEvent(eventId: string, areaCode: string): Promise<EmploymentEventView>;
}

export interface TrainingService {
  searchTrainings(
    input: TrainingSearchInput,
  ): Promise<PageResult<TrainingSummary>>;

  getTraining(
    trainingKind: TrainingSearchInput["trainingKind"],
    courseId: string,
    courseDegree?: string,
    organizationId?: string,
  ): Promise<TrainingDetailView>;
}

export interface EmploymentSupportService {
  listJobPrograms(
    input: JobProgramSearchInput,
  ): Promise<PageResult<JobProgramSummary>>;
}

export interface CompanyDiscoveryService {
  listSmallGiantCompanies(
    input: SmallGiantCompanySearchInput,
  ): Promise<PageResult<SmallGiantCompanySummary>>;
}

export interface EducationCatalogService {
  searchDepartments(input: DepartmentSearchInput): Promise<DepartmentSummary[]>;

  getDepartment(departmentKey: string): Promise<DepartmentView>;
}

export interface CareerCatalogService {
  searchJobs(input: JobSearchInput): Promise<JobSummary[]>;

  getJob(jobCode: string): Promise<JobView>;
}

export interface WorknetApplicationService
  extends RecruitmentService,
    TrainingService,
    EmploymentSupportService,
    CompanyDiscoveryService,
    EducationCatalogService,
    CareerCatalogService {}
