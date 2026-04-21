import {
  BarChart2,
  Bookmark,
  Briefcase,
  Calendar as CalIcon,
  FileCode,
  FileText,
  Search,
} from "lucide-react";

export const ONBOARDING_PROFILE_FIXTURE = {
  name: "김지훈",
  targetRole: "Backend Engineer",
  experience: "1년 (인턴십)",
  education: "컴퓨터공학과 학사",
  location: "서울/판교",
  domain: "금융, 커머스, 플랫폼",
  skills: ["Node.js", "REST API", "Docker", "SQL", "TypeScript"],
  goals: "대규모 트래픽 처리 경험을 쌓을 수 있는 코어 백엔드 직무",
  strengths: [
    "시스템 아키텍처 이해도",
    "API 설계 및 최적화",
    "컨테이너 기반 배포 경험",
  ],
  source: "Resume_v2.pdf, Github_Readme.md",
};

export const EMPTY_PROFILE_SNAPSHOT = {
  targetRole: "프로필 기준 로딩 중",
  experience: "기본 리포트 기준을 확인하는 중입니다",
  location: null,
  domain: null,
  skills: [],
};

export const SYNC_VISIBILITY_META = {
  applied: {
    badgeLabel: "최신 반영",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    noticeTitle: null,
    noticeMessage: null,
    noticeClassName: null,
  },
  pending: {
    badgeLabel: "갱신 중",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    noticeTitle: "마지막 확인 데이터를 유지하는 중입니다",
    noticeMessage: "새 데이터를 가져오는 동안 기존 화면을 유지합니다.",
    noticeClassName: "border-sky-200 bg-sky-50 text-sky-900",
  },
  partial: {
    badgeLabel: "부분 반영",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    noticeTitle: "일부 블록만 최신 상태입니다",
    noticeMessage: "준비된 정보는 먼저 보여주고, 나머지 블록은 순차적으로 채웁니다.",
    noticeClassName: "border-amber-200 bg-amber-50 text-amber-900",
  },
  unknown: {
    badgeLabel: "마지막 확인본",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    noticeTitle: "현재 화면은 마지막 확인 데이터를 기준으로 합니다",
    noticeMessage: "최신 반영 여부를 단정할 수 없어 마지막 성공 데이터를 유지합니다.",
    noticeClassName: "border-slate-200 bg-slate-100 text-slate-900",
  },
  stale: {
    badgeLabel: "오래되었을 수 있음",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    noticeTitle: "화면 데이터가 오래되었을 수 있습니다",
    noticeMessage: "마지막 성공 데이터를 유지하고 있으며 새로고침을 권장합니다.",
    noticeClassName: "border-amber-200 bg-amber-50 text-amber-900",
  },
};

export const COMMAND_STATUS_META = {
  accepted: { label: "접수됨", className: "border-sky-200 bg-sky-50 text-sky-700" },
  validating: { label: "검증 중", className: "border-sky-200 bg-sky-50 text-sky-700" },
  queued: { label: "대기 중", className: "border-sky-200 bg-sky-50 text-sky-700" },
  running: { label: "실행 중", className: "border-sky-200 bg-sky-50 text-sky-700" },
  succeeded: { label: "완료", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  failed: { label: "실패", className: "border-rose-200 bg-rose-50 text-rose-700" },
  cancelled: { label: "취소됨", className: "border-slate-200 bg-slate-100 text-slate-700" },
};

export const COMMAND_OUTCOME_META = {
  accepted_only: {
    title: "명령은 접수되었고 반영 여부는 follow-up sync에서 확인됩니다",
    message: "아직 projection별 최신 반영을 단정하지 않고 계속 상태를 확인합니다.",
    className: "border-sky-200 bg-sky-50 text-sky-900",
  },
  partially_applied: {
    title: "일부 projection만 최신 상태로 확인되었습니다",
    message: "적용된 화면은 바로 확인하고, 나머지 projection은 추가 반영을 기다립니다.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  fully_applied: {
    title: "관련 projection 반영이 확인되었습니다",
    message: "동기화 패널에서 반영된 projection 범위를 바로 확인할 수 있습니다.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  failed: {
    title: "명령 실행이 완료되지 않았습니다",
    message: "재시도가 가능하면 같은 화면에서 다시 요청할 수 있습니다.",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
};

export const SYNC_PROJECTION_LABELS = {
  workspace: "워크스페이스",
  workspace_summary: "기본 리포트",
  opportunity_list: "추천 공고",
  opportunity_detail: "공고 상세",
  calendar: "지원 일정",
  ask: "심층 분석",
};

export const WORKSPACE_LAYER_META = {
  shared: {
    subtitle: "shared reference / read-only",
    emptyLabel: "공유 해석 레이어가 준비되면 여기에서 읽습니다.",
  },
  personal_raw: {
    subtitle: "personal working notes",
    emptyLabel: "개인 raw 문서가 아직 없습니다.",
  },
  personal_wiki: {
    subtitle: "personal knowledge artifacts",
    emptyLabel: "개인 wiki 문서가 아직 없습니다.",
  },
};

export const WORKSPACE_KIND_LABELS = {
  report: "리포트",
  calendar: "캘린더",
  opportunity: "공고",
  document: "문서",
  ask: "분석",
};

export const DOCUMENT_LAYER_LABELS = {
  shared: "shared",
  personal_raw: "personal/raw",
  personal_wiki: "personal/wiki",
};

export const DEFAULT_INGESTION_SOURCE_ID = "worknet.recruiting";

export const SURFACE_SYNC_LABELS = {
  workspace: "워크스페이스",
  report: "리포트",
  detail: "공고 상세",
  document: "문서",
  ask: "심층 분석",
  calendar: "지원 일정",
};

export const SURFACE_RETRY_LABELS = {
  workspace: "워크스페이스 상태 다시 확인",
  report: "리포트 새로고침",
  detail: "공고 다시 확인",
  document: "문서 다시 확인",
  ask: "같은 질문 다시 분석",
  calendar: "캘린더 새로고침",
};

export function formatKoreanDate(value, options = {}) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: options.withYear === false ? undefined : "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit" }).format(date);
}

export function formatMonthDay(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(date);
}

export function formatKoreanDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function trimOptionalQueryParam(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function readAppRoute(location = window.location) {
  const normalizedPathname = location.pathname.replace(/\/+$/, "") || "/";
  const searchParams = new URLSearchParams(location.search);

  if (normalizedPathname === "/" || normalizedPathname === "/onboarding") {
    return { view: "onboarding", opportunityId: null, documentId: null };
  }
  if (normalizedPathname === "/review") {
    return { view: "extraction", opportunityId: null, documentId: null };
  }
  if (normalizedPathname === "/workspace") {
    return { view: "workspace", opportunityId: null, documentId: null };
  }
  if (normalizedPathname === "/report") {
    return { view: "report", opportunityId: null, documentId: null };
  }
  if (normalizedPathname === "/ask") {
    return {
      view: "ask",
      opportunityId: trimOptionalQueryParam(searchParams.get("opportunityId")),
      documentId: trimOptionalQueryParam(searchParams.get("documentId")),
    };
  }
  if (normalizedPathname === "/calendar") {
    return { view: "calendar", opportunityId: null, documentId: null };
  }

  const documentMatch = normalizedPathname.match(/^\/documents\/([^/]+)$/);
  if (documentMatch) {
    return { view: "document", opportunityId: null, documentId: decodeURIComponent(documentMatch[1]) };
  }

  const opportunityMatch = normalizedPathname.match(/^\/opportunities\/([^/]+)$/);
  if (opportunityMatch) {
    return { view: "detail", opportunityId: decodeURIComponent(opportunityMatch[1]), documentId: null };
  }

  return { view: "onboarding", opportunityId: null, documentId: null };
}

export function buildAppPath(view, opportunityId = null, documentId = null) {
  switch (view) {
    case "onboarding": return "/onboarding";
    case "extraction": return "/review";
    case "workspace": return "/workspace";
    case "report": return "/report";
    case "detail": return opportunityId ? `/opportunities/${encodeURIComponent(opportunityId)}` : "/workspace";
    case "document": return documentId ? `/documents/${encodeURIComponent(documentId)}` : "/workspace";
    case "ask": {
      const searchParams = new URLSearchParams();
      if (documentId) searchParams.set("documentId", documentId);
      else if (opportunityId) searchParams.set("opportunityId", opportunityId);
      const search = searchParams.toString();
      return `/ask${search ? `?${search}` : ""}`;
    }
    case "calendar": return "/calendar";
    default: return "/onboarding";
  }
}

export function writeAppRoute(route, { replace = false } = {}) {
  if (typeof window === "undefined") return;
  const nextUrl = buildAppPath(route.view, route.opportunityId, route.documentId);
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (currentUrl === nextUrl) return;
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", nextUrl);
}

export function formatEmploymentType(value) {
  const dictionary = { full_time: "정규직", contract: "계약직", internship: "인턴십", part_time: "파트타임" };
  return dictionary[value] ?? value ?? "고용 형태 미정";
}

export function formatStatusLabel(value) {
  const dictionary = { open: "모집 중", closing_soon: "마감 임박", closed: "마감", unknown: "상태 미정" };
  return dictionary[value] ?? "상태 미정";
}

export function getStatusBadgeClassName(status) {
  if (status === "closing_soon") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "open") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function getFallbackUrgencyLabel(value) {
  if (!value) return null;
  const target = new Date(value);
  const now = new Date();
  if (Number.isNaN(target.getTime())) return null;
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "마감 지남";
  return `D-${diff}`;
}

export function normalizeProfileSnapshot(profileSnapshot) {
  return {
    ...EMPTY_PROFILE_SNAPSHOT,
    ...(profileSnapshot ?? {}),
    skills: Array.isArray(profileSnapshot?.skills) ? profileSnapshot.skills : EMPTY_PROFILE_SNAPSHOT.skills,
  };
}

export function splitBlockText(value) {
  if (!value) return [];
  return value.split(/\n|•|,|->/g).map((item) => item.trim()).filter(Boolean);
}

export function getSyncMeta(sync) {
  if (!sync?.visibility) return null;
  return SYNC_VISIBILITY_META[sync.visibility] ?? null;
}

export function getCommandStatusMeta(status) {
  if (!status) return null;
  return COMMAND_STATUS_META[status] ?? null;
}

export function getCommandOutcomeMeta(outcome) {
  if (!outcome) return null;
  return COMMAND_OUTCOME_META[outcome] ?? null;
}

export function isTerminalCommandStatus(status) {
  return status === "succeeded" || status === "failed" || status === "cancelled";
}

export function formatProjectionLabel(projection) {
  return SYNC_PROJECTION_LABELS[projection] ?? projection ?? "알 수 없는 projection";
}

export function normalizeStringList(values) {
  if (!Array.isArray(values)) return [];
  return values.filter((value, index) => typeof value === "string" && values.indexOf(value) === index);
}

export function mapProjectionStates(projections) {
  if (!Array.isArray(projections)) return [];
  return projections
    .filter((projection) => typeof projection?.projection === "string" && typeof projection?.visibility === "string")
    .map((projection) => ({
      projection: projection.projection,
      visibility: projection.visibility,
      lastKnownVersion: projection.lastKnownVersion ?? projection.version ?? null,
      lastVisibleAt: projection.lastVisibleAt ?? projection.visibleAt ?? null,
      refreshRecommended: projection.refreshRecommended ?? (projection.visibility === "partial" || projection.visibility === "stale"),
    }));
}

export function mapWorkspaceCommand(command) {
  if (!command?.commandId) return null;
  return {
    commandId: command.commandId,
    status: command.status ?? null,
    outcome: command.outcome ?? null,
    acceptedAt: command.acceptedAt ?? null,
    finishedAt: command.finishedAt ?? null,
    affectedObjectRefs: normalizeStringList(command.affectedObjectRefs),
    affectedRelationRefs: normalizeStringList(command.affectedRelationRefs),
    refreshScopes: normalizeStringList(command.refreshScopes),
    error: command.error ? {
      code: command.error.code ?? "unknown_failure",
      message: command.error.message ?? "명령 상태를 해석하지 못했습니다.",
      retryable: Boolean(command.error.retryable),
    } : null,
  };
}

export function mapWorkspaceSyncResponse(response) {
  return {
    command: mapWorkspaceCommand(response?.command),
    projections: mapProjectionStates(response?.projections),
  };
}

export function mapAcceptedWorkspaceCommandResponse(response) {
  return {
    command: mapWorkspaceCommand(response),
    projections: mapProjectionStates(response?.projectionStates),
  };
}

export function createCommandAttemptKey(sourceId) {
  const commandIdSuffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  return `jobs-wiki-${sourceId}-${commandIdSuffix}`;
}

export function getCommandGuidance(command) {
  if (!command) return null;
  if (command.error?.message) {
    return {
      title: command.error.retryable ? "명령 실행이 일시적으로 실패했습니다" : "명령 실행에 실패했습니다",
      message: command.error.retryable
        ? `${command.error.message} 같은 패널에서 다시 요청할 수 있습니다.`
        : command.error.message,
      className: command.error.retryable
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900",
    };
  }
  const outcomeMeta = getCommandOutcomeMeta(command.outcome);
  if (outcomeMeta) return outcomeMeta;
  if (command.status === "accepted" || command.status === "queued") {
    return {
      title: "수동 갱신 요청이 접수되었습니다",
      message: "projection 반영 여부를 확인하기 위해 command 상태를 계속 조회합니다.",
      className: "border-sky-200 bg-sky-50 text-sky-900",
    };
  }
  if (command.status === "running" || command.status === "validating") {
    return {
      title: "WorkNet 갱신을 처리하는 중입니다",
      message: "완료 전까지는 마지막 확인 데이터를 유지하면서 상태를 갱신합니다.",
      className: "border-sky-200 bg-sky-50 text-sky-900",
    };
  }
  if (command.status === "succeeded") {
    return {
      title: "명령 처리 자체는 완료되었습니다",
      message: "projection별 최신 반영 여부는 아래 sync 상태를 기준으로 확인합니다.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    };
  }
  return null;
}

export function formatSurfaceLabel(surface) {
  return SURFACE_SYNC_LABELS[surface] ?? "현재 화면";
}

export function getSurfaceRetryLabel(surface, sync, refreshError) {
  if (surface === "ask" && refreshError) return "같은 질문 다시 분석";
  if (sync?.visibility === "pending") return `${formatSurfaceLabel(surface)} 상태 다시 확인`;
  return SURFACE_RETRY_LABELS[surface] ?? "다시 시도";
}

export function getSurfaceSyncGuidance(surface, sync) {
  if (!sync?.visibility) return null;
  const surfaceLabel = formatSurfaceLabel(surface);

  if (sync.visibility === "pending") {
    return {
      title: `${surfaceLabel}는 갱신 중입니다`,
      message: surface === "ask"
        ? "마지막 답변을 유지한 채 새 근거와 문맥을 다시 확인합니다."
        : `${surfaceLabel} 화면은 마지막 확인 데이터를 유지하고 있으며, 새 데이터가 준비되면 반영됩니다.`,
      className: "border-sky-200 bg-sky-50 text-sky-900",
      showRetry: true,
    };
  }
  if (sync.visibility === "partial") {
    return {
      title: `${surfaceLabel} 일부만 최신 상태입니다`,
      message: surface === "report"
        ? "추천 공고, 시장 브리프, 액션 큐 중 일부 블록만 먼저 갱신되었을 수 있습니다."
        : surface === "document"
          ? "문서 본문과 연관 분석 블록 중 일부가 마지막 확인본일 수 있습니다."
          : surface === "ask"
            ? "답변은 유지되지만 근거 또는 연관 공고 일부는 아직 최신이 아닐 수 있습니다."
            : "일정 목록 일부만 최신 상태일 수 있으므로 다시 확인을 권장합니다.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
      showRetry: true,
    };
  }
  if (sync.visibility === "unknown") {
    return {
      title: `${surfaceLabel} 최신성은 아직 단정할 수 없습니다`,
      message: surface === "ask"
        ? "현재 답변은 마지막 성공 결과를 기준으로 유지합니다. 중요한 판단 전에는 같은 질문을 다시 보내 확인하세요."
        : `${surfaceLabel}는 마지막 확인본을 유지하고 있습니다. 필요하면 새로고침으로 최신 반영 여부를 다시 확인하세요.`,
      className: "border-slate-200 bg-slate-100 text-slate-900",
      showRetry: true,
    };
  }
  if (sync.visibility === "stale") {
    return {
      title: `${surfaceLabel} 데이터가 오래되었을 수 있습니다`,
      message: surface === "calendar"
        ? "기존 일정은 유지하지만 최신 마감일 확인을 위해 캘린더를 다시 불러오는 편이 안전합니다."
        : `${surfaceLabel}는 마지막 성공 데이터를 유지하고 있습니다. 최신 반영이 필요하면 다시 확인을 권장합니다.`,
      className: "border-amber-200 bg-amber-50 text-amber-900",
      showRetry: true,
    };
  }
  return null;
}

export function mapWorkspaceNavigationResponse(response) {
  return {
    sync: response?.sync ?? null,
    activeProjection: response?.activeProjection ?? null,
    sections: Array.isArray(response?.navigation?.sections)
      ? response.navigation.sections.map((section) => ({
          sectionId: section.sectionId,
          label: section.label,
          items: Array.isArray(section.items)
            ? section.items.map((item) => ({
                objectRef: item.objectRef ?? null,
                title: item.objectRef?.title ?? item.title ?? "제목 없음",
                kind: item.kind ?? item.objectRef?.objectKind ?? "document",
                layer: item.layer ?? section.sectionId,
                path: item.path ?? null,
                active: Boolean(item.active),
              }))
            : [],
        }))
      : [],
  };
}

export function getWorkspaceItemIcon(kind) {
  switch (kind) {
    case "report": return FileText;
    case "calendar": return CalIcon;
    case "opportunity": return Briefcase;
    case "document": return FileCode;
    case "ask": return Search;
    default: return Bookmark;
  }
}

export function getWorkspaceItemKindLabel(kind) {
  return WORKSPACE_KIND_LABELS[kind] ?? "항목";
}

export function buildWorkspaceActiveContext({ currentView, currentPath, currentDocumentId, activeOpportunityContext, activeDocumentContext, workspaceNavigation }) {
  const activeNavigationItem = workspaceNavigation.sections
    .flatMap((section) => section.items ?? [])
    .find((item) => item.path === currentPath);

  if (currentView === "ask") {
    if (activeDocumentContext) {
      return {
        kind: "ask",
        projectionLabel: "심층 분석",
        title: activeDocumentContext.title,
        description: activeDocumentContext.layer === "shared"
          ? "shared 문서를 기준으로 Ask 컨텍스트를 유지하며 답변과 근거를 문서 surface에 고정합니다."
          : "personal 문서를 기준으로 Ask 컨텍스트를 유지하며 결과는 읽기 전용으로 보여줍니다.",
        layer: activeDocumentContext.layer ?? null,
      };
    }
    return {
      kind: "ask",
      projectionLabel: "심층 분석",
      title: activeOpportunityContext?.title ?? "워크스페이스 전체 분석",
      description: activeOpportunityContext?.company
        ? `${activeOpportunityContext.company} 공고를 기준으로 Ask 컨텍스트를 유지합니다.`
        : "선택한 공고 없이 현재 워크스페이스 전체를 기준으로 분석합니다.",
      layer: activeOpportunityContext ? "shared" : null,
    };
  }

  if (currentView === "detail") {
    return {
      kind: "opportunity",
      projectionLabel: "공고 상세",
      title: activeOpportunityContext?.title ?? activeNavigationItem?.title ?? "선택한 공고",
      description: activeOpportunityContext?.company
        ? `${activeOpportunityContext.company} 공고 상세를 읽는 중입니다.`
        : "선택한 공고의 상세 projection을 보고 있습니다.",
      layer: activeNavigationItem?.layer ?? "shared",
    };
  }

  if (currentView === "document") {
    return {
      kind: "document",
      projectionLabel: "문서 상세",
      title: activeNavigationItem?.title ?? currentDocumentId ?? "선택한 문서",
      description: activeNavigationItem?.layer === "shared"
        ? "shared 문서를 읽는 중이며 직접 수정은 열리지 않습니다."
        : "personal 문서를 읽는 중이며 이 레이어에서 편집 affordance가 열립니다.",
      layer: activeNavigationItem?.layer ?? null,
    };
  }

  if (activeNavigationItem) {
    return {
      kind: activeNavigationItem.kind,
      projectionLabel: getWorkspaceItemKindLabel(activeNavigationItem.kind),
      title: activeNavigationItem.title,
      description: activeNavigationItem.kind === "calendar"
        ? "시간축 기준으로 현재 지원 일정을 탐색합니다."
        : "워크스페이스 메인 shell에서 현재 projection을 보고 있습니다.",
      layer: activeNavigationItem.layer,
    };
  }

  return {
    kind: "report",
    projectionLabel: "리포트",
    title: "기본 리포트",
    description: "워크스페이스 메인 shell에서 기본 리포트를 보고 있습니다.",
    layer: "shared",
  };
}

export function normalizeOpportunityContext(job) {
  if (!job) return null;
  const opportunityId = job.opportunityId ?? job.id ?? null;
  if (!opportunityId) return null;
  return {
    id: opportunityId,
    opportunityId,
    title: job.title ?? job.surface?.title ?? "공고 상세",
    company: job.company ?? job.companyName ?? job.surface?.companyName ?? job.decoration?.companyName ?? "회사 정보 준비 중",
    summary: job.summary ?? job.surface?.summary ?? "",
    location: job.location ?? job.qualification?.locationText ?? null,
    deadline: job.deadline ?? formatKoreanDate(job.closesAt) ?? null,
    urgency: job.urgency ?? job.urgencyLabel ?? job.decoration?.urgencyLabel ?? getFallbackUrgencyLabel(job.closesAt),
    status: job.status ?? job.metadata?.status ?? null,
    roleLabels: job.roleLabels ?? job.surface?.roleLabels ?? [],
    matchScore: job.matchScore ?? job.analysis?.fitScore ?? null,
    matchReason: job.matchReason ?? job.whyMatched ?? job.analysis?.strengthsSummary ?? null,
    gap: job.gap ?? job.analysis?.riskSummary ?? null,
    companyContext: job.companyContext ?? (job.companySummary || job.company?.summary || job.company?.mainBusiness
      ? { description: job.companySummary ?? job.company?.summary ?? null, whyRelevant: job.company?.mainBusiness ?? null }
      : null),
    requirements: job.requirements ?? splitBlockText(job.qualification?.requirementsText),
    qualification: job.qualification ?? null,
    sourceUrl: job.sourceUrl ?? job.metadata?.source?.sourceUrl ?? null,
    employmentType: job.employmentType ?? job.metadata?.employmentType ?? null,
  };
}

export function normalizeDocumentContext(document) {
  if (!document) return null;
  const documentId = document.documentId ?? document.id ?? document.objectRef?.objectId ?? null;
  if (!documentId) return null;
  return {
    documentId,
    title: document.title ?? document.documentRef?.title ?? document.objectRef?.title ?? "문서",
    layer: document.layer ?? null,
    writable: document.writable ?? false,
    summary: document.summary ?? document.excerpt ?? null,
  };
}

export function formatDocumentLayerLabel(layer) {
  return DOCUMENT_LAYER_LABELS[layer] ?? layer ?? "document";
}

export function isSharedLayer(layer) {
  return layer === "shared";
}

export function formatWritableAffordanceLabel({ layer, writable }) {
  if (isSharedLayer(layer) || writable === false) return "read-only";
  return "personal writable";
}

export function getWritableBadgeClassName({ layer, writable }) {
  if (isSharedLayer(layer) || writable === false) return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function buildLayerBoundaryCopy({ layer, writable }) {
  if (isSharedLayer(layer) || writable === false) {
    return "shared reference 문서입니다. 이 화면에서는 상위 authority를 수정하지 않으며, 읽기 전용 boundary만 보여줍니다.";
  }
  if (layer === "personal_raw") {
    return "personal/raw 작업 문서입니다. 수정/삭제 authority는 이 personal 레이어에만 한정되며 shared를 바꾸는 의미가 아닙니다.";
  }
  if (layer === "personal_wiki") {
    return "personal/wiki 문서입니다. 이 레이어의 편집 가능 경계만 보여주며, shared interpretation이 갱신된 것처럼 표시하지 않습니다.";
  }
  return "현재 문서의 writable boundary를 이 레이어 기준으로만 표시합니다.";
}

export function getDocumentLayerBadgeClassName(layer) {
  if (layer === "shared") return "border-slate-200 bg-slate-100 text-slate-700";
  if (layer === "personal_wiki") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function mapDocumentResponse(response) {
  const item = response?.item ?? {};
  return {
    documentId: item.documentRef?.objectId ?? null,
    title: item.documentRef?.title ?? item.surface?.title ?? "문서",
    layer: item.layer ?? "shared",
    writable: Boolean(item.writable),
    bodyMarkdown: item.surface?.bodyMarkdown ?? "",
    summary: item.surface?.summary ?? null,
    metadata: item.metadata ?? null,
    version: item.metadata?.version ?? null,
    assetRefs: Array.isArray(item.metadata?.assetRefs) ? item.metadata.assetRefs : [],
    status: item.metadata?.status ?? null,
    generation: item.metadata?.generation ?? null,
    relatedObjects: Array.isArray(item.relatedObjects) ? item.relatedObjects : [],
  };
}

export function mapSummaryOpportunity(item) {
  return normalizeOpportunityContext({
    opportunityId: item.opportunityRef?.opportunityId,
    title: item.surface?.title,
    company: item.surface?.companyName,
    summary: item.surface?.summary,
    closesAt: item.metadata?.closesAt,
    urgencyLabel: item.decoration?.urgencyLabel ?? getFallbackUrgencyLabel(item.metadata?.closesAt),
    whyMatched: item.decoration?.whyMatched,
    employmentType: item.metadata?.employmentType,
    status: item.metadata?.status,
    roleLabels: item.surface?.roleLabels ?? [],
  });
}

export function mapDetailOpportunity(response) {
  const item = response?.item ?? null;
  return normalizeOpportunityContext({
    opportunityId: item?.opportunityRef?.opportunityId ?? null,
    title: item?.surface?.title ?? "공고 정보를 불러오지 못했습니다.",
    company: item?.company?.name ?? "회사 정보 준비 중",
    summary: item?.surface?.summary ?? null,
    descriptionMarkdown: item?.surface?.descriptionMarkdown ?? null,
    qualification: item?.qualification ?? null,
    analysis: item?.analysis ?? null,
    companySummary: item?.company?.summary ?? null,
    companyContext: {
      description: item?.company?.summary ?? null,
      whyRelevant: item?.company?.mainBusiness ?? null,
    },
    requirements: splitBlockText(item?.qualification?.requirementsText),
    closesAt: item?.metadata?.closesAt ?? null,
    urgencyLabel: getFallbackUrgencyLabel(item?.metadata?.closesAt),
    employmentType: item?.metadata?.employmentType ?? null,
    sourceUrl: item?.metadata?.source?.sourceUrl ?? null,
  });
}

export function mapCalendarItem(item) {
  return {
    calendarItemId: item.calendarItemId,
    opportunityId: item.objectRef?.opportunityId ?? null,
    title: item.objectRef?.title ?? item.label,
    company: item.decoration?.companyName ?? "회사 정보 준비 중",
    startsAt: item.startsAt,
    urgencyLabel: item.decoration?.urgencyLabel ?? getFallbackUrgencyLabel(item.startsAt),
    deepLinkEnabled: Boolean(item.objectRef?.opportunityId),
  };
}

export function mapAskEvidenceItem(item) {
  return {
    evidenceId: item.evidenceId,
    kind: item.kind ?? "fact",
    label: item.label ?? "근거 자료",
    excerpt: item.excerpt ?? item.label ?? "",
    documentTitle: item.documentRef?.title ?? null,
    provenance: item.provenance?.sourceVersion ?? null,
  };
}

export function mapAskRelatedDocument(item) {
  return normalizeDocumentContext({
    documentId: item.documentRef?.objectId ?? null,
    title: item.documentRef?.title ?? "문서",
    layer: item.role ?? null,
    excerpt: item.excerpt ?? null,
  });
}

export function mapAskActiveContext(activeContext) {
  if (!activeContext?.contextType) return null;
  if (activeContext.contextType === "document") {
    return {
      contextType: "document",
      ...normalizeDocumentContext({
        documentId: activeContext.documentRef?.objectId ?? null,
        title: activeContext.documentRef?.title ?? activeContext.title,
        layer: activeContext.layer ?? null,
      }),
    };
  }
  if (activeContext.contextType === "opportunity") {
    return {
      contextType: "opportunity",
      ...normalizeOpportunityContext({
        opportunityId: activeContext.opportunityRef?.opportunityId ?? null,
        title: activeContext.opportunityRef?.title ?? activeContext.title,
      }),
    };
  }
  return { contextType: "workspace", title: activeContext.title ?? "워크스페이스 전체 분석" };
}

export function mapAskResponse(response) {
  return {
    answerText: response.answer?.markdown ?? "",
    answerId: response.answer?.answerId ?? null,
    generatedAt: response.answer?.generatedAt ?? null,
    sync: response.sync ?? null,
    activeContext: mapAskActiveContext(response.activeContext),
    evidence: (response.evidence ?? []).map(mapAskEvidenceItem),
    relatedOpportunities: (response.relatedOpportunities ?? []).map(mapSummaryOpportunity),
    relatedDocuments: (response.relatedDocuments ?? []).map(mapAskRelatedDocument),
  };
}

export function createRouteOpportunityContext(opportunityId) {
  return normalizeOpportunityContext({ opportunityId });
}

export function createRouteDocumentContext(documentId) {
  return normalizeDocumentContext({ documentId });
}

export function buildHeroHeadline(summary) {
  const opportunityCount = summary.recommendedOpportunities.length;
  const strengtheningCount = summary.skillsGap?.recommendedToStrengthen?.length ?? 0;
  return {
    opportunityCount,
    strengtheningCount,
    text: opportunityCount > 0
      ? `현재 역량 기준, 최우선으로 검토해야 할 추천 공고 ${opportunityCount}건과 보완이 필요한 핵심 스킬 ${strengtheningCount}가지를 확인했습니다.`
      : "현재 조건과 직접 맞는 추천 공고는 아직 없지만, 프로필 기준과 다음 액션은 정리되어 있습니다.",
  };
}

export function getMonthStart(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function shiftMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
