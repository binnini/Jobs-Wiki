import { createHash } from "node:crypto";
import type {
  RecruitingSelectionStepPayload,
  RecruitingSourcePayload,
} from "../../integrations/worknet/src/recruiting.ts";

export const RECRUITING_DOMAIN = "recruiting";
export const RECRUITING_PACK_VERSION = "2026-04-18";
export const WORKNET_RECRUITING_PROPOSAL_PRODUCER =
  "jobs-wiki.worknet.open_recruitment.mapper/v1";
export const WORKNET_RECRUITING_EVIDENCE_CONNECTOR = "worknet.open_recruitment";

export const WORKNET_RECRUITING_V1_AMBIGUOUS_FIELDS = ["posting.notes"] as const;

export const WORKNET_RECRUITING_V1_OMITTED_FIELDS = [
  "posting.applicationMethod",
  "posting.requiredDocuments",
  "posting.inquiry",
  "company.logoUrl",
  "company.coordinates",
  "recruitmentSections[].openings",
  "recruitmentSections[].note",
  "attachments[]",
] as const;

export type ProposalIdentityHintName =
  | "source_id"
  | "external_id"
  | "business_number"
  | "normalized_name";

export type ProposalIdentityHints = Partial<
  Record<ProposalIdentityHintName, string>
>;

export type ProposalEvidenceRef = {
  connector: string;
  sourceId: string;
  pointer?: string;
};

export type ProposalEntityRef = {
  proposalId: string;
};

export type FactProposal<EntityType extends string = string> = {
  proposalId: string;
  domain: typeof RECRUITING_DOMAIN;
  entityType: EntityType;
  attributes: Record<string, unknown>;
  identityHints?: ProposalIdentityHints;
  evidence: ProposalEvidenceRef[];
};

export type RelationProposal<RelationType extends string = string> = {
  proposalId: string;
  domain: typeof RECRUITING_DOMAIN;
  relationType: RelationType;
  fromRef: ProposalEntityRef;
  toRef: ProposalEntityRef;
  attributes?: Record<string, unknown>;
  evidence: ProposalEvidenceRef[];
};

export type DomainProposalBatch = {
  domain: typeof RECRUITING_DOMAIN;
  packVersion: string;
  producer: string;
  facts: FactProposal[];
  relations: RelationProposal[];
};

export type MapRecruitingSourceToProposalBatchOptions = {
  packVersion?: string;
  producer?: string;
};

type RoleMapping = {
  proposalId: string;
  attributes: Record<string, unknown>;
  identityHints: ProposalIdentityHints;
  evidencePointers: string[];
};

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: " ",
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const numeric = entity[1]?.toLowerCase() === "x"
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : match;
    }

    return HTML_ENTITY_MAP[entity] ?? match;
  });
}

function normalizeText(value?: string): string | undefined {
  if (value == null) return undefined;
  const normalized = decodeHtmlEntities(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+\n/g, "\n")
    .replace(/\n[ \t\f\v]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized === "" ? undefined : normalized;
}

function normalizeInlineText(value?: string): string | undefined {
  const normalized = normalizeText(value);
  return normalized?.replace(/\s+/g, " ");
}

function normalizeNameHint(value?: string): string | undefined {
  const normalized = normalizeInlineText(value);
  return normalized?.toLowerCase();
}

function normalizeEmploymentType(value?: string): string | undefined {
  const normalized = normalizeInlineText(value);
  if (!normalized) return undefined;

  const values = uniqueValues(
    normalized
      .split("|")
      .map((item) => normalizeInlineText(item)),
  );

  const filtered = values.length > 1
    ? values.filter((item) => item !== "기타")
    : values;

  return filtered.length > 0 ? filtered.join("|") : undefined;
}

function normalizeDigits(value?: string): string | undefined {
  const normalized = value?.replace(/\D+/g, "");
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function compactRecord(
  record: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value != null && value !== ""),
  );
}

function uniqueValues(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }

  return unique;
}

function hashSuffix(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function createEvidence(
  payload: RecruitingSourcePayload,
  pointer?: string,
): ProposalEvidenceRef {
  return {
    connector: WORKNET_RECRUITING_EVIDENCE_CONNECTOR,
    sourceId: payload.source.sourceId,
    pointer,
  };
}

function uniqueEvidence(evidence: ProposalEvidenceRef[]): ProposalEvidenceRef[] {
  const seen = new Set<string>();
  const result: ProposalEvidenceRef[] = [];

  for (const item of evidence) {
    const key = `${item.connector}:${item.sourceId}:${item.pointer ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function formatSectionValue(
  sectionTitle: string | undefined,
  value: string | undefined,
  options: {
    includeSectionTitle?: boolean;
  } = {},
): string | undefined {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return undefined;

  if (options.includeSectionTitle === false) {
    return normalizedValue;
  }

  const normalizedTitle = normalizeInlineText(sectionTitle);
  return normalizedTitle ? `${normalizedTitle}: ${normalizedValue}` : normalizedValue;
}

function formatLabeledSectionValue(
  sectionTitle: string | undefined,
  label: string,
  value: string | undefined,
  options: {
    includeSectionTitle?: boolean;
  } = {},
): string | undefined {
  const normalizedValue = normalizeInlineText(value);
  if (!normalizedValue) return undefined;

  if (options.includeSectionTitle === false) {
    return `${label}: ${normalizedValue}`;
  }

  const normalizedTitle = normalizeInlineText(sectionTitle);
  return normalizedTitle
    ? `${normalizedTitle} ${label}: ${normalizedValue}`
    : `${label}: ${normalizedValue}`;
}

function formatSelectionStep(step: RecruitingSelectionStepPayload): string | undefined {
  const name = normalizeInlineText(step.name);
  const details = compactRecord({
    "일정": normalizeInlineText(step.schedule),
    "설명": normalizeInlineText(step.description),
    "비고": normalizeInlineText(step.note),
  });
  const detailParts = Object.entries(details).map(([label, value]) => `${label}: ${value}`);

  if (!name && detailParts.length === 0) return undefined;
  if (!name) return detailParts.join(" | ");
  if (detailParts.length === 0) return name;
  return `${name} | ${detailParts.join(" | ")}`;
}

function joinParagraphs(parts: Array<string | undefined>): string | undefined {
  const paragraphs = uniqueValues(parts);
  return paragraphs.length > 0 ? paragraphs.join("\n\n") : undefined;
}

function joinLines(lines: Array<string | undefined>): string | undefined {
  const uniqueLines = uniqueValues(lines);
  return uniqueLines.length > 0 ? uniqueLines.join("\n") : undefined;
}

function shouldIncludeSectionTitles(
  payload: RecruitingSourcePayload,
  fieldSelector: (
    section: RecruitingSourcePayload["recruitmentSections"][number],
  ) => string | undefined,
): boolean {
  const contributingTitles = uniqueValues(
    payload.recruitmentSections
      .filter((section) => normalizeText(fieldSelector(section)))
      .map((section) => normalizeInlineText(section.title)),
  );

  return contributingTitles.length > 1;
}

function buildPostingSummary(payload: RecruitingSourcePayload): string | undefined {
  const roleDescriptions = payload.recruitmentSections.map((section) =>
    formatSectionValue(section.title, section.roleDescription),
  );

  return joinParagraphs([
    normalizeText(payload.posting.summary),
    roleDescriptions.length > 0 ? joinLines(roleDescriptions) : undefined,
  ]);
}

function buildLocationText(payload: RecruitingSourcePayload): string | undefined {
  const includeSectionTitle = shouldIncludeSectionTitles(
    payload,
    (section) => section.location,
  );

  return joinLines(
    payload.recruitmentSections.map((section) =>
      formatSectionValue(section.title, section.location, { includeSectionTitle }),
    ),
  );
}

function buildRequirementsText(payload: RecruitingSourcePayload): string | undefined {
  const includeSectionTitle = shouldIncludeSectionTitles(
    payload,
    (section) =>
      section.careerRequirement ??
      section.educationRequirement ??
      section.otherRequirement,
  );

  return joinLines([
    ...payload.recruitmentSections.map((section) =>
      formatLabeledSectionValue(section.title, "경력", section.careerRequirement, {
        includeSectionTitle,
      }),
    ),
    ...payload.recruitmentSections.map((section) =>
      formatLabeledSectionValue(section.title, "학력", section.educationRequirement, {
        includeSectionTitle,
      }),
    ),
    ...payload.recruitmentSections.map((section) =>
      formatLabeledSectionValue(section.title, "기타 요건", section.otherRequirement, {
        includeSectionTitle,
      }),
    ),
  ]);
}

function buildSelectionProcessText(payload: RecruitingSourcePayload): string | undefined {
  return joinLines([
    ...payload.recruitmentSections.map((section) =>
      formatSectionValue(section.title, section.selectionDescription),
    ),
    ...payload.selectionSteps.map((step) => formatSelectionStep(step)),
    normalizeInlineText(payload.posting.acceptanceAnnouncement)
      ? `합격 발표: ${normalizeInlineText(payload.posting.acceptanceAnnouncement)}`
      : undefined,
  ]);
}

function createPostingProposalId(sourceId: string): string {
  return `job_posting:worknet:${sourceId}`;
}

function createCompanyProposalId(hints: ProposalIdentityHints): string {
  if (hints.external_id) return `company:worknet:${hints.external_id}`;
  if (hints.business_number) return `company:business:${hints.business_number}`;
  if (hints.normalized_name) {
    return `company:name:${hashSuffix(hints.normalized_name)}`;
  }

  throw new Error("company proposal requires at least one identity hint");
}

function createRoleProposalId(hints: ProposalIdentityHints): string {
  if (hints.external_id) return `role:worknet:${hints.external_id}`;
  if (hints.normalized_name) {
    return `role:name:${hashSuffix(hints.normalized_name)}`;
  }

  throw new Error("role proposal requires at least one identity hint");
}

function createRelationProposalId(
  relationType: "posted_by" | "for_role",
  fromId: string,
  toId: string,
): string {
  return `relation:${relationType}:${fromId}:${toId}`;
}

function createPostingFact(payload: RecruitingSourcePayload): FactProposal<"job_posting"> {
  const sourceId = normalizeText(payload.source.sourceId);
  const title = normalizeText(payload.posting.title);

  if (!sourceId) {
    throw new Error("recruiting source payload must include source.sourceId");
  }

  if (!title) {
    throw new Error("recruiting source payload must include posting.title");
  }

  const attributes = compactRecord({
    title,
    summary: buildPostingSummary(payload),
    employment_type: normalizeEmploymentType(payload.posting.employmentType),
    opens_at: normalizeText(payload.posting.startsAt),
    closes_at: normalizeText(payload.posting.closesAt),
    source_url: normalizeText(payload.source.sourceUrl),
    mobile_source_url: normalizeText(payload.source.mobileSourceUrl),
    location_text: buildLocationText(payload),
    requirements_text: buildRequirementsText(payload),
    selection_process_text: buildSelectionProcessText(payload),
  });

  const evidence = [createEvidence(payload, "posting")];
  if (payload.recruitmentSections.some((section) => normalizeText(section.title) || normalizeText(section.roleDescription) || normalizeText(section.selectionDescription) || normalizeText(section.location) || normalizeText(section.careerRequirement) || normalizeText(section.educationRequirement) || normalizeText(section.otherRequirement))) {
    evidence.push(
      ...payload.recruitmentSections.map((_, index) =>
        createEvidence(payload, `recruitmentSections[${index}]`),
      ),
    );
  }
  if (payload.selectionSteps.some((step) => formatSelectionStep(step))) {
    evidence.push(
      ...payload.selectionSteps.map((_, index) =>
        createEvidence(payload, `selectionSteps[${index}]`),
      ),
    );
  }

  return {
    proposalId: createPostingProposalId(sourceId),
    domain: RECRUITING_DOMAIN,
    entityType: "job_posting",
    attributes,
    identityHints: {
      source_id: sourceId,
    },
    evidence: uniqueEvidence(evidence),
  };
}

function createCompanyFact(
  payload: RecruitingSourcePayload,
): FactProposal<"company"> | undefined {
  const company = payload.company;
  const name = normalizeText(company?.name);
  if (!company || !name) return undefined;

  const normalizedName = normalizeNameHint(name);
  const businessNumber = normalizeDigits(company.businessNumber);
  const identityHints = compactRecord({
    external_id: normalizeText(company.sourceCompanyId),
    business_number: businessNumber,
    normalized_name: normalizedName,
  });

  if (Object.keys(identityHints).length === 0) return undefined;

  return {
    proposalId: createCompanyProposalId(identityHints),
    domain: RECRUITING_DOMAIN,
    entityType: "company",
    attributes: compactRecord({
      name,
      normalized_name: normalizedName,
      company_type: normalizeInlineText(company.companyType),
      homepage_url: normalizeText(company.homepageUrl),
      business_number: businessNumber,
      summary: normalizeText(company.summary),
      description: normalizeText(company.description),
      main_business: normalizeInlineText(company.mainBusiness),
    }),
    identityHints,
    evidence: [createEvidence(payload, "company")],
  };
}

function collectRoleMappings(payload: RecruitingSourcePayload): RoleMapping[] {
  const mappedRoles = new Map<string, RoleMapping>();

  payload.jobs.forEach((job, index) => {
    const displayName = normalizeText(job.name);
    if (!displayName) return;

    const normalizedName = normalizeNameHint(displayName);
    const identityHints = compactRecord({
      external_id: normalizeText(job.sourceCode),
      normalized_name: normalizedName,
    });

    if (Object.keys(identityHints).length === 0) return;

    const proposalId = createRoleProposalId(identityHints);
    const existing = mappedRoles.get(proposalId);

    if (existing) {
      existing.evidencePointers.push(`jobs[${index}]`);
      return;
    }

    mappedRoles.set(proposalId, {
      proposalId,
      attributes: compactRecord({
        display_name: displayName,
        normalized_name: normalizedName,
        source_code: normalizeText(job.sourceCode),
      }),
      identityHints,
      evidencePointers: [`jobs[${index}]`],
    });
  });

  return Array.from(mappedRoles.values());
}

export function mapRecruitingSourceToDomainProposalBatch(
  payload: RecruitingSourcePayload,
  options: MapRecruitingSourceToProposalBatchOptions = {},
): DomainProposalBatch {
  const postingFact = createPostingFact(payload);
  const companyFact = createCompanyFact(payload);
  const roleMappings = collectRoleMappings(payload);

  const facts: FactProposal[] = [
    postingFact,
    ...(companyFact ? [companyFact] : []),
    ...roleMappings.map((role) => ({
      proposalId: role.proposalId,
      domain: RECRUITING_DOMAIN,
      entityType: "role" as const,
      attributes: role.attributes,
      identityHints: role.identityHints,
      evidence: uniqueEvidence(
        role.evidencePointers.map((pointer) => createEvidence(payload, pointer)),
      ),
    })),
  ];

  const relations: RelationProposal[] = [];

  if (companyFact) {
    relations.push({
      proposalId: createRelationProposalId(
        "posted_by",
        postingFact.proposalId,
        companyFact.proposalId,
      ),
      domain: RECRUITING_DOMAIN,
      relationType: "posted_by",
      fromRef: { proposalId: postingFact.proposalId },
      toRef: { proposalId: companyFact.proposalId },
      evidence: uniqueEvidence([
        createEvidence(payload, "posting"),
        createEvidence(payload, "company"),
      ]),
    });
  }

  for (const role of roleMappings) {
    relations.push({
      proposalId: createRelationProposalId(
        "for_role",
        postingFact.proposalId,
        role.proposalId,
      ),
      domain: RECRUITING_DOMAIN,
      relationType: "for_role",
      fromRef: { proposalId: postingFact.proposalId },
      toRef: { proposalId: role.proposalId },
      evidence: uniqueEvidence([
        createEvidence(payload, "posting"),
        ...role.evidencePointers.map((pointer) => createEvidence(payload, pointer)),
      ]),
    });
  }

  return {
    domain: RECRUITING_DOMAIN,
    packVersion: options.packVersion ?? RECRUITING_PACK_VERSION,
    producer: options.producer ?? WORKNET_RECRUITING_PROPOSAL_PRODUCER,
    facts,
    relations,
  };
}

export function createProposalBatchFromWorknetRecruitingPayload(
  payload: RecruitingSourcePayload,
  options?: MapRecruitingSourceToProposalBatchOptions,
): DomainProposalBatch {
  return mapRecruitingSourceToDomainProposalBatch(payload, options);
}
