import type {
  DepartmentDetailParams,
  DepartmentListItem,
  DepartmentSearchParams,
  EmploymentEventDetail,
  EmploymentEventDetailParams,
  EmploymentEventListItem,
  EmploymentEventListParams,
  GeneralDepartmentDetail,
  HrdTrainingDetail,
  HrdTrainingIdentity,
  HrdTrainingListItem,
  HrdTrainingListParams,
  HrdTrainingScheduleItem,
  JobAbilityKnowledgeEnvironmentDetail,
  JobActivityDetail,
  JobCharacterInterestValueDetail,
  JobDetailIdentity,
  JobEducationDetail,
  JobListItem,
  JobProgramListItem,
  JobProgramListParams,
  JobSalaryProspectDetail,
  JobSearchParams,
  JobSummaryDetail,
  JobWorkDetail,
  OpenRecruitCompanyDetail,
  OpenRecruitCompanyDetailParams,
  OpenRecruitCompanyListItem,
  OpenRecruitCompanyListParams,
  OpenRecruitDetail,
  OpenRecruitDetailParams,
  OpenRecruitListItem,
  OpenRecruitListParams,
  PaginatedResult,
  SmallGiantCompanyItem,
  SmallGiantCompanyListParams,
  SpecialDepartmentDetail,
} from "./types";

export interface WorknetEmploymentApi {
  listEmploymentEvents(
    params: EmploymentEventListParams,
  ): Promise<PaginatedResult<EmploymentEventListItem>>;

  getEmploymentEventDetail(
    params: EmploymentEventDetailParams,
  ): Promise<EmploymentEventDetail>;

  listOpenRecruitments(
    params: OpenRecruitListParams,
  ): Promise<PaginatedResult<OpenRecruitListItem>>;

  getOpenRecruitmentDetail(
    params: OpenRecruitDetailParams,
  ): Promise<OpenRecruitDetail>;

  listOpenRecruitCompanies(
    params: OpenRecruitCompanyListParams,
  ): Promise<PaginatedResult<OpenRecruitCompanyListItem>>;

  getOpenRecruitCompanyDetail(
    params: OpenRecruitCompanyDetailParams,
  ): Promise<OpenRecruitCompanyDetail>;
}

export interface WorknetTrainingApi {
  listTrainings(
    params: HrdTrainingListParams,
  ): Promise<PaginatedResult<HrdTrainingListItem>>;

  getTrainingDetail(params: HrdTrainingIdentity): Promise<HrdTrainingDetail>;

  listTrainingSchedules(
    params: HrdTrainingIdentity,
  ): Promise<HrdTrainingScheduleItem[]>;
}

export interface WorknetProgramApi {
  listJobPrograms(
    params: JobProgramListParams,
  ): Promise<PaginatedResult<JobProgramListItem>>;
}

export interface WorknetCompanyApi {
  listSmallGiantCompanies(
    params: SmallGiantCompanyListParams,
  ): Promise<PaginatedResult<SmallGiantCompanyItem>>;
}

export interface WorknetDepartmentApi {
  searchDepartments(
    params: DepartmentSearchParams,
  ): Promise<DepartmentListItem[]>;

  getGeneralDepartmentDetail(
    params: DepartmentDetailParams,
  ): Promise<GeneralDepartmentDetail>;

  getSpecialDepartmentDetail(
    params: DepartmentDetailParams,
  ): Promise<SpecialDepartmentDetail>;
}

export interface WorknetJobApi {
  searchJobs(params: JobSearchParams): Promise<JobListItem[]>;

  getJobSummaryDetail(params: JobDetailIdentity): Promise<JobSummaryDetail>;

  getJobWorkDetail(params: JobDetailIdentity): Promise<JobWorkDetail>;

  getJobEducationDetail(params: JobDetailIdentity): Promise<JobEducationDetail>;

  getJobSalaryProspectDetail(
    params: JobDetailIdentity,
  ): Promise<JobSalaryProspectDetail>;

  getJobAbilityKnowledgeEnvironmentDetail(
    params: JobDetailIdentity,
  ): Promise<JobAbilityKnowledgeEnvironmentDetail>;

  getJobCharacterInterestValueDetail(
    params: JobDetailIdentity,
  ): Promise<JobCharacterInterestValueDetail>;

  getJobActivityDetail(params: JobDetailIdentity): Promise<JobActivityDetail>;
}

export interface WorknetApiAdapter
  extends WorknetEmploymentApi,
    WorknetTrainingApi,
    WorknetProgramApi,
    WorknetCompanyApi,
    WorknetDepartmentApi,
    WorknetJobApi {}
