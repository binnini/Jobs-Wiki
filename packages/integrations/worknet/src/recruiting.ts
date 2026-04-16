import { createHash } from "node:crypto";
import type { WorknetEmploymentApi } from "./adapter.ts";
import type {
  EmploymentTypeCode,
  OpenRecruitCompanyDetail,
  OpenRecruitCompanyListItem,
  OpenRecruitDetail,
  OpenRecruitListItem,
  OpenRecruitListParams,
  PaginatedResult,
  SortOrder,
} from "./types.ts";

export const WORKNET_RECRUITING_PAYLOAD_VERSION = "recruiting-source-payload/v1";

export type RecruitingPayloadProvider = "worknet";
export type RecruitingSourceKind = "open_recruitment";

export type RecruitingSourceRef = {
  payloadVersion: typeof WORKNET_RECRUITING_PAYLOAD_VERSION;
  provider: RecruitingPayloadProvider;
  kind: RecruitingSourceKind;
  sourceId: string;
  title: string;
  companyName: string;
  companySourceId?: string;
  sourceUrl?: string;
  mobileSourceUrl?: string;
  startsAt?: string;
  closesAt?: string;
  employmentType?: string;
  fetchedAt: string;
};

export type RecruitingSourceListParams = {
  authKey?: string;
  page: number;
  size: number;
  titleQuery?: string;
  companyTypeFilters?: OpenRecruitListParams["companyTypeCodes"];
  employmentTypeFilters?: EmploymentTypeCode[];
  careerStageFilters?: OpenRecruitListParams["careerTypeCodes"];
  educationLevelFilters?: OpenRecruitListParams["educationLevelCodes"];
  jobCode?: string;
  businessNumber?: string;
  sortBy?: "posted_at" | "company_name";
  sortDirection?: SortOrder;
};

export type RecruitingSourceGetParams = {
  authKey?: string;
  sourceId: string;
  includeRaw?: boolean;
};

export type RecruitingSourceProvenance = {
  provider: RecruitingPayloadProvider;
  kind: RecruitingSourceKind;
  sourceId: string;
  companySourceId?: string;
  sourceUrl?: string;
  mobileSourceUrl?: string;
  fetchedAt: string;
  contentHash?: string;
};

export type RecruitingJobPostingPayload = {
  title: string;
  companyName: string;
  companyType?: string;
  employmentType?: string;
  startsAt?: string;
  closesAt?: string;
  summary?: string;
  applicationMethod?: string;
  requiredDocuments?: string;
  acceptanceAnnouncement?: string;
  inquiry?: string;
  notes?: string;
};

export type RecruitingCompanyPayload = {
  sourceCompanyId?: string;
  name: string;
  companyType?: string;
  homepageUrl?: string;
  businessNumber?: string;
  summary?: string;
  description?: string;
  mainBusiness?: string;
  logoUrl?: string;
  coordinates?: {
    latitude?: string;
    longitude?: string;
  };
};

export type RecruitingJobPayload = {
  sourceCode?: string;
  name?: string;
};

export type RecruitingSelectionStepPayload = {
  name?: string;
  schedule?: string;
  description?: string;
  note?: string;
};

export type RecruitingRecruitmentSectionPayload = {
  title?: string;
  roleDescription?: string;
  selectionDescription?: string;
  location?: string;
  careerRequirement?: string;
  educationRequirement?: string;
  otherRequirement?: string;
  openings?: string;
  note?: string;
};

export type RecruitingAttachmentPayload = {
  fileName: string;
};

export type RecruitingSourceRawBlock = {
  openRecruitmentListItem?: OpenRecruitListItem;
  openRecruitmentDetail?: OpenRecruitDetail;
  openRecruitmentCompanyMatch?: OpenRecruitCompanyListItem;
  openRecruitmentCompanyDetail?: OpenRecruitCompanyDetail;
};

export type RecruitingSourcePayload = {
  payloadVersion: typeof WORKNET_RECRUITING_PAYLOAD_VERSION;
  source: RecruitingSourceProvenance;
  posting: RecruitingJobPostingPayload;
  company?: RecruitingCompanyPayload;
  jobs: RecruitingJobPayload[];
  recruitmentSections: RecruitingRecruitmentSectionPayload[];
  selectionSteps: RecruitingSelectionStepPayload[];
  attachments: RecruitingAttachmentPayload[];
  raw?: RecruitingSourceRawBlock;
};

export interface WorknetRecruitingSourceProvider {
  listRecruitingSources(
    params: RecruitingSourceListParams,
  ): Promise<PaginatedResult<RecruitingSourceRef>>;

  getRecruitingSource(
    params: RecruitingSourceGetParams,
  ): Promise<RecruitingSourcePayload>;
}

export type WorknetRecruitingProviderOptions = {
  clock?: () => Date;
};

function mapSortBy(sortBy?: RecruitingSourceListParams["sortBy"]): OpenRecruitListParams["sortField"] {
  if (sortBy === "company_name") return "coNm";
  if (sortBy === "posted_at") return "regDt";
  return undefined;
}

function isoNow(clock: () => Date): string {
  return clock().toISOString();
}

function safeHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function mapSourceRef(
  item: OpenRecruitListItem,
  fetchedAt: string,
  companySourceId?: string,
): RecruitingSourceRef {
  return {
    payloadVersion: WORKNET_RECRUITING_PAYLOAD_VERSION,
    provider: "worknet",
    kind: "open_recruitment",
    sourceId: item.empSeqno,
    title: item.title,
    companyName: item.companyName,
    companySourceId,
    sourceUrl: item.detailUrl,
    mobileSourceUrl: item.mobileUrl,
    startsAt: item.startDate,
    closesAt: item.endDate,
    employmentType: item.employmentTypeName,
    fetchedAt,
  };
}

function mapPosting(detail: OpenRecruitDetail): RecruitingJobPostingPayload {
  return {
    title: detail.title,
    companyName: detail.companyName,
    companyType: detail.companyTypeName,
    employmentType: detail.employmentTypeName,
    startsAt: detail.startDate,
    closesAt: detail.endDate,
    summary: detail.recruitmentSummary,
    applicationMethod: detail.receiptMethodContent,
    requiredDocuments: detail.submitDocumentContent,
    acceptanceAnnouncement: detail.acceptanceAnnouncementContent,
    inquiry: detail.inquiryContent,
    notes: detail.etcContent ?? detail.commonRequirementContent,
  };
}

function mapCompany(
  detail: OpenRecruitDetail,
  companyMatch?: OpenRecruitCompanyListItem,
  companyDetail?: OpenRecruitCompanyDetail,
): RecruitingCompanyPayload {
  const baseName = companyDetail?.companyName ?? companyMatch?.companyName ?? detail.companyName;
  return {
    sourceCompanyId: companyDetail?.empCoNo ?? companyMatch?.empCoNo,
    name: baseName,
    companyType: companyDetail?.companyTypeName ?? companyMatch?.companyTypeName ?? detail.companyTypeName,
    homepageUrl: companyDetail?.homepage ?? detail.companyHomepage ?? companyMatch?.homepage,
    businessNumber: companyDetail?.businessNumber ?? companyMatch?.businessNumber,
    summary: companyDetail?.companyIntroSummary ?? companyMatch?.companyIntroSummary,
    description: companyDetail?.companyIntro ?? companyMatch?.companyIntro,
    mainBusiness: companyDetail?.mainBusiness ?? companyMatch?.mainBusiness,
    logoUrl: companyDetail?.logoUrl ?? companyMatch?.logoUrl,
    coordinates:
      companyDetail?.latitude || companyDetail?.longitude
        ? {
            latitude: companyDetail.latitude,
            longitude: companyDetail.longitude,
          }
        : companyMatch?.latitude || companyMatch?.longitude
          ? {
              latitude: companyMatch.latitude,
              longitude: companyMatch.longitude,
            }
          : undefined,
  };
}

function mapJobs(detail: OpenRecruitDetail): RecruitingJobPayload[] {
  return detail.jobs.map((job) => ({
    sourceCode: job.jobsCode,
    name: job.jobsName,
  }));
}

function mapSelectionSteps(detail: OpenRecruitDetail): RecruitingSelectionStepPayload[] {
  return detail.selectionSteps.map((step) => ({
    name: step.name,
    schedule: step.schedule,
    description: step.content,
    note: step.memo,
  }));
}

function mapRecruitmentSections(detail: OpenRecruitDetail): RecruitingRecruitmentSectionPayload[] {
  return detail.recruitmentSections.map((section) => ({
    title: section.name,
    roleDescription: section.jobDescription,
    selectionDescription: section.selectionContent,
    location: section.workRegion,
    careerRequirement: section.careerRequirement,
    educationRequirement: section.educationRequirement,
    otherRequirement: section.otherRequirement,
    openings: section.recruitmentCount,
    note: section.memo,
  }));
}

function mapAttachments(detail: OpenRecruitDetail): RecruitingAttachmentPayload[] {
  return detail.attachments.map((attachment) => ({
    fileName: attachment.fileName,
  }));
}

function chooseCompanyMatch(
  detail: OpenRecruitDetail,
  page: PaginatedResult<OpenRecruitCompanyListItem>,
): OpenRecruitCompanyListItem | undefined {
  const normalizedName = detail.companyName.trim().toLowerCase();
  const exact = page.items.find((item) => item.companyName.trim().toLowerCase() === normalizedName);
  return exact ?? page.items[0];
}

export class WorknetRecruitingProvider implements WorknetRecruitingSourceProvider {
  readonly employmentApi: WorknetEmploymentApi;
  readonly clock: () => Date;

  constructor(
    employmentApi: WorknetEmploymentApi,
    options: WorknetRecruitingProviderOptions = {},
  ) {
    this.employmentApi = employmentApi;
    this.clock = options.clock ?? (() => new Date());
  }

  async listRecruitingSources(
    params: RecruitingSourceListParams,
  ): Promise<PaginatedResult<RecruitingSourceRef>> {
    const fetchedAt = isoNow(this.clock);
    const page = await this.employmentApi.listOpenRecruitments({
      authKey: params.authKey ?? "",
      page: params.page,
      size: params.size,
      title: params.titleQuery,
      companyTypeCodes: params.companyTypeFilters,
      employmentTypeCodes: params.employmentTypeFilters,
      careerTypeCodes: params.careerStageFilters,
      educationLevelCodes: params.educationLevelFilters,
      jobsCode: params.jobCode,
      businessNumber: params.businessNumber,
      sortField: mapSortBy(params.sortBy),
      sortOrder: params.sortDirection,
    });

    return {
      total: page.total,
      page: page.page,
      size: page.size,
      items: page.items.map((item) => mapSourceRef(item, fetchedAt)),
    };
  }

  async getRecruitingSource(
    params: RecruitingSourceGetParams,
  ): Promise<RecruitingSourcePayload> {
    const fetchedAt = isoNow(this.clock);
    const detail = await this.employmentApi.getOpenRecruitmentDetail({
      authKey: params.authKey ?? "",
      empSeqno: params.sourceId,
    });

    let companyMatch: OpenRecruitCompanyListItem | undefined;
    let companyDetail: OpenRecruitCompanyDetail | undefined;

    if (detail.companyName) {
      const companyPage = await this.employmentApi.listOpenRecruitCompanies({
        authKey: params.authKey ?? "",
        page: 1,
        size: 5,
        companyName: detail.companyName,
      });
      companyMatch = chooseCompanyMatch(detail, companyPage);

      if (companyMatch?.empCoNo) {
        companyDetail = await this.employmentApi.getOpenRecruitCompanyDetail({
          authKey: params.authKey ?? "",
          empCoNo: companyMatch.empCoNo,
        });
      }
    }

    const company = mapCompany(detail, companyMatch, companyDetail);
    const payloadPreview = {
      sourceId: params.sourceId,
      title: detail.title,
      companyName: company.name,
      startsAt: detail.startDate,
      closesAt: detail.endDate,
      employmentType: detail.employmentTypeName,
      jobs: mapJobs(detail),
      recruitmentSections: mapRecruitmentSections(detail),
      selectionSteps: mapSelectionSteps(detail),
      attachments: mapAttachments(detail),
    };

    return {
      payloadVersion: WORKNET_RECRUITING_PAYLOAD_VERSION,
      source: {
        provider: "worknet",
        kind: "open_recruitment",
        sourceId: params.sourceId,
        companySourceId: company.sourceCompanyId,
        sourceUrl: detail.detailUrl,
        mobileSourceUrl: detail.mobileUrl,
        fetchedAt,
        contentHash: safeHash(payloadPreview),
      },
      posting: mapPosting(detail),
      company,
      jobs: payloadPreview.jobs,
      recruitmentSections: payloadPreview.recruitmentSections,
      selectionSteps: payloadPreview.selectionSteps,
      attachments: payloadPreview.attachments,
      raw: params.includeRaw
        ? {
            openRecruitmentDetail: detail,
            openRecruitmentCompanyMatch: companyMatch,
            openRecruitmentCompanyDetail: companyDetail,
          }
        : undefined,
    };
  }
}
