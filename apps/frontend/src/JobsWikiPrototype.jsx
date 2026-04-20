import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  Bookmark,
  Briefcase,
  Calendar as CalIcon,
  Check,
  CheckCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  FileCode,
  FileQuestion,
  FileText,
  GitMerge,
  Grid,
  Lightbulb,
  List,
  Loader2,
  MapPin,
  MessageSquare,
  MoveRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  Zap,
  Database,
} from "lucide-react";
import {
  attachWikiLinks,
  askWorkspace,
  createDocument,
  deleteDocument,
  generateWikiDocument,
  getCalendar,
  getDocumentDetail,
  getOpportunityDetail,
  getWorkspace,
  getWorkspaceSync,
  getWorkspaceSummary,
  registerPersonalAsset,
  suggestWikiLinks,
  triggerWorknetIngestion,
  updateDocument,
  WasClientError,
} from "./was-client";

const ONBOARDING_PROFILE_FIXTURE = {
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

const EMPTY_PROFILE_SNAPSHOT = {
  targetRole: "프로필 기준 로딩 중",
  experience: "기본 리포트 기준을 확인하는 중입니다",
  location: null,
  domain: null,
  skills: [],
};

const SYNC_VISIBILITY_META = {
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

const COMMAND_STATUS_META = {
  accepted: {
    label: "접수됨",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  validating: {
    label: "검증 중",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  queued: {
    label: "대기 중",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  running: {
    label: "실행 중",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  succeeded: {
    label: "완료",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  failed: {
    label: "실패",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  cancelled: {
    label: "취소됨",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

const COMMAND_OUTCOME_META = {
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

const SYNC_PROJECTION_LABELS = {
  workspace: "워크스페이스",
  workspace_summary: "기본 리포트",
  opportunity_list: "추천 공고",
  opportunity_detail: "공고 상세",
  calendar: "지원 일정",
  ask: "심층 분석",
};

const WORKSPACE_LAYER_META = {
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

const WORKSPACE_KIND_LABELS = {
  report: "리포트",
  calendar: "캘린더",
  opportunity: "공고",
  document: "문서",
  ask: "분석",
};

const DOCUMENT_LAYER_LABELS = {
  shared: "shared",
  personal_raw: "personal/raw",
  personal_wiki: "personal/wiki",
};

const DEFAULT_INGESTION_SOURCE_ID = "worknet.recruiting";

const SURFACE_SYNC_LABELS = {
  workspace: "워크스페이스",
  report: "리포트",
  detail: "공고 상세",
  document: "문서",
  ask: "심층 분석",
  calendar: "지원 일정",
};

const SURFACE_RETRY_LABELS = {
  workspace: "워크스페이스 상태 다시 확인",
  report: "리포트 새로고침",
  detail: "공고 다시 확인",
  document: "문서 다시 확인",
  ask: "같은 질문 다시 분석",
  calendar: "캘린더 새로고침",
};

function formatKoreanDate(value, options = {}) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: options.withYear === false ? undefined : "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

function formatMonthDay(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatKoreanDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function trimOptionalQueryParam(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function readAppRoute(location = window.location) {
  const normalizedPathname =
    location.pathname.replace(/\/+$/, "") || "/";
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
    return {
      view: "document",
      opportunityId: null,
      documentId: decodeURIComponent(documentMatch[1]),
    };
  }

  const opportunityMatch = normalizedPathname.match(
    /^\/opportunities\/([^/]+)$/,
  );

  if (opportunityMatch) {
    return {
      view: "detail",
      opportunityId: decodeURIComponent(opportunityMatch[1]),
      documentId: null,
    };
  }

  return { view: "onboarding", opportunityId: null, documentId: null };
}

function buildAppPath(view, opportunityId = null, documentId = null) {
  switch (view) {
    case "onboarding":
      return "/onboarding";
    case "extraction":
      return "/review";
    case "workspace":
      return "/workspace";
    case "report":
      return "/report";
    case "detail":
      return opportunityId
        ? `/opportunities/${encodeURIComponent(opportunityId)}`
        : "/workspace";
    case "document":
      return documentId
        ? `/documents/${encodeURIComponent(documentId)}`
        : "/workspace";
    case "ask": {
      const searchParams = new URLSearchParams();

      if (documentId) {
        searchParams.set("documentId", documentId);
      } else if (opportunityId) {
        searchParams.set("opportunityId", opportunityId);
      }

      const search = searchParams.toString();
      return `/ask${search ? `?${search}` : ""}`;
    }
    case "calendar":
      return "/calendar";
    default:
      return "/onboarding";
  }
}

function writeAppRoute(route, { replace = false } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = buildAppPath(
    route.view,
    route.opportunityId,
    route.documentId,
  );
  const currentUrl = `${window.location.pathname}${window.location.search}`;

  if (currentUrl === nextUrl) {
    return;
  }

  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", nextUrl);
}

function formatEmploymentType(value) {
  const dictionary = {
    full_time: "정규직",
    contract: "계약직",
    internship: "인턴십",
    part_time: "파트타임",
  };

  return dictionary[value] ?? value ?? "고용 형태 미정";
}

function formatStatusLabel(value) {
  const dictionary = {
    open: "모집 중",
    closing_soon: "마감 임박",
    closed: "마감",
    unknown: "상태 미정",
  };

  return dictionary[value] ?? "상태 미정";
}

function getStatusBadgeClassName(status) {
  if (status === "closing_soon") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "open") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getFallbackUrgencyLabel(value) {
  if (!value) {
    return null;
  }

  const target = new Date(value);
  const now = new Date();

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return "마감 지남";
  }

  return `D-${diff}`;
}

function normalizeProfileSnapshot(profileSnapshot) {
  return {
    ...EMPTY_PROFILE_SNAPSHOT,
    ...(profileSnapshot ?? {}),
    skills: Array.isArray(profileSnapshot?.skills)
      ? profileSnapshot.skills
      : EMPTY_PROFILE_SNAPSHOT.skills,
  };
}

function splitBlockText(value) {
  if (!value) {
    return [];
  }

  return value
    .split(/\n|•|,|->/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSyncMeta(sync) {
  if (!sync?.visibility) {
    return null;
  }

  return SYNC_VISIBILITY_META[sync.visibility] ?? null;
}

function getCommandStatusMeta(status) {
  if (!status) {
    return null;
  }

  return COMMAND_STATUS_META[status] ?? null;
}

function getCommandOutcomeMeta(outcome) {
  if (!outcome) {
    return null;
  }

  return COMMAND_OUTCOME_META[outcome] ?? null;
}

function isTerminalCommandStatus(status) {
  return status === "succeeded" || status === "failed" || status === "cancelled";
}

function formatProjectionLabel(projection) {
  return SYNC_PROJECTION_LABELS[projection] ?? projection ?? "알 수 없는 projection";
}

function normalizeStringList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value, index) => {
    return typeof value === "string" && values.indexOf(value) === index;
  });
}

function mapProjectionStates(projections) {
  if (!Array.isArray(projections)) {
    return [];
  }

  return projections
    .filter(
      (projection) =>
        typeof projection?.projection === "string" &&
        typeof projection?.visibility === "string",
    )
    .map((projection) => ({
      projection: projection.projection,
      visibility: projection.visibility,
      lastKnownVersion: projection.lastKnownVersion ?? projection.version ?? null,
      lastVisibleAt: projection.lastVisibleAt ?? projection.visibleAt ?? null,
      refreshRecommended:
        projection.refreshRecommended ??
        (projection.visibility === "partial" || projection.visibility === "stale"),
    }));
}

function mapWorkspaceCommand(command) {
  if (!command?.commandId) {
    return null;
  }

  return {
    commandId: command.commandId,
    status: command.status ?? null,
    outcome: command.outcome ?? null,
    acceptedAt: command.acceptedAt ?? null,
    finishedAt: command.finishedAt ?? null,
    affectedObjectRefs: normalizeStringList(command.affectedObjectRefs),
    affectedRelationRefs: normalizeStringList(command.affectedRelationRefs),
    refreshScopes: normalizeStringList(command.refreshScopes),
    error: command.error
      ? {
          code: command.error.code ?? "unknown_failure",
          message: command.error.message ?? "명령 상태를 해석하지 못했습니다.",
          retryable: Boolean(command.error.retryable),
        }
      : null,
  };
}

function mapWorkspaceSyncResponse(response) {
  return {
    command: mapWorkspaceCommand(response?.command),
    projections: mapProjectionStates(response?.projections),
  };
}

function mapAcceptedWorkspaceCommandResponse(response) {
  return {
    command: mapWorkspaceCommand(response),
    projections: mapProjectionStates(response?.projectionStates),
  };
}

function createCommandAttemptKey(sourceId) {
  const commandIdSuffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

  return `jobs-wiki-${sourceId}-${commandIdSuffix}`;
}

function getCommandGuidance(command) {
  if (!command) {
    return null;
  }

  if (command.error?.message) {
    return {
      title: command.error.retryable
        ? "명령 실행이 일시적으로 실패했습니다"
        : "명령 실행에 실패했습니다",
      message: command.error.retryable
        ? `${command.error.message} 같은 패널에서 다시 요청할 수 있습니다.`
        : command.error.message,
      className: command.error.retryable
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900",
    };
  }

  const outcomeMeta = getCommandOutcomeMeta(command.outcome);

  if (outcomeMeta) {
    return outcomeMeta;
  }

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

function formatSurfaceLabel(surface) {
  return SURFACE_SYNC_LABELS[surface] ?? "현재 화면";
}

function getSurfaceRetryLabel(surface, sync, refreshError) {
  if (surface === "ask" && refreshError) {
    return "같은 질문 다시 분석";
  }

  if (sync?.visibility === "pending") {
    return `${formatSurfaceLabel(surface)} 상태 다시 확인`;
  }

  return SURFACE_RETRY_LABELS[surface] ?? "다시 시도";
}

function getSurfaceSyncGuidance(surface, sync) {
  if (!sync?.visibility) {
    return null;
  }

  const surfaceLabel = formatSurfaceLabel(surface);

  if (sync.visibility === "pending") {
    return {
      title: `${surfaceLabel}는 갱신 중입니다`,
      message:
        surface === "ask"
          ? "마지막 답변을 유지한 채 새 근거와 문맥을 다시 확인합니다."
          : `${surfaceLabel} 화면은 마지막 확인 데이터를 유지하고 있으며, 새 데이터가 준비되면 반영됩니다.`,
      className: "border-sky-200 bg-sky-50 text-sky-900",
      showRetry: true,
    };
  }

  if (sync.visibility === "partial") {
    return {
      title: `${surfaceLabel} 일부만 최신 상태입니다`,
      message:
        surface === "report"
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
      message:
        surface === "ask"
          ? "현재 답변은 마지막 성공 결과를 기준으로 유지합니다. 중요한 판단 전에는 같은 질문을 다시 보내 확인하세요."
          : `${surfaceLabel}는 마지막 확인본을 유지하고 있습니다. 필요하면 새로고침으로 최신 반영 여부를 다시 확인하세요.`,
      className: "border-slate-200 bg-slate-100 text-slate-900",
      showRetry: true,
    };
  }

  if (sync.visibility === "stale") {
    return {
      title: `${surfaceLabel} 데이터가 오래되었을 수 있습니다`,
      message:
        surface === "calendar"
          ? "기존 일정은 유지하지만 최신 마감일 확인을 위해 캘린더를 다시 불러오는 편이 안전합니다."
          : `${surfaceLabel}는 마지막 성공 데이터를 유지하고 있습니다. 최신 반영이 필요하면 다시 확인을 권장합니다.`,
      className: "border-amber-200 bg-amber-50 text-amber-900",
      showRetry: true,
    };
  }

  return null;
}

function mapWorkspaceNavigationResponse(response) {
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
                title:
                  item.objectRef?.title ??
                  item.title ??
                  "제목 없음",
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

function getWorkspaceItemIcon(kind) {
  switch (kind) {
    case "report":
      return FileText;
    case "calendar":
      return CalIcon;
    case "opportunity":
      return Briefcase;
    case "document":
      return FileCode;
    case "ask":
      return Search;
    default:
      return Bookmark;
  }
}

function getWorkspaceItemKindLabel(kind) {
  return WORKSPACE_KIND_LABELS[kind] ?? "항목";
}

function buildWorkspaceActiveContext({
  currentView,
  currentPath,
  currentDocumentId,
  activeOpportunityContext,
  activeDocumentContext,
  workspaceNavigation,
}) {
  const activeNavigationItem = workspaceNavigation.sections
    .flatMap((section) => section.items ?? [])
    .find((item) => item.path === currentPath)

  if (currentView === "ask") {
    if (activeDocumentContext) {
      return {
        kind: "ask",
        projectionLabel: "심층 분석",
        title: activeDocumentContext.title,
        description:
          activeDocumentContext.layer === "shared"
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
      title:
        activeOpportunityContext?.title ??
        activeNavigationItem?.title ??
        "선택한 공고",
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
      title:
        activeNavigationItem?.title ??
        currentDocumentId ??
        "선택한 문서",
      description:
        activeNavigationItem?.layer === "shared"
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
      description:
        activeNavigationItem.kind === "calendar"
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

function normalizeOpportunityContext(job) {
  if (!job) {
    return null;
  }

  const opportunityId = job.opportunityId ?? job.id ?? null;

  if (!opportunityId) {
    return null;
  }

  return {
    id: opportunityId,
    opportunityId,
    title: job.title ?? job.surface?.title ?? "공고 상세",
    company:
      job.company ??
      job.companyName ??
      job.surface?.companyName ??
      job.decoration?.companyName ??
      "회사 정보 준비 중",
    summary: job.summary ?? job.surface?.summary ?? "",
    location: job.location ?? job.qualification?.locationText ?? null,
    deadline: job.deadline ?? formatKoreanDate(job.closesAt) ?? null,
    urgency:
      job.urgency ??
      job.urgencyLabel ??
      job.decoration?.urgencyLabel ??
      getFallbackUrgencyLabel(job.closesAt),
    status: job.status ?? job.metadata?.status ?? null,
    roleLabels: job.roleLabels ?? job.surface?.roleLabels ?? [],
    matchScore: job.matchScore ?? job.analysis?.fitScore ?? null,
    matchReason:
      job.matchReason ??
      job.whyMatched ??
      job.analysis?.strengthsSummary ??
      null,
    gap: job.gap ?? job.analysis?.riskSummary ?? null,
    companyContext:
      job.companyContext ??
      (job.companySummary || job.company?.summary || job.company?.mainBusiness
        ? {
            description: job.companySummary ?? job.company?.summary ?? null,
            whyRelevant: job.company?.mainBusiness ?? null,
          }
        : null),
    requirements:
      job.requirements ??
      splitBlockText(job.qualification?.requirementsText),
    qualification: job.qualification ?? null,
    sourceUrl: job.sourceUrl ?? job.metadata?.source?.sourceUrl ?? null,
    employmentType:
      job.employmentType ?? job.metadata?.employmentType ?? null,
  };
}

function normalizeDocumentContext(document) {
  if (!document) {
    return null;
  }

  const documentId =
    document.documentId ??
    document.id ??
    document.objectRef?.objectId ??
    null;

  if (!documentId) {
    return null;
  }

  return {
    documentId,
    title:
      document.title ??
      document.documentRef?.title ??
      document.objectRef?.title ??
      "문서",
    layer: document.layer ?? null,
    writable: document.writable ?? false,
    summary: document.summary ?? document.excerpt ?? null,
  };
}

function formatDocumentLayerLabel(layer) {
  return DOCUMENT_LAYER_LABELS[layer] ?? layer ?? "document";
}

function isSharedLayer(layer) {
  return layer === "shared";
}

function formatWritableAffordanceLabel({ layer, writable }) {
  if (isSharedLayer(layer) || writable === false) {
    return "read-only";
  }

  return "personal writable";
}

function getWritableBadgeClassName({ layer, writable }) {
  if (isSharedLayer(layer) || writable === false) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function buildLayerBoundaryCopy({ layer, writable }) {
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

function getDocumentLayerBadgeClassName(layer) {
  if (layer === "shared") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (layer === "personal_wiki") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function mapDocumentResponse(response) {
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
    relatedObjects: Array.isArray(item.relatedObjects) ? item.relatedObjects : [],
  };
}

function mapSummaryOpportunity(item) {
  return normalizeOpportunityContext({
    opportunityId: item.opportunityRef?.opportunityId,
    title: item.surface?.title,
    company: item.surface?.companyName,
    summary: item.surface?.summary,
    closesAt: item.metadata?.closesAt,
    urgencyLabel:
      item.decoration?.urgencyLabel ??
      getFallbackUrgencyLabel(item.metadata?.closesAt),
    whyMatched: item.decoration?.whyMatched,
    employmentType: item.metadata?.employmentType,
    status: item.metadata?.status,
    roleLabels: item.surface?.roleLabels ?? [],
  });
}

function mapDetailOpportunity(response) {
  const item = response.item;

  return normalizeOpportunityContext({
    opportunityId: item.opportunityRef?.opportunityId,
    title: item.surface?.title,
    company: item.company?.name,
    summary: item.surface?.summary,
    descriptionMarkdown: item.surface?.descriptionMarkdown,
    qualification: item.qualification,
    analysis: item.analysis,
    companySummary: item.company?.summary,
    companyContext: {
      description: item.company?.summary,
      whyRelevant: item.company?.mainBusiness,
    },
    requirements: splitBlockText(item.qualification?.requirementsText),
    closesAt: item.metadata?.closesAt,
    urgencyLabel: getFallbackUrgencyLabel(item.metadata?.closesAt),
    employmentType: item.metadata?.employmentType,
    sourceUrl: item.metadata?.source?.sourceUrl,
  });
}

function mapCalendarItem(item) {
  return {
    calendarItemId: item.calendarItemId,
    opportunityId: item.objectRef?.opportunityId ?? null,
    title: item.objectRef?.title ?? item.label,
    company: item.decoration?.companyName ?? "회사 정보 준비 중",
    startsAt: item.startsAt,
    urgencyLabel:
      item.decoration?.urgencyLabel ?? getFallbackUrgencyLabel(item.startsAt),
    deepLinkEnabled: Boolean(item.objectRef?.opportunityId),
  };
}

function mapAskEvidenceItem(item) {
  return {
    evidenceId: item.evidenceId,
    kind: item.kind ?? "fact",
    label: item.label ?? "근거 자료",
    excerpt: item.excerpt ?? item.label ?? "",
    documentTitle: item.documentRef?.title ?? null,
    provenance: item.provenance?.sourceVersion ?? null,
  };
}

function mapAskRelatedDocument(item) {
  return normalizeDocumentContext({
    documentId: item.documentRef?.objectId ?? null,
    title: item.documentRef?.title ?? "문서",
    layer: item.role ?? null,
    excerpt: item.excerpt ?? null,
  });
}

function mapAskActiveContext(activeContext) {
  if (!activeContext?.contextType) {
    return null;
  }

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

  return {
    contextType: "workspace",
    title: activeContext.title ?? "워크스페이스 전체 분석",
  };
}

function mapAskResponse(response) {
  return {
    answerText: response.answer?.markdown ?? "",
    answerId: response.answer?.answerId ?? null,
    generatedAt: response.answer?.generatedAt ?? null,
    sync: response.sync ?? null,
    activeContext: mapAskActiveContext(response.activeContext),
    evidence: (response.evidence ?? []).map(mapAskEvidenceItem),
    relatedOpportunities: (response.relatedOpportunities ?? []).map(
      mapSummaryOpportunity,
    ),
    relatedDocuments: (response.relatedDocuments ?? []).map(
      mapAskRelatedDocument,
    ),
  };
}

function createRouteOpportunityContext(opportunityId) {
  return normalizeOpportunityContext({ opportunityId });
}

function createRouteDocumentContext(documentId) {
  return normalizeDocumentContext({ documentId });
}

function buildHeroHeadline(summary) {
  const opportunityCount = summary.recommendedOpportunities.length;
  const strengtheningCount =
    summary.skillsGap?.recommendedToStrengthen?.length ?? 0;

  return {
    opportunityCount,
    strengtheningCount,
    text:
      opportunityCount > 0
        ? `현재 역량 기준, 최우선으로 검토해야 할 추천 공고 ${opportunityCount}건과 보완이 필요한 핵심 스킬 ${strengtheningCount}가지를 확인했습니다.`
        : "현재 조건과 직접 맞는 추천 공고는 아직 없지만, 프로필 기준과 다음 액션은 정리되어 있습니다.",
  };
}

const Label = ({ children, className = "" }) => (
  <div
    className={`mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 ${className}`}
  >
    {children}
  </div>
);

const MetaTag = ({ icon: Icon, children }) => (
  <span className="mr-5 inline-flex items-center text-sm font-medium text-slate-600">
    <Icon size={15} className="mr-2 text-slate-400" />
    {children}
  </span>
);

const Panel = ({ children, className = "", noPadding = false }) => (
  <div
    className={`rounded-sm border border-slate-200 bg-white shadow-sm ${
      noPadding ? "" : "p-6"
    } ${className}`}
  >
    {children}
  </div>
);

function renderInlineBold(text, keyPrefix) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function StructuredResponse({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-4 text-base leading-loose text-slate-800">
      {lines.map((line, index) => {
        if (!line.trim()) {
          return <div key={`sp-${index}`} className="h-2" />;
        }
        if (line.startsWith("### ")) {
          return (
            <h3
              key={`h3-${index}`}
              className="border-b border-slate-100 pb-2 pt-4 text-xl font-bold text-slate-900"
            >
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <div key={`ol-${index}`} className="ml-4 font-bold text-slate-900">
              {renderInlineBold(line, `ol-${index}`)}
            </div>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={`li-${index}`} className="ml-4 font-medium text-slate-700">
              {renderInlineBold(line.replace("- ", ""), `li-${index}`)}
            </div>
          );
        }
        return (
          <p key={`p-${index}`} className="font-medium text-slate-700">
            {renderInlineBold(line, `p-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

const OnboardingView = ({ onNext }) => {
  const [fileUploaded, setFileUploaded] = useState(false);

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-16 md:grid-cols-2">
      <div className="flex flex-col justify-center">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-sm bg-slate-900 text-white shadow-sm">
          <Database size={24} strokeWidth={1.5} />
        </div>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-slate-900">
          커리어 프로필 등록 및
          <br />
          분석 시작
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-600">
          입력하신 정보와 이력서를 바탕으로 최신 채용 공고와 시장 동향을
          교차 분석하여, 가장 적합한 방향성을 제시하는 개인화 리포트를
          생성합니다.
        </p>

        <div className="space-y-5 border-l-2 border-slate-200 pl-5">
          {[
            "이력서 파싱 및 핵심 역량 구조화",
            "적합 포지션 매칭 및 추천 근거 분석",
            "맞춤형 지원 전략 및 액션 플랜 도출",
          ].map((item) => (
            <div key={item} className="flex items-start">
              <CheckCircle
                size={18}
                className="mr-3 mt-0.5 flex-shrink-0 text-slate-400"
              />
              <span className="text-sm font-medium text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center rounded-sm border border-slate-200 bg-white p-10 shadow-sm">
        <div className="space-y-8">
          <div>
            <Label>이력서 / 포트폴리오 업로드</Label>
            {!fileUploaded ? (
              <button
                type="button"
                onClick={() => setFileUploaded(true)}
                className="group w-full rounded-sm border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:bg-slate-100"
              >
                <UploadCloud className="mx-auto mb-3 h-7 w-7 text-slate-400 transition-colors group-hover:text-slate-700" />
                <p className="mb-1 text-sm font-bold text-slate-800">
                  파일을 여기로 드래그하거나 클릭하여 첨부하세요
                </p>
                <p className="text-xs font-medium text-slate-500">
                  PDF, Markdown, TXT 지원 (최대 10MB)
                </p>
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-sm border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
                <div className="flex items-center">
                  <FileText size={20} className="mr-3 text-indigo-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Resume_v2_Backend.pdf
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      2.4 MB • 정상적으로 첨부됨
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFileUploaded(false)}
                  className="text-xs font-bold text-slate-500 underline underline-offset-2 hover:text-slate-900"
                >
                  변경
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            <div>
              <Label>목표 직무</Label>
              <input
                type="text"
                defaultValue="Backend Engineer"
                className="w-full border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
              />
            </div>
            <div>
              <Label>경력 수준</Label>
              <select className="w-full cursor-pointer border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-900">
                <option>신입 / 인턴십</option>
                <option>주니어 (1-3년)</option>
                <option>미들 (4-6년)</option>
                <option>시니어 (7년 이상)</option>
              </select>
            </div>
            <div>
              <Label>최종 학력</Label>
              <input
                type="text"
                defaultValue="컴퓨터공학과 학사"
                className="w-full border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
              />
            </div>
            <div>
              <Label>선호 지역</Label>
              <input
                type="text"
                defaultValue="서울/판교"
                className="w-full border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
              />
            </div>
            <div className="col-span-2">
              <Label>관심 산업 / 도메인</Label>
              <input
                type="text"
                defaultValue="금융, 플랫폼"
                className="w-full border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
              />
            </div>
            <div className="col-span-2">
              <Label>추가 목표 / 고려 사항</Label>
              <textarea
                rows={3}
                defaultValue="대규모 트래픽 처리 경험을 빠르게 쌓을 수 있는 백엔드 직무를 우선 검토하고 싶습니다."
                className="w-full rounded-sm border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="flex w-full items-center justify-center rounded-sm bg-slate-900 py-4 text-sm font-bold tracking-wide text-white shadow-md transition-colors hover:bg-slate-800"
          >
            프로필 분석 및 리포트 생성하기
            <MoveRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ExtractionReviewView = ({ onNext }) => (
  <div className="mx-auto w-full max-w-3xl">
    <div className="mb-10">
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
        추출된 정보 검토
      </h1>
      <p className="text-lg text-slate-600">
        업로드하신 문서와 입력 정보에서 성공적으로 핵심 역량을 도출했습니다.
        이 데이터를 기반으로 맞춤형 리포트가 생성됩니다.
      </p>
    </div>

    <div className="mb-10 rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-5">
        <div className="flex items-center text-sm font-bold text-slate-800">
          <Database size={16} className="mr-2 text-slate-500" />
          도출된 프로필 데이터 요약
        </div>
        <div className="rounded-sm border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
          분석 신뢰도: 매우 높음
        </div>
      </div>

      <div className="space-y-8 p-8">
        <div className="grid grid-cols-4 items-center gap-4 border-b border-slate-100 pb-6">
          <div className="col-span-1">
            <Label className="mb-0">목표 직무</Label>
          </div>
          <div className="col-span-2 text-lg font-bold text-slate-900">
            {ONBOARDING_PROFILE_FIXTURE.targetRole}
          </div>
          <div className="col-span-1 text-right">
            <button className="flex w-full items-center justify-end text-sm font-bold text-slate-500 hover:text-slate-900">
              <SlidersHorizontal size={14} className="mr-1.5" />
              수정
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4 border-b border-slate-100 pb-6">
          <div className="col-span-1">
            <Label className="mb-0">경력 수준</Label>
          </div>
          <div className="col-span-3 text-base font-bold text-slate-800">
            {ONBOARDING_PROFILE_FIXTURE.experience}
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4 border-b border-slate-100 pb-6">
          <div className="col-span-1">
            <Label className="mb-0 mt-1">식별된 보유 기술</Label>
          </div>
          <div className="col-span-3 flex flex-wrap gap-2">
            {ONBOARDING_PROFILE_FIXTURE.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-sm border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800 shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4">
          <div className="col-span-1">
            <Label className="mb-0 mt-1">도출된 핵심 강점</Label>
          </div>
          <div className="col-span-3 space-y-3">
            {ONBOARDING_PROFILE_FIXTURE.strengths.map((strength) => (
              <div
                key={strength}
                className="flex items-start text-base font-bold text-slate-800"
              >
                <CheckCircle
                  size={18}
                  className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600"
                />
                {strength}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="flex justify-end space-x-4">
      <button className="rounded-sm border border-slate-300 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
        프로필 내용 수정
      </button>
      <button
        onClick={onNext}
        className="flex items-center rounded-sm bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
      >
        확인 완료 및 워크스페이스 열기
        <MoveRight size={16} className="ml-2.5" />
      </button>
    </div>
  </div>
);

const InlineNotice = ({ title, message, className = "" }) => (
  <div className={`rounded-sm border px-4 py-3 shadow-sm ${className}`}>
    <div className="text-sm font-bold">{title}</div>
    {message ? <p className="mt-1 text-sm leading-relaxed">{message}</p> : null}
  </div>
);

const RetryPanel = ({
  title,
  message,
  onRetry,
  retryLabel = "다시 시도",
  secondaryAction,
}) => (
  <div className="mx-auto max-w-3xl rounded-sm border border-slate-200 bg-white p-8 shadow-sm">
    <div className="mb-4 flex items-center text-amber-700">
      <AlertCircle size={20} className="mr-3" />
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
    </div>
    <p className="mb-6 text-sm leading-relaxed text-slate-600">{message}</p>
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onRetry}
        className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm"
      >
        {retryLabel}
      </button>
      {secondaryAction}
    </div>
  </div>
);

const SyncNotice = ({
  surface,
  sync,
  refreshError,
  onRetry,
  isRetrying = false,
}) => {
  const syncGuidance = getSurfaceSyncGuidance(surface, sync);
  const showRetryAction = Boolean(
    onRetry && (refreshError || syncGuidance?.showRetry || sync?.refreshRecommended),
  );

  if (!syncGuidance && !refreshError && !showRetryAction) {
    return null;
  }

  return (
    <div className="space-y-3">
      {syncGuidance ? (
        <InlineNotice
          title={syncGuidance.title}
          message={syncGuidance.message}
          className={syncGuidance.className}
        />
      ) : null}
      {refreshError ? (
        <InlineNotice
          title={`${formatSurfaceLabel(surface)} 다시 확인에 실패했습니다`}
          message={refreshError.message}
          className={
            refreshError.retryable
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }
        />
      ) : null}
      {showRetryAction ? (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center rounded-sm border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={`mr-2 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying
              ? `${formatSurfaceLabel(surface)} 다시 확인 중...`
              : getSurfaceRetryLabel(surface, sync, refreshError)}
          </button>
          <div className="text-xs font-medium leading-relaxed text-slate-500">
            좌측 <span className="font-bold text-slate-700">Workspace Sync</span>{" "}
            패널에서도 전체 projection 상태와 WorkNet 수동 갱신을 함께 확인할 수 있습니다.
          </div>
        </div>
      ) : null}
    </div>
  );
};

const WORKSPACE_VISIBILITY_NOTICE_ORDER = [
  "pending",
  "partial",
  "unknown",
  "stale",
];

function buildWorkspaceVisibilityNotice(visibility, projections) {
  const projectionLabels = projections.map((projection) =>
    formatProjectionLabel(projection.projection),
  );
  const joinedLabels = projectionLabels.join(", ");

  if (visibility === "pending") {
    return {
      visibility,
      title: "일부 workspace projection이 갱신 중입니다",
      message: `${joinedLabels} 화면은 마지막 확인 데이터를 유지하면서 새 반영을 기다립니다.`,
      className: "border-sky-200 bg-sky-50 text-sky-900",
    };
  }

  if (visibility === "partial") {
    return {
      visibility,
      title: "workspace 일부 projection만 최신 상태입니다",
      message: `${joinedLabels}는 준비된 블록부터 먼저 보여주고 있어 다시 확인을 권장합니다.`,
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  if (visibility === "unknown") {
    return {
      visibility,
      title: "workspace projection 최신성을 아직 단정할 수 없습니다",
      message: `${joinedLabels}는 마지막 확인본을 유지하고 있습니다. 중요한 판단 전에는 sync를 다시 확인해 주세요.`,
      className: "border-slate-200 bg-slate-100 text-slate-900",
    };
  }

  if (visibility === "stale") {
    return {
      visibility,
      title: "workspace projection 일부가 오래되었을 수 있습니다",
      message: `${joinedLabels}는 마지막 성공 데이터를 유지하고 있습니다. refresh recommended 상태이면 다시 불러오는 편이 안전합니다.`,
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  return null;
}

const WorkspaceFreshnessNotice = ({
  syncState,
  syncError,
  onRetry,
  isRetrying = false,
}) => {
  const projections = syncState?.projections ?? [];
  const notices = WORKSPACE_VISIBILITY_NOTICE_ORDER
    .map((visibility) => {
      const matched = projections.filter(
        (projection) => projection.visibility === visibility,
      );

      return matched.length
        ? buildWorkspaceVisibilityNotice(visibility, matched)
        : null;
    })
    .filter(Boolean);
  const showRetryAction = Boolean(onRetry && (syncError || notices.length));

  if (!syncError && !notices.length && !showRetryAction) {
    return null;
  }

  return (
    <div className="space-y-3">
      {syncError ? (
        <InlineNotice
          title="workspace sync 상태를 다시 확인하지 못했습니다"
          message={syncError.message}
          className={
            syncError.retryable
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }
        />
      ) : null}
      {notices.map((notice) => (
        <InlineNotice
          key={notice.visibility}
          title={notice.title}
          message={notice.message}
          className={notice.className}
        />
      ))}
      {showRetryAction ? (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center rounded-sm border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={`mr-2 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying
              ? "워크스페이스 상태 다시 확인 중..."
              : "워크스페이스 상태 다시 확인"}
          </button>
          <div className="text-xs font-medium leading-relaxed text-slate-500">
            visibility는 backend가 내려준 projection별 상태만 사용하고, 화면에서
            최신성을 추정하지 않습니다.
          </div>
        </div>
      ) : null}
    </div>
  );
};

const WorkspaceSyncPanel = ({
  syncState,
  latestCommand,
  syncError,
  isLoading,
  isRefreshing,
  isTriggering,
  isPollingCommand,
  onRefresh,
  onTrigger,
}) => {
  const projections = syncState?.projections ?? [];
  const command = latestCommand ?? syncState?.command ?? null;
  const commandMeta = getCommandStatusMeta(command?.status);
  const commandGuidance = getCommandGuidance(command);
  const refreshRecommendedCount = projections.filter(
    (projection) => projection.refreshRecommended,
  ).length;
  const isTriggerDisabled = isTriggering || isPollingCommand;
  const commandRefreshScopes = command?.refreshScopes ?? [];

  return (
    <div className="mt-6 rounded-sm border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Workspace Sync
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            동기화 및 수동 갱신
          </div>
        </div>
        {commandMeta ? (
          <span
            className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${commandMeta.className}`}
          >
            {commandMeta.label}
          </span>
        ) : null}
      </div>

      {syncError ? (
        <div className="mb-3 rounded-sm border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-medium leading-relaxed text-amber-100">
          {syncError.message}
        </div>
      ) : null}

      {command?.commandId ? (
        <div className="mb-3 space-y-3 rounded-sm border border-slate-800 bg-slate-900/80 px-3 py-3 text-[11px] font-medium text-slate-300">
          <div className="font-mono text-[11px] text-slate-200">
            command: {command.commandId}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            {command.acceptedAt ? (
              <span>접수: {formatKoreanDateTime(command.acceptedAt)}</span>
            ) : null}
            {command.finishedAt ? (
              <span>종료: {formatKoreanDateTime(command.finishedAt)}</span>
            ) : null}
          </div>
          {commandGuidance ? (
            <InlineNotice
              title={commandGuidance.title}
              message={commandGuidance.message}
              className={commandGuidance.className}
            />
          ) : null}
          {commandRefreshScopes.length ? (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Refresh Scope
              </div>
              <div className="flex flex-wrap gap-2">
                {commandRefreshScopes.map((scope) => (
                  <span
                    key={scope}
                    className="rounded-sm border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-200"
                  >
                    {formatProjectionLabel(scope)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-3 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-slate-800" />
        </div>
      ) : projections.length ? (
        <div className="space-y-2">
          {projections.map((projection) => {
            const syncMeta = getSyncMeta(projection);
            return (
              <div
                key={projection.projection}
                className="rounded-sm border border-slate-800 bg-slate-900/80 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-100">
                    {formatProjectionLabel(projection.projection)}
                  </span>
                  {syncMeta?.badgeLabel ? (
                    <span
                      className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${syncMeta.badgeClassName}`}
                    >
                      {syncMeta.badgeLabel}
                    </span>
                  ) : null}
                </div>
                {projection.lastVisibleAt ? (
                  <div className="mt-1 text-[11px] font-medium text-slate-400">
                    {formatKoreanDateTime(projection.lastVisibleAt)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-sm border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-400">
          표시 가능한 동기화 정보가 아직 없습니다.
        </div>
      )}

      {refreshRecommendedCount > 0 ? (
        <div className="mt-3 rounded-sm border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-medium leading-relaxed text-amber-100">
          일부 projection은 새로고침을 권장합니다.
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center rounded-sm border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-100 transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          sync 다시 확인
        </button>
        <button
          onClick={onTrigger}
          disabled={isTriggerDisabled}
          className="flex items-center justify-center rounded-sm border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-100 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
        >
          <Zap size={14} className="mr-2" />
          {isTriggering
            ? "WorkNet 갱신 요청 중..."
            : isPollingCommand
              ? "WorkNet 갱신 처리 중..."
              : command?.error?.retryable
                ? "WorkNet 다시 요청"
                : "WorkNet 수동 갱신"}
        </button>
      </div>
    </div>
  );
};

const WorkspaceNavigationSection = ({
  section,
  currentPath,
  onNavigatePath,
  onCreatePersonalDocument,
}) => {
  const layerMeta = WORKSPACE_LAYER_META[section.sectionId] ?? {
    subtitle: "workspace",
    emptyLabel: "표시할 항목이 아직 없습니다.",
  };
  const canCreate = section.sectionId === "personal_raw" || section.sectionId === "personal_wiki";

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3 px-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {section.label}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            {layerMeta.subtitle}
          </div>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => onCreatePersonalDocument(section.sectionId)}
            className="inline-flex items-center rounded-sm border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition-colors hover:border-indigo-400 hover:text-white"
          >
            <Plus size={12} className="mr-1.5" />
            새 문서
          </button>
        ) : null}
      </div>

      {section.items.length ? (
        <div className="space-y-1">
          {section.items.map((item) => {
            const Icon = getWorkspaceItemIcon(item.kind);
            const isActive =
              Boolean(item.path) && item.path === currentPath;
            const isDisabled = !item.path;

            return (
              <button
                key={`${section.sectionId}-${item.objectRef?.objectId ?? item.title}`}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (item.path) {
                    onNavigatePath(item.path);
                  }
                }}
                className={`w-full rounded-sm border px-3 py-3 text-left transition-all ${
                  isActive
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                    : "border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                } ${
                  isDisabled
                    ? "cursor-not-allowed opacity-60 hover:border-transparent hover:bg-transparent hover:text-slate-300"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-sm p-1.5 ${
                      isActive ? "bg-white/15" : "bg-slate-800"
                    }`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">
                      {item.title}
                    </div>
                    <div
                      className={`mt-1 text-[11px] font-medium uppercase tracking-wide ${
                        isActive ? "text-indigo-100" : "text-slate-400"
                      }`}
                    >
                      {getWorkspaceItemKindLabel(item.kind)} /{" "}
                      {formatDocumentLayerLabel(item.layer)} /{" "}
                      {formatWritableAffordanceLabel({
                        layer: item.layer,
                        writable: !isSharedLayer(item.layer),
                      })}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-slate-800 bg-slate-900/60 px-3 py-3 text-xs font-medium leading-relaxed text-slate-500">
          {layerMeta.emptyLabel}
        </div>
      )}
    </div>
  );
};

const WorkspaceActiveContextCard = ({
  context,
  onOpenWorkspace,
  onOpenAsk,
}) => {
  const Icon = getWorkspaceItemIcon(context.kind);

  return (
    <div className="mb-8 rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-sm bg-slate-900 p-3 text-white shadow-sm">
            <Icon size={20} strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              Current Active Context
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                {context.projectionLabel}
              </span>
              {context.layer ? (
                <>
                  <span className="rounded-sm border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                    {formatDocumentLayerLabel(context.layer)}
                  </span>
                  <span
                    className={`rounded-sm border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${getWritableBadgeClassName({
                      layer: context.layer,
                      writable: !isSharedLayer(context.layer),
                    })}`}
                  >
                    {formatWritableAffordanceLabel({
                      layer: context.layer,
                      writable: !isSharedLayer(context.layer),
                    })}
                  </span>
                </>
              ) : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {context.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              {context.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            workspace 홈
          </button>
          <button
            type="button"
            onClick={onOpenAsk}
            className="rounded-sm border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100"
          >
            Ask로 열기
          </button>
        </div>
      </div>
    </div>
  );
};

const BlockPlaceholder = ({ title, description }) => (
  <Panel className="border-dashed bg-slate-50">
    <Label>{title}</Label>
    <p className="text-sm leading-relaxed text-slate-500">{description}</p>
  </Panel>
);

const WorkspaceHomeView = ({
  profileSnapshot,
  syncState,
  latestCommand,
  syncError,
  isRefreshingSync,
}) => {
  const projections = syncState?.projections ?? [];
  const command = latestCommand ?? syncState?.command ?? null;
  const commandMeta = getCommandStatusMeta(command?.status);
  const commandGuidance = getCommandGuidance(command);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Panel>
        <Label>현재 프로필 스냅샷</Label>
        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-slate-900 text-base font-bold text-white shadow-sm">
              {profileSnapshot.targetRole?.charAt(0) ?? "J"}
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">
                {profileSnapshot.targetRole}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {profileSnapshot.experience}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                관심 영역
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">
                {profileSnapshot.location ?? "지역 미정"} /{" "}
                {profileSnapshot.domain ?? "도메인 미정"}
              </div>
            </div>
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                핵심 스킬
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">
                {(profileSnapshot.skills ?? []).slice(0, 4).join(" • ") || "-"}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <section>
        <div className="mb-5 flex items-end justify-between border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Projection Visibility
          </h2>
          <div className="text-sm font-bold text-slate-500">
            `/api/workspace/sync` 응답을 그대로 표시합니다
          </div>
        </div>

        <WorkspaceFreshnessNotice
          syncState={syncState}
          syncError={syncError}
          onRetry={onRefreshSync}
          isRetrying={isRefreshingSync}
        />

        {commandGuidance ? (
          <InlineNotice
            title={commandGuidance.title}
            message={commandGuidance.message}
            className={commandGuidance.className}
          />
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projections.length ? (
            projections.map((projection) => {
              const syncMeta = getSyncMeta(projection);

              return (
                <div
                  key={projection.projection}
                  className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatProjectionLabel(projection.projection)}
                      </div>
                      <div className="mt-2 text-xs font-medium text-slate-500">
                        {projection.lastVisibleAt
                          ? `${formatKoreanDateTime(projection.lastVisibleAt)} 확인`
                          : "표시 가능한 확인 시각 없음"}
                      </div>
                    </div>
                    {syncMeta?.badgeLabel ? (
                      <span
                        className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${syncMeta.badgeClassName}`}
                      >
                        {syncMeta.badgeLabel}
                      </span>
                    ) : null}
                  </div>
                  {projection.lastKnownVersion ? (
                    <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                      version {projection.lastKnownVersion}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-sm border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-500 shadow-sm">
              아직 표시 가능한 projection visibility가 없습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const CreatePersonalDocumentModal = ({
  layer,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");

  useEffect(() => {
    setTitle("");
    setBodyMarkdown("");
  }, [layer]);

  if (!layer) {
    return null;
  }

  const titleLabel = layer === "personal_wiki" ? "personal/wiki 새 문서" : "personal/raw 새 문서";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-2xl rounded-sm border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-indigo-600">personal create</Label>
            <h2 className="text-2xl font-bold text-slate-900">{titleLabel}</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">
              shared shell은 그대로 두고, 현재 personal layer에만 새 writable 문서를 추가합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm"
          >
            닫기
          </button>
        </div>
        <div className="mt-6 space-y-5">
          <div>
            <Label>제목</Label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="문서 제목"
              className="w-full rounded-sm border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-0 transition-colors focus:border-indigo-500"
            />
          </div>
          <div>
            <Label>본문</Label>
            <textarea
              value={bodyMarkdown}
              onChange={(event) => setBodyMarkdown(event.target.value)}
              placeholder="## Notes"
              className="custom-scrollbar min-h-[220px] w-full rounded-sm border border-slate-300 px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 outline-none transition-colors focus:border-indigo-500"
            />
          </div>
          {error ? (
            <InlineNotice
              title="문서를 만들지 못했습니다"
              message={error.message}
              className="border-rose-200 bg-rose-50 text-rose-900"
            />
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isSubmitting || !title.trim() || !bodyMarkdown.trim()}
              onClick={() =>
                onSubmit({
                  layer,
                  title,
                  bodyMarkdown,
                })
              }
              className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-40"
            >
              {isSubmitting ? "생성 중..." : "문서 생성"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportLoadingView = () => (
  <div className="mx-auto max-w-6xl space-y-8 animate-pulse">
    <div className="space-y-4 border-b border-slate-200 pb-8">
      <div className="h-7 w-52 rounded bg-slate-200" />
      <div className="h-10 w-full max-w-4xl rounded bg-slate-200" />
      <div className="h-10 w-5/6 max-w-3xl rounded bg-slate-200" />
    </div>
    <div className="h-28 rounded-sm border border-slate-200 bg-white" />
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <div className="space-y-6 md:col-span-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-sm border border-slate-200 bg-white p-8 shadow-sm"
          >
            <div className="mb-5 h-7 w-3/5 rounded bg-slate-200" />
            <div className="mb-3 h-4 w-full rounded bg-slate-100" />
            <div className="mb-3 h-4 w-4/5 rounded bg-slate-100" />
            <div className="h-16 rounded bg-slate-50" />
          </div>
        ))}
      </div>
      <div className="space-y-6 md:col-span-4">
        <div className="h-48 rounded-sm border border-slate-200 bg-white" />
        <div className="h-48 rounded-sm border border-slate-200 bg-white" />
      </div>
    </div>
  </div>
);

const BaselineReportView = ({
  onJobClick,
  onOpenAsk,
  onOpenCalendar,
  onEditProfile,
}) => {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  const loadSummary = async ({ preserveData = false } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (preserveData) {
      setIsRefreshing(true);
      setRefreshError(null);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await getWorkspaceSummary();

      if (requestId !== requestIdRef.current) {
        return;
      }

      setSummary(response);
      setError(null);
      setRefreshError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const normalizedError =
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "기본 리포트를 불러오지 못했습니다.",
            });

      if (preserveData) {
        setRefreshError(normalizedError);
      } else {
        setError(normalizedError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadSummary();

    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  if (isLoading && !summary) {
    return <ReportLoadingView />;
  }

  if (error && !summary) {
    return (
      <RetryPanel
        title="기본 리포트를 불러오지 못했습니다"
        message={error.message}
        onRetry={() => loadSummary()}
      />
    );
  }

  const profileSnapshot = summary.profileSnapshot;
  const recommendedOpportunities = summary.recommendedOpportunities.map(
    mapSummaryOpportunity,
  );
  const hero = buildHeroHeadline(summary);
  const hasPartialBlocks =
    !summary.marketBrief ||
    !summary.skillsGap ||
    !summary.actionQueue ||
    !summary.askFollowUps;
  const syncMeta = getSyncMeta(summary.sync);
  const updatedAt = formatKoreanDate(summary.sync?.lastVisibleAt);

  return (
    <div className="mx-auto max-w-6xl space-y-12 animate-in fade-in duration-700">
      <header className="mt-4 border-b border-slate-200 pb-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-sm border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 shadow-sm">
              기본 분석 리포트 {updatedAt ? `// ${updatedAt} 확인` : ""}
            </div>
            {syncMeta?.badgeLabel ? (
              <div
                className={`rounded-sm border px-3 py-1.5 text-xs font-bold shadow-sm ${syncMeta.badgeClassName}`}
              >
                {syncMeta.badgeLabel}
              </div>
            ) : null}
            {hasPartialBlocks ? (
              <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
                일부 블록 준비 중
              </div>
            ) : null}
          </div>
          <div className="flex gap-3">
            <button className="flex items-center text-sm font-bold text-slate-600 transition-colors hover:text-slate-900">
              <FileText size={16} className="mr-1.5" />
              리포트 저장
            </button>
            <button
              onClick={() => loadSummary({ preserveData: Boolean(summary) })}
              disabled={isRefreshing}
              className="flex items-center rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              새로고침
            </button>
          </div>
        </div>
        <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
          {recommendedOpportunities.length > 0 ? (
            <>
              현재 역량 기준, 최우선으로 검토해야 할{" "}
              <span className="text-indigo-600">
                추천 공고 {hero.opportunityCount}건
              </span>
              과 보완이 필요한{" "}
              <span className="text-amber-600">
                핵심 스킬 {hero.strengtheningCount}가지
              </span>
              를 확인했습니다.
            </>
          ) : (
            hero.text
          )}
        </h1>
      </header>

      <SyncNotice
        surface="report"
        sync={summary.sync}
        refreshError={refreshError}
        onRetry={() => loadSummary({ preserveData: Boolean(summary) })}
        isRetrying={isRefreshing}
      />

      <div className="flex flex-wrap items-center rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-sm bg-slate-900 text-sm font-bold text-white shadow-sm">
              {profileSnapshot.targetRole?.charAt(0) ?? "J"}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {profileSnapshot.targetRole}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-500">
                {profileSnapshot.experience}
              </div>
            </div>
          </div>
          <div className="hidden h-8 w-px bg-slate-200 md:block" />
          <div className="hidden md:block">
            <Label className="mb-1">분석 기반 핵심 역량</Label>
            <div className="text-sm font-bold text-slate-800">
              {(profileSnapshot.skills ?? []).slice(0, 4).join(" • ") || "-"}
            </div>
          </div>
          <div className="hidden h-8 w-px bg-slate-200 md:block" />
          <div className="hidden md:block">
            <Label className="mb-1">목표 지역 및 도메인</Label>
            <div className="text-sm font-bold text-slate-800">
              {profileSnapshot.location ?? "지역 미정"} /{" "}
              {profileSnapshot.domain ?? "도메인 미정"}
            </div>
          </div>
        </div>
        <button
          onClick={onEditProfile}
          className="rounded-sm border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100"
        >
          프로필 다시 보기
        </button>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16">
        <div className="space-y-16 md:col-span-8">
          <section>
            <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                추천 공고
              </h2>
              <div className="text-sm font-bold text-slate-500">
                화면 진입 시 WAS summary projection을 기준으로 읽습니다
              </div>
            </div>

            {recommendedOpportunities.length === 0 ? (
              <Panel className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    현재 조건과 직접 맞는 추천 공고가 없습니다
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    추천은 비어 있지만 프로필 기준과 다음 액션은 유지됩니다.
                    조건을 완화하거나 다른 기간의 공고를 다시 검토해 보세요.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      onOpenAsk(null, {
                        prefillQuestion:
                          "현재 조건을 완화하면 어떤 방향의 공고를 우선 검토해야 할지 분석해 줘.",
                      })
                    }
                    className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm"
                  >
                    조건 완화 방향 분석하기
                  </button>
                  <button
                    onClick={onOpenCalendar}
                    className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
                  >
                    다른 일정 보기
                  </button>
                </div>
              </Panel>
            ) : (
              <div className="space-y-6">
                {recommendedOpportunities.map((job) => (
                  <div
                    key={job.opportunityId}
                    className="group cursor-pointer rounded-sm border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-600 hover:shadow-md"
                    onClick={() => onJobClick(job)}
                  >
                    <div className="p-6 md:p-8">
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <span className="text-sm font-bold text-slate-900">
                              {job.company}
                            </span>
                            <span
                              className={`rounded-sm border px-2.5 py-1 text-xs font-bold shadow-sm ${getStatusBadgeClassName(job.status)}`}
                            >
                              {formatStatusLabel(job.status)}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
                            {job.title}
                          </h3>
                          {job.roleLabels?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {job.roleLabels.map((roleLabel) => (
                                <span
                                  key={roleLabel}
                                  className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"
                                >
                                  {roleLabel}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                            {job.urgency ?? "-"}
                          </div>
                          <div className="mt-1 text-xs font-bold text-slate-500">
                            마감 기준
                          </div>
                        </div>
                      </div>

                      {job.summary ? (
                        <p className="text-sm leading-relaxed text-slate-600">
                          {job.summary}
                        </p>
                      ) : null}

                      <div className="mt-6 flex flex-wrap items-center gap-y-2">
                        <MetaTag icon={Clock}>
                          마감 {job.deadline ?? "-"}
                        </MetaTag>
                        <MetaTag icon={FileCode}>
                          {formatEmploymentType(job.employmentType)}
                        </MetaTag>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 md:px-8">
                      <div className="flex items-start">
                        <ShieldCheck
                          size={18}
                          className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600"
                        />
                        <div>
                          <span className="mr-2 text-sm font-bold text-slate-900">
                            이 공고가 추천된 이유:
                          </span>
                          <span className="text-sm font-medium leading-relaxed text-slate-700">
                            {job.matchReason ?? "추천 근거를 준비 중입니다."}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-6 border-b border-slate-200 pb-4 text-2xl font-bold tracking-tight text-slate-900">
              가장 먼저 해야 할 가이드
            </h2>
            {summary.actionQueue?.length ? (
              <div className="rounded-sm bg-slate-900 p-8 text-white shadow-md">
                <ul className="space-y-6">
                  {summary.actionQueue.map((action, index) => {
                    const relatedOpportunity = recommendedOpportunities.find(
                      (item) =>
                        item.opportunityId ===
                        action.relatedOpportunityRef?.opportunityId,
                    );

                    return (
                      <li
                        key={action.actionId}
                        className={index === 0 ? "flex items-start" : "flex items-start border-t border-slate-700/50 pt-6"}
                      >
                        <div className="mr-4 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-indigo-500/20 text-sm font-bold text-indigo-400">
                          {index + 1}
                        </div>
                        <div>
                          <p className="mb-2 text-lg font-bold text-white">
                            {action.label}
                          </p>
                          {action.description ? (
                            <p className="mb-4 text-sm font-medium leading-relaxed text-slate-300">
                              {action.description}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-3">
                            {relatedOpportunity ? (
                              <button
                                onClick={() => onOpenAsk(relatedOpportunity)}
                                className="flex items-center rounded-sm bg-white/10 px-4 py-2 text-sm font-bold text-indigo-300 transition-colors hover:text-white"
                              >
                                심층 분석하기
                                <MoveRight size={14} className="ml-2" />
                              </button>
                            ) : null}
                            {index === 0 ? null : (
                              <button
                                onClick={onOpenCalendar}
                                className="rounded-sm border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"
                              >
                                마감 일정 보기
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <BlockPlaceholder
                title="Action Queue"
                description="다음 행동 제안은 아직 준비되지 않았습니다. 준비된 공고와 프로필 기준은 먼저 확인할 수 있습니다."
              />
            )}
          </section>
        </div>

        <div className="space-y-12 md:col-span-4">
          {summary.marketBrief ? (
            <Panel>
              <Label>최신 시장 수요 동향</Label>
              <div className="mt-4">
                <div className="space-y-3">
                  {summary.marketBrief.signals?.map((signal) => (
                    <div
                      key={signal}
                      className="rounded-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
                    >
                      {signal}
                    </div>
                  ))}
                </div>
                {summary.marketBrief.risingSkills?.length ? (
                  <div className="mt-5">
                    <div className="mb-3 text-sm font-bold text-slate-900">
                      현재 시장에서 수요가 오르는 스킬
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {summary.marketBrief.risingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-800 shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {summary.marketBrief.notableCompanies?.length ? (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
                    주목 기업: {summary.marketBrief.notableCompanies.join(", ")}
                  </p>
                ) : null}
              </div>
            </Panel>
          ) : (
            <BlockPlaceholder
              title="Market Brief"
              description="시장 브리핑은 아직 준비되지 않았습니다. 추천 공고와 액션 큐는 먼저 열어둡니다."
            />
          )}

          {summary.skillsGap ? (
            <Panel>
              <Label>지원 판단 포인트 (Gap)</Label>
              <div className="mt-4 space-y-6">
                <div>
                  <div className="mb-2 flex items-center text-sm font-bold text-slate-900">
                    <Check size={16} className="mr-2 text-emerald-500" />
                    강점으로 작용할 스킬
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {summary.skillsGap.strong?.join(", ") || "표시 가능한 강점 없음"}
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <div className="mb-3 flex items-center text-sm font-bold text-slate-900">
                    <AlertCircle size={16} className="mr-2 text-amber-500" />
                    지금 보완하면 좋은 역량
                  </div>
                  <div className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900 shadow-sm">
                    {summary.skillsGap.recommendedToStrengthen?.join(", ") ||
                      "보완 권장 역량 없음"}
                  </div>
                  {summary.skillsGap.requested?.length ? (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      자주 요청되는 역량: {summary.skillsGap.requested.join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
            </Panel>
          ) : (
            <BlockPlaceholder
              title="Skills Gap"
              description="역량 갭 분석은 아직 완성되지 않았습니다."
            />
          )}

          <section>
            <Label className="mb-3">추가 심층 분석</Label>
            {summary.askFollowUps?.length ? (
              <div className="space-y-3">
                {summary.askFollowUps.map((followUp) => (
                  <button
                    key={followUp}
                    onClick={() =>
                      onOpenAsk(null, {
                        prefillQuestion: followUp,
                      })
                    }
                    className="flex w-full items-start rounded-sm border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-indigo-600"
                  >
                    <MessageSquare
                      size={18}
                      className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600"
                    />
                    <span>{followUp}</span>
                  </button>
                ))}
              </div>
            ) : (
              <BlockPlaceholder
                title="Ask Follow-ups"
                description="후속 분석 제안은 아직 준비되지 않았습니다."
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const DetailLoadingView = () => (
  <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
      <div className="h-5 w-40 rounded bg-slate-200" />
      <div className="h-4 w-28 rounded bg-slate-200" />
    </div>
    <div className="h-32 rounded bg-slate-200" />
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <div className="space-y-6 md:col-span-8">
        <div className="h-48 rounded-sm border border-slate-200 bg-white" />
        <div className="h-40 rounded-sm border border-slate-200 bg-white" />
        <div className="h-48 rounded-sm border border-slate-200 bg-white" />
      </div>
      <div className="md:col-span-4">
        <div className="h-[420px] rounded-sm border border-slate-200 bg-white" />
      </div>
    </div>
  </div>
);

const OpportunityDetailView = ({
  opportunityContext,
  onBack,
  onOpenAsk,
}) => {
  const opportunityId = opportunityContext?.opportunityId ?? null;
  const [detailResponse, setDetailResponse] = useState(null);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  const loadDetail = async ({ preserveData = false } = {}) => {
    if (!opportunityId) {
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (preserveData) {
      setIsRefreshing(true);
      setRefreshError(null);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await getOpportunityDetail(opportunityId);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setDetailResponse(response);
      setError(null);
      setRefreshError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const normalizedError =
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "공고 상세를 불러오지 못했습니다.",
            });

      if (preserveData) {
        setRefreshError(normalizedError);
      } else {
        setError(normalizedError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    setDetailResponse(null);
    setError(null);
    setRefreshError(null);
    setIsLoading(true);
    setIsRefreshing(false);

    if (!opportunityId) {
      setIsLoading(false);
      return undefined;
    }

    loadDetail();

    return () => {
      requestIdRef.current += 1;
    };
  }, [opportunityId]);

  if (!opportunityId) {
    return (
      <RetryPanel
        title="선택된 공고가 없습니다"
        message="기본 리포트나 캘린더에서 공고를 선택한 뒤 상세 화면으로 이동해 주세요."
        onRetry={onBack}
        retryLabel="기본 리포트로 돌아가기"
      />
    );
  }

  if (isLoading && !detailResponse) {
    return <DetailLoadingView />;
  }

  if (error?.code === "not_found" && !detailResponse) {
    return (
      <RetryPanel
        title="공고를 찾을 수 없습니다"
        message="선택한 opportunityId에 해당하는 공고가 더 이상 없거나 접근할 수 없습니다."
        onRetry={onBack}
        retryLabel="추천 공고 목록으로 돌아가기"
      />
    );
  }

  if (error && !detailResponse) {
    return (
      <RetryPanel
        title="공고 상세를 불러오지 못했습니다"
        message={error.message}
        onRetry={() => loadDetail()}
        secondaryAction={
          <button
            onClick={onBack}
            className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
          >
            기본 리포트로 돌아가기
          </button>
        }
      />
    );
  }

  const detail = mapDetailOpportunity(detailResponse);
  const syncMeta = getSyncMeta(detailResponse.sync);
  const qualificationItems = detail.requirements?.length
    ? detail.requirements
    : ["표시 가능한 요구사항이 없습니다."];
  const selectionProcess = splitBlockText(
    detailResponse.item.qualification?.selectionProcessText,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-12 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm font-bold text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={16} className="mr-2" />
          기본 리포트로 돌아가기
        </button>
        <div className="flex items-center gap-3">
          {syncMeta?.badgeLabel ? (
            <div
              className={`rounded-sm border px-3 py-1.5 text-xs font-bold shadow-sm ${syncMeta.badgeClassName}`}
            >
              {syncMeta.badgeLabel}
            </div>
          ) : null}
          <button
            onClick={() => loadDetail({ preserveData: Boolean(detailResponse) })}
            disabled={isRefreshing}
            className="flex items-center rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            새로고침
          </button>
          <div className="text-xs font-bold text-slate-400">
            공고 ID: {opportunityId}
          </div>
        </div>
      </div>

      <SyncNotice
        surface="detail"
        sync={detailResponse.sync}
        refreshError={refreshError}
        onRetry={() => loadDetail({ preserveData: Boolean(detailResponse) })}
        isRetrying={isRefreshing}
      />

      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <span className="text-base font-bold text-slate-900">
              {detail.company}
            </span>
            <span
              className={`rounded-sm border px-3 py-1 text-xs font-bold shadow-sm ${getStatusBadgeClassName(detailResponse.item.metadata?.status)}`}
            >
              {formatStatusLabel(detailResponse.item.metadata?.status)}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
            {detail.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-base font-bold text-slate-600">
            <MetaTag icon={MapPin}>
              {detail.location ?? "위치 정보 없음"}
            </MetaTag>
            <MetaTag icon={Clock}>
              마감: {detail.deadline ?? "-"} ({detail.urgency ?? "기한 정보 없음"})
            </MetaTag>
            <MetaTag icon={FileCode}>
              {formatEmploymentType(detail.employmentType)}
            </MetaTag>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <button className="flex items-center rounded-sm border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
            <Bookmark size={18} className="mr-2" />
            관심 공고 저장
          </button>
          <button
            onClick={() => {
              if (detail.sourceUrl) {
                window.open(detail.sourceUrl, "_blank", "noopener,noreferrer");
              }
            }}
            disabled={!detail.sourceUrl}
            className="flex items-center rounded-sm bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            지원 준비 시작하기
            <ExternalLink size={16} className="ml-2" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-16 border-t border-slate-200 pt-12 md:grid-cols-12">
        <div className="space-y-12 md:col-span-8">
          <section className="rounded-sm border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <Label className="mb-4 text-slate-600">기업 및 도메인 컨텍스트</Label>
            <div className="space-y-5">
              <p className="text-base font-bold leading-relaxed text-slate-900">
                {detail.companyContext?.description ??
                  "회사 설명은 아직 준비되지 않았습니다."}
              </p>
              <div className="flex items-start rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
                <Lightbulb
                  size={20}
                  className="mr-4 mt-0.5 flex-shrink-0 text-amber-500"
                />
                <div>
                  <div className="mb-2 text-sm font-bold text-slate-900">
                    이 기업이 지금 유의미한 이유
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-700">
                    {detail.companyContext?.whyRelevant ??
                      "도메인 맥락 설명은 아직 준비되지 않았습니다."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-5 border-b border-slate-200 pb-3 text-xl font-bold text-slate-900">
              직무 요약
            </h3>
            <p className="whitespace-pre-wrap text-lg font-bold leading-relaxed text-slate-800">
              {detailResponse.item.surface?.descriptionMarkdown ??
                detail.summary ??
                "직무 요약은 아직 준비되지 않았습니다."}
            </p>
          </section>

          <section>
            <h3 className="mb-5 border-b border-slate-200 pb-3 text-xl font-bold text-slate-900">
              핵심 자격 요건
            </h3>
            <ul className="space-y-4">
              {qualificationItems.map((requirement, index) => (
                <li
                  key={`${requirement}-${index}`}
                  className="flex items-start rounded-sm border border-slate-100 bg-white p-5 text-base text-slate-800 shadow-sm"
                >
                  <span className="mr-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-slate-100 text-sm font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <span className="mt-0.5 font-medium leading-relaxed">
                    {requirement}
                  </span>
                </li>
              ))}
            </ul>

            {selectionProcess.length ? (
              <div className="mt-6 rounded-sm border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <Label className="mb-3">전형 절차</Label>
                <div className="space-y-2 text-sm font-medium leading-relaxed text-slate-700">
                  {selectionProcess.map((step, index) => (
                    <div key={`${step}-${index}`}>{step}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="md:col-span-4">
          <div className="sticky top-8 rounded-sm border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-900">
              지원 적합도 분석
            </h3>

            <div className="mb-8">
              <div className="flex items-baseline text-5xl font-extrabold tracking-tight text-slate-900">
                {detail.matchScore ?? "-"}
                <span className="ml-1 text-lg font-bold text-slate-500">점</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${detail.matchScore ?? 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center text-sm font-bold text-slate-900">
                  <CheckCircle size={18} className="mr-2 text-indigo-600" />
                  긍정적인 평가 요소
                </div>
                <p className="rounded-sm border border-indigo-100 bg-indigo-50/50 p-4 text-sm font-medium leading-relaxed text-slate-700 shadow-sm">
                  {detail.matchReason ?? "긍정 요소 분석은 아직 준비되지 않았습니다."}
                </p>
              </div>
              <div>
                <div className="mb-3 flex items-center text-sm font-bold text-slate-900">
                  <AlertCircle size={18} className="mr-2 text-amber-600" />
                  지원 시 고려할 리스크
                </div>
                <p className="rounded-sm border border-amber-100 bg-amber-50/50 p-4 text-sm font-medium leading-relaxed text-slate-700 shadow-sm">
                  {detail.gap ?? "리스크 요약은 아직 준비되지 않았습니다."}
                </p>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
              <div className="mb-4 rounded-sm border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-700 shadow-sm">
                면접 시나리오나 확장 분석은 상세 payload 안에서 바로 생성하지 않고,
                Ask Workspace로 이어서 진행합니다.
              </div>
              <button
                onClick={() =>
                  onOpenAsk(detail, {
                    prefillQuestion:
                      "이 공고 기준으로 예상 면접 질문과 답변 전략을 정리해 줘.",
                  })
                }
                className="flex w-full items-center justify-center rounded-sm bg-slate-900 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                <Sparkles size={18} className="mr-2 text-indigo-300" />
                이 포지션 면접 시나리오 분석하기
              </button>
              <button
                onClick={() => onOpenAsk(detail)}
                className="mt-4 flex w-full items-center justify-center rounded-sm border border-slate-300 bg-white py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
              >
                <Search size={18} className="mr-2" />
                이 공고를 워크스페이스에서 이어서 분석
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentDetailView = ({
  documentId,
  onBack,
  onOpenAsk,
  onOpenDocument,
  onWorkspaceChanged,
}) => {
  const [documentResponse, setDocumentResponse] = useState(null);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorBody, setEditorBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegisteringAsset, setIsRegisteringAsset] = useState(false);
  const [isGeneratingWiki, setIsGeneratingWiki] = useState(false);
  const [isSuggestingLinks, setIsSuggestingLinks] = useState(false);
  const [isAttachingLinks, setIsAttachingLinks] = useState(false);
  const [mutationError, setMutationError] = useState(null);
  const [mutationNotice, setMutationNotice] = useState(null);
  const [assetFilename, setAssetFilename] = useState("");
  const [assetMediaType, setAssetMediaType] = useState("application/pdf");
  const [assetStorageRef, setAssetStorageRef] = useState("");
  const [linkSuggestions, setLinkSuggestions] = useState([]);
  const requestIdRef = useRef(0);

  const loadDocument = async ({ preserveData = false } = {}) => {
    if (!documentId) {
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (preserveData) {
      setIsRefreshing(true);
      setRefreshError(null);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await getDocumentDetail(documentId);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setDocumentResponse(response);
      const detail = mapDocumentResponse(response);
      setEditorTitle(detail.title ?? "");
      setEditorBody(detail.bodyMarkdown ?? "");
      setError(null);
      setRefreshError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const normalizedError =
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "문서 상세를 불러오지 못했습니다.",
            });

      if (preserveData) {
        setRefreshError(normalizedError);
      } else {
        setError(normalizedError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    setDocumentResponse(null);
    setError(null);
    setRefreshError(null);
    setIsLoading(true);
    setIsRefreshing(false);
    setIsEditing(false);
    setMutationError(null);
    setMutationNotice(null);
    setLinkSuggestions([]);

    if (!documentId) {
      setIsLoading(false);
      return undefined;
    }

    loadDocument();

    return () => {
      requestIdRef.current += 1;
    };
  }, [documentId]);

  if (!documentId) {
    return (
      <RetryPanel
        title="선택된 문서가 없습니다"
        message="워크스페이스에서 문서를 선택한 뒤 상세 화면으로 이동해 주세요."
        onRetry={onBack}
        retryLabel="워크스페이스로 돌아가기"
      />
    );
  }

  if (isLoading && !documentResponse) {
    return <DetailLoadingView />;
  }

  if (error?.code === "not_found" && !documentResponse) {
    return (
      <RetryPanel
        title="문서를 찾을 수 없습니다"
        message="선택한 documentId에 해당하는 문서가 더 이상 없거나 접근할 수 없습니다."
        onRetry={onBack}
        retryLabel="워크스페이스로 돌아가기"
      />
    );
  }

  if (error && !documentResponse) {
    return (
      <RetryPanel
        title="문서 상세를 불러오지 못했습니다"
        message={error.message}
        onRetry={() => loadDocument()}
        secondaryAction={
          <button
            onClick={onBack}
            className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
          >
            워크스페이스로 돌아가기
          </button>
        }
      />
    );
  }

  const detail = mapDocumentResponse(documentResponse);
  const syncMeta = getSyncMeta(documentResponse.sync);
  const updatedAt = formatKoreanDateTime(detail.metadata?.updatedAt);
  const tags = detail.metadata?.tags ?? [];
  const assetRefs = detail.assetRefs ?? [];

  const refreshWorkspace = async () => {
    await onWorkspaceChanged?.();
  };

  const handleGenerateWiki = async (operation) => {
    if (detail.layer !== "personal_raw" || !detail.writable || isGeneratingWiki) {
      return;
    }

    setIsGeneratingWiki(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      const response = await generateWikiDocument(detail.documentId, { operation });
      const generatedDocumentId = response.item?.documentRef?.objectId ?? null;

      await refreshWorkspace();
      setMutationNotice(
        operation === "summarize"
          ? "personal/wiki summary를 생성했습니다."
          : operation === "rewrite"
            ? "personal/wiki rewrite 결과를 생성했습니다."
            : "personal/wiki structured note를 생성했습니다.",
      );

      if (generatedDocumentId) {
        onOpenDocument?.({
          documentId: generatedDocumentId,
        });
      }
    } catch (requestError) {
      setMutationError(
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "personal/wiki 생성에 실패했습니다.",
            }),
      );
    } finally {
      setIsGeneratingWiki(false);
    }
  };

  const handleSuggestLinks = async () => {
    if (detail.layer !== "personal_wiki" || !detail.writable || isSuggestingLinks) {
      return;
    }

    setIsSuggestingLinks(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      const response = await suggestWikiLinks(detail.documentId, {
        maxSuggestions: 5,
      });
      setLinkSuggestions(response.suggestions ?? []);
      setMutationNotice("link suggestion은 preview only이며 shared를 변경하지 않습니다.");
    } catch (requestError) {
      setMutationError(
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "link suggestion을 불러오지 못했습니다.",
            }),
      );
    } finally {
      setIsSuggestingLinks(false);
    }
  };

  const handleAttachSuggestedLinks = async () => {
    if (
      detail.layer !== "personal_wiki" ||
      !detail.writable ||
      !detail.version ||
      isAttachingLinks ||
      linkSuggestions.length === 0
    ) {
      return;
    }

    setIsAttachingLinks(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      await attachWikiLinks(detail.documentId, {
        wikiDocumentVersion: detail.version,
        attachments: linkSuggestions.map((item) => ({
          layer: item.layer,
          id: item.id,
        })),
      });
      await loadDocument({ preserveData: true });
      await refreshWorkspace();
      setMutationNotice("선택된 link를 personal/wiki 문서에만 attach했습니다.");
    } catch (requestError) {
      setMutationError(
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "link attach에 실패했습니다.",
            }),
      );
    } finally {
      setIsAttachingLinks(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!detail.writable || !detail.version || isSaving) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      await updateDocument(detail.documentId, {
        ifVersion: detail.version,
        title: editorTitle,
        bodyMarkdown: editorBody,
        assetRefs,
      });
      await loadDocument({ preserveData: true });
      await refreshWorkspace();
      setIsEditing(false);
      setMutationNotice("personal 문서를 저장했습니다.");
    } catch (requestError) {
      setMutationError(
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "문서를 저장하지 못했습니다.",
            }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!detail.writable || !detail.version || isDeleting) {
      return;
    }

    const shouldDelete = window.confirm("이 personal 문서를 삭제하시겠습니까?");

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      await deleteDocument(detail.documentId, {
        ifVersion: detail.version,
      });
      await refreshWorkspace();
      onBack();
    } catch (requestError) {
      setMutationError(
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "문서를 삭제하지 못했습니다.",
            }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegisterAsset = async () => {
    if (!detail.writable || !detail.version || isRegisteringAsset) {
      return;
    }

    setIsRegisteringAsset(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      const assetResponse = await registerPersonalAsset({
        filename: assetFilename,
        mediaType: assetMediaType,
        storageRef: assetStorageRef,
        assetKind: "file",
      });
      const nextAssetRefs = Array.from(
        new Set([...(assetRefs ?? []), assetResponse.assetId].filter(Boolean)),
      );
      const referenceLine = `- ${assetResponse.filename} (${assetResponse.assetId})`;
      const nextBody = editorBody.includes(referenceLine)
        ? editorBody
        : `${editorBody.trimEnd()}\n\n## Asset references\n${referenceLine}\n`;

      await updateDocument(detail.documentId, {
        ifVersion: detail.version,
        title: editorTitle,
        bodyMarkdown: nextBody,
        assetRefs: nextAssetRefs,
      });
      setAssetFilename("");
      setAssetMediaType("application/pdf");
      setAssetStorageRef("");
      await loadDocument({ preserveData: true });
      await refreshWorkspace();
      setIsEditing(true);
      setEditorBody(nextBody);
      setMutationNotice("asset를 등록하고 현재 personal 문서에 연결했습니다.");
    } catch (requestError) {
      setMutationError(
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "asset 등록 또는 문서 연결에 실패했습니다.",
            }),
      );
    } finally {
      setIsRegisteringAsset(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-12 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm font-bold text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={16} className="mr-2" />
          워크스페이스로 돌아가기
        </button>
        <div className="flex items-center gap-3">
          {syncMeta?.badgeLabel ? (
            <div
              className={`rounded-sm border px-3 py-1.5 text-xs font-bold shadow-sm ${syncMeta.badgeClassName}`}
            >
              {syncMeta.badgeLabel}
            </div>
          ) : null}
          <button
            onClick={() => loadDocument({ preserveData: Boolean(documentResponse) })}
            disabled={isRefreshing}
            className="flex items-center rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            새로고침
          </button>
          <div className="text-xs font-bold text-slate-400">
            문서 ID: {documentId}
          </div>
        </div>
      </div>

      <SyncNotice
        surface="document"
        sync={documentResponse.sync}
        refreshError={refreshError}
        onRetry={() => loadDocument({ preserveData: Boolean(documentResponse) })}
        isRetrying={isRefreshing}
      />
      {mutationNotice ? (
        <InlineNotice
          title="personal write 적용 완료"
          message={mutationNotice}
          className="border-emerald-200 bg-emerald-50 text-emerald-900"
        />
      ) : null}
      {mutationError ? (
        <InlineNotice
          title="personal write 실패"
          message={mutationError.message}
          className="border-rose-200 bg-rose-50 text-rose-900"
        />
      ) : null}
      <InlineNotice
        title={
          isSharedLayer(detail.layer)
            ? "shared read-only boundary"
            : "personal workspace boundary"
        }
        message={
          isSharedLayer(detail.layer)
            ? "현재 sync 표시는 shared reference projection의 마지막 확인 상태입니다. personal에 저장된 것을 뜻하지 않습니다."
            : "현재 sync 표시는 이 personal projection의 마지막 확인 상태입니다. shared가 갱신된 것처럼 해석하면 안 되며, 이 화면은 writable boundary만 정직하게 보여줍니다."
        }
        className={
          isSharedLayer(detail.layer)
            ? "border-slate-200 bg-slate-50 text-slate-900"
            : "border-emerald-200 bg-emerald-50 text-emerald-900"
        }
      />

      <header className="rounded-sm border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-sm border px-3 py-1 text-xs font-bold shadow-sm ${getDocumentLayerBadgeClassName(detail.layer)}`}
              >
                {formatDocumentLayerLabel(detail.layer)}
              </span>
              <span
                className={`rounded-sm border px-3 py-1 text-xs font-bold shadow-sm ${getWritableBadgeClassName({
                  layer: detail.layer,
                  writable: detail.writable,
                })}`}
              >
                {formatWritableAffordanceLabel({
                  layer: detail.layer,
                  writable: detail.writable,
                })}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
              {detail.title}
            </h1>
            {detail.summary ? (
              <p className="mt-5 max-w-3xl text-base font-medium leading-relaxed text-slate-600">
                {detail.summary}
              </p>
            ) : null}
            <div className="mt-5 rounded-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700 shadow-sm">
              {buildLayerBoundaryCopy({
                layer: detail.layer,
                writable: detail.writable,
              })}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {detail.writable ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing((current) => !current);
                    setMutationError(null);
                    setMutationNotice(null);
                    setEditorTitle(detail.title ?? "");
                    setEditorBody(detail.bodyMarkdown ?? "");
                  }}
                  className="rounded-sm border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Pencil size={14} className="mr-2 inline-flex" />
                  {isEditing ? "편집 닫기" : "편집"}
                </button>
                <button
                  onClick={handleDeleteDocument}
                  disabled={isDeleting}
                  className="rounded-sm border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 shadow-sm transition-colors hover:bg-rose-100 disabled:opacity-40"
                >
                  <Trash2 size={14} className="mr-2 inline-flex" />
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
                <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm">
                  personal writable boundary
                </div>
              </>
            ) : (
              <div className="rounded-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
                shared 문서는 직접 수정하지 않습니다
              </div>
            )}
            <button
              onClick={() => onOpenAsk(detail)}
              className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Ask로 열기
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="space-y-8 md:col-span-8">
          {detail.writable && detail.layer === "personal_raw" ? (
            <Panel>
              <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
                raw to wiki generation
              </h3>
              <p className="mb-4 text-sm font-medium leading-relaxed text-slate-600">
                이 액션은 shared를 publish하지 않고, 현재 personal/raw 문서를 기반으로 personal/wiki 결과만 생성합니다.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleGenerateWiki("summarize")}
                  disabled={isGeneratingWiki}
                  className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm disabled:opacity-40"
                >
                  {isGeneratingWiki ? "생성 중..." : "summarize"}
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateWiki("rewrite")}
                  disabled={isGeneratingWiki}
                  className="rounded-sm border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800 shadow-sm disabled:opacity-40"
                >
                  {isGeneratingWiki ? "생성 중..." : "rewrite"}
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateWiki("structure")}
                  disabled={isGeneratingWiki}
                  className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 shadow-sm disabled:opacity-40"
                >
                  {isGeneratingWiki ? "생성 중..." : "structure"}
                </button>
              </div>
            </Panel>
          ) : null}
          <section className="rounded-sm border border-slate-200 bg-white p-8 shadow-sm">
            <Label>문서 본문</Label>
            {detail.writable && isEditing ? (
              <div className="space-y-4">
                <input
                  value={editorTitle}
                  onChange={(event) => setEditorTitle(event.target.value)}
                  className="w-full rounded-sm border border-slate-300 px-4 py-3 text-lg font-bold text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
                <textarea
                  value={editorBody}
                  onChange={(event) => setEditorBody(event.target.value)}
                  className="custom-scrollbar min-h-[360px] w-full rounded-sm border border-slate-300 px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditorTitle(detail.title ?? "");
                      setEditorBody(detail.bodyMarkdown ?? "");
                    }}
                    className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDocument}
                    disabled={isSaving || !editorTitle.trim()}
                    className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-40"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              <StructuredResponse
                text={
                  detail.bodyMarkdown ||
                  detail.summary ||
                  "표시할 문서 본문이 아직 없습니다."
                }
              />
            )}
          </section>
        </div>

        <div className="space-y-8 md:col-span-4">
          {detail.writable && detail.layer === "personal_wiki" ? (
            <Panel>
              <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
                wiki link actions
              </h3>
              <p className="mb-4 text-sm font-medium leading-relaxed text-slate-600">
                suggestion은 읽기 전용 preview이고, attach는 personal/wiki 문서 메타데이터에만 반영됩니다.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSuggestLinks}
                  disabled={isSuggestingLinks}
                  className="rounded-sm border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm disabled:opacity-40"
                >
                  {isSuggestingLinks ? "조회 중..." : "suggest links"}
                </button>
                <button
                  type="button"
                  onClick={handleAttachSuggestedLinks}
                  disabled={isAttachingLinks || linkSuggestions.length === 0}
                  className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm disabled:opacity-40"
                >
                  {isAttachingLinks ? "적용 중..." : "attach links"}
                </button>
              </div>
              {linkSuggestions.length ? (
                <div className="mt-4 space-y-2">
                  {linkSuggestions.map((item, index) => (
                    <div
                      key={`${item.layer}-${item.id}-${index}`}
                      className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      {item.layer}: {item.id}
                      {item.reason ? ` - ${item.reason}` : ""}
                    </div>
                  ))}
                </div>
              ) : null}
            </Panel>
          ) : null}
          {detail.writable ? (
            <Panel>
              <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
                asset registration
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1">Filename</Label>
                  <input
                    value={assetFilename}
                    onChange={(event) => setAssetFilename(event.target.value)}
                    placeholder="resume_v4.pdf"
                    className="w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-indigo-500"
                  />
                </div>
                <div>
                  <Label className="mb-1">Media Type</Label>
                  <input
                    value={assetMediaType}
                    onChange={(event) => setAssetMediaType(event.target.value)}
                    placeholder="application/pdf"
                    className="w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-indigo-500"
                  />
                </div>
                <div>
                  <Label className="mb-1">Storage Ref</Label>
                  <input
                    value={assetStorageRef}
                    onChange={(event) => setAssetStorageRef(event.target.value)}
                    placeholder="s3://jobs-wiki-assets/resume_v4.pdf"
                    className="w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRegisterAsset}
                  disabled={
                    isRegisteringAsset ||
                    !assetFilename.trim() ||
                    !assetMediaType.trim() ||
                    !assetStorageRef.trim()
                  }
                  className="w-full rounded-sm border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 disabled:opacity-40"
                >
                  <UploadCloud size={14} className="mr-2 inline-flex" />
                  {isRegisteringAsset ? "등록 중..." : "asset 등록 후 문서에 연결"}
                </button>
              </div>
            </Panel>
          ) : null}
          <Panel>
            <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
              문서 메타데이터
            </h3>
            <div className="space-y-4 text-sm font-medium text-slate-700">
              <div>
                <Label className="mb-1">Source</Label>
                <div>
                  {detail.metadata?.source?.provider ??
                    "출처 정보 없음"}
                </div>
              </div>
              <div>
                <Label className="mb-1">Updated</Label>
                <div>{updatedAt ?? "업데이트 시각 없음"}</div>
              </div>
              <div>
                <Label className="mb-1">Tags</Label>
                {tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div>표시할 태그가 없습니다.</div>
                )}
              </div>
              <div>
                <Label className="mb-1">Version</Label>
                <div>{detail.version ?? "버전 정보 없음"}</div>
              </div>
              <div>
                <Label className="mb-1">Asset Refs</Label>
                {assetRefs.length ? (
                  <div className="space-y-2">
                    {assetRefs.map((assetRef) => (
                      <div
                        key={assetRef}
                        className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        {assetRef}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>연결된 asset이 없습니다.</div>
                )}
              </div>
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
              연관 객체
            </h3>
            {detail.relatedObjects.length ? (
              <div className="space-y-3">
                {detail.relatedObjects.map((object) => (
                  <div
                    key={object.objectId}
                    className="rounded-sm border border-slate-200 bg-slate-50 p-4 shadow-sm"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      {object.objectKind}
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      {object.title ?? object.objectId}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm font-medium text-slate-500">
                연결된 객체가 아직 없습니다.
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

const ContextPanel = ({
  activeContext,
  profileSnapshot,
  isLoadingContext = false,
  contextError = null,
}) => {
  const profile = normalizeProfileSnapshot(profileSnapshot);
  const contextType = activeContext?.contextType ?? "workspace";

  return (
    <Panel>
      <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
        <Target size={16} className="mr-2 text-slate-500" />
        현재 분석 기준
      </h3>
      <div className="space-y-5">
        <div>
          <Label className="mb-1">기준 프로필</Label>
          <div className="flex items-center text-sm font-bold text-slate-800">
            {profile.targetRole}
            <span className="ml-2 font-semibold text-slate-500">
              ({profile.experience})
            </span>
          </div>
        </div>
        <div>
          <Label className="mb-1">현재 Ask 기준</Label>
          {contextType === "opportunity" ? (
            <div className="space-y-3 rounded-sm border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
              <div>
                <div className="mb-1 text-xs font-bold text-indigo-900">
                  {activeContext.company ?? "공고 컨텍스트"}
                </div>
                <div className="text-sm font-bold text-indigo-700">
                  {activeContext.title}
                </div>
              </div>
              {activeContext.summary ? (
                <p className="text-sm font-medium leading-relaxed text-indigo-950/80">
                  {activeContext.summary}
                </p>
              ) : null}
              {activeContext.deadline || activeContext.urgency ? (
                <div className="flex flex-wrap gap-3 text-[11px] font-bold text-indigo-800/70">
                  {activeContext.deadline ? <span>마감 {activeContext.deadline}</span> : null}
                  {activeContext.urgency ? <span>{activeContext.urgency}</span> : null}
                </div>
              ) : null}
            </div>
          ) : contextType === "document" ? (
            <div className="space-y-3 rounded-sm border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${getDocumentLayerBadgeClassName(activeContext.layer)}`}
                >
                  {formatDocumentLayerLabel(activeContext.layer)}
                </span>
                <span className="text-xs font-bold text-amber-900">
                  문서 컨텍스트
                </span>
              </div>
              <div className="text-sm font-bold text-amber-900">
                {activeContext.title}
              </div>
              <p className="text-sm font-medium leading-relaxed text-amber-950/80">
                {activeContext.summary ??
                  "현재 문서를 기준으로 답변, 근거, 연관 객체를 정리합니다."}
              </p>
            </div>
          ) : (
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-center text-sm font-bold text-slate-600">
              전체 워크스페이스 기반 분석 (지정 문서/공고 없음)
            </div>
          )}
          {isLoadingContext ? (
            <p className="mt-3 text-xs font-bold text-slate-500">
              현재 컨텍스트를 보강하는 중입니다.
            </p>
          ) : null}
          {contextError ? (
            <div className="mt-3 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 shadow-sm">
              {contextError.message}
            </div>
          ) : null}
        </div>
        <div>
          <Label className="mb-1">핵심 역량</Label>
          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
};

const AskActiveContextBanner = ({ activeContext }) => {
  if (!activeContext || activeContext.contextType === "workspace") {
    return null;
  }

  const isDocument = activeContext.contextType === "document";
  const badgeClassName = isDocument
    ? getDocumentLayerBadgeClassName(activeContext.layer)
    : "border-indigo-200 bg-indigo-50 text-indigo-700";

  return (
    <Panel
      className={
        isDocument ? "border-amber-200 bg-amber-50/50" : "border-indigo-200 bg-indigo-50/50"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Label className={isDocument ? "text-amber-700" : "text-indigo-700"}>
            active context
          </Label>
          <h3 className="text-lg font-bold text-slate-900">
            {activeContext.title}
          </h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
            {isDocument
              ? "현재 답변은 이 문서 projection을 기준으로 정리하며, shared와 personal 경계를 유지한 채 근거와 연관 객체를 함께 보여줍니다."
              : "현재 답변은 이 공고를 기준으로 정리하며, 근거와 연관 객체를 같은 컨텍스트 아래에서 묶어 보여줍니다."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-sm border px-2.5 py-1 text-[11px] font-bold shadow-sm ${badgeClassName}`}>
            {isDocument
              ? formatDocumentLayerLabel(activeContext.layer)
              : "opportunity"}
          </span>
          <span className="rounded-sm border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
            grounded answer
          </span>
        </div>
      </div>
    </Panel>
  );
};

function getEvidenceMeta(kind) {
  if (kind === "personal") {
    return {
      Icon: FileText,
      iconClassName: "text-indigo-600",
      badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
      label: "개인 자료",
    };
  }

  if (kind === "interpretation") {
    return {
      Icon: BarChart2,
      iconClassName: "text-amber-600",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      label: "해석",
    };
  }

  return {
    Icon: Briefcase,
    iconClassName: "text-emerald-600",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "사실",
  };
}

const EvidencePanel = ({ evidence }) => (
  <Panel className="flex flex-1 flex-col">
    <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
      <Database size={16} className="mr-2 text-slate-500" />
      현재 답변의 근거 자료
    </h3>
    <div className="custom-scrollbar max-h-[260px] flex-1 space-y-4 overflow-y-auto pr-2">
      {evidence && evidence.length > 0 ? (
        evidence.map((ev, index) => {
          const evidenceMeta = getEvidenceMeta(ev.kind);
          const { Icon } = evidenceMeta;

          return (
            <div
              key={ev.evidenceId ?? `${ev.label}-${index}`}
              className="rounded-sm border border-slate-200 bg-slate-50 p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center">
                  <Icon
                    size={14}
                    className={`mr-2 ${evidenceMeta.iconClassName}`}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {ev.label}
                  </span>
                </div>
                <span
                  className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${evidenceMeta.badgeClassName}`}
                >
                  {evidenceMeta.label}
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                {ev.excerpt || "직접 연결된 발췌문은 아직 없습니다."}
              </p>
              {ev.documentTitle || ev.provenance ? (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                  {ev.documentTitle ? <span>문서: {ev.documentTitle}</span> : null}
                  {ev.provenance ? <span>출처 버전: {ev.provenance}</span> : null}
                </div>
              ) : null}
            </div>
          );
        })
      ) : (
        <div className="p-4 text-center text-sm font-medium text-slate-500">
          현재 답변에 직접 연결된 근거가 없습니다.
        </div>
      )}
    </div>
  </Panel>
);

const RelatedOpportunitiesPanel = ({
  currentJob,
  relatedJobs,
  onOpenJob,
  onSwitch,
  isSwitching = false,
}) => {
  const visibleJobs = (relatedJobs ?? []).filter(
    (job) => job.opportunityId !== currentJob?.opportunityId,
  );

  if (visibleJobs.length === 0) {
    return null;
  }

  return (
    <Panel>
      <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
        <GitMerge size={16} className="mr-2 text-slate-500" />
        연관 추천 공고 비교
      </h3>
      <div className="space-y-4">
        {visibleJobs.map((job) => (
          <div
            key={job.opportunityId}
            className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-400"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <span className="text-xs font-bold text-slate-900">
                {job.company}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {job.matchScore ? `적합도 ${job.matchScore}` : job.urgency ?? "비교 가능"}
              </span>
            </div>
            <h4 className="mb-3 text-sm font-bold text-slate-800">
              {job.title}
            </h4>
            <p className="mb-4 text-xs font-medium leading-relaxed text-slate-600">
              {job.matchReason ?? job.summary ?? "연관 공고 설명이 아직 준비되지 않았습니다."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenJob(job)}
                className="rounded-sm border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
              >
                상세 보기
              </button>
              <button
                onClick={() => onSwitch(job)}
                disabled={isSwitching}
                className="rounded-sm border border-indigo-200 bg-indigo-50 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                이 공고로 다시 분석
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

const RelatedDocumentsPanel = ({
  currentDocument,
  relatedDocuments,
  onOpenDocument,
  onSwitch,
  isSwitching = false,
}) => {
  const visibleDocuments = (relatedDocuments ?? []).filter(
    (document) => document.documentId !== currentDocument?.documentId,
  );

  if (visibleDocuments.length === 0) {
    return null;
  }

  return (
    <Panel>
      <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
        <FileCode size={16} className="mr-2 text-slate-500" />
        연관 문서
      </h3>
      <div className="space-y-4">
        {visibleDocuments.map((document) => (
          <div
            key={document.documentId}
            className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-400"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-800">
                {document.title}
              </h4>
              <span
                className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${getDocumentLayerBadgeClassName(document.layer)}`}
              >
                {formatDocumentLayerLabel(document.layer)}
              </span>
            </div>
            <p className="mb-4 text-xs font-medium leading-relaxed text-slate-600">
              {document.summary ?? "연결된 문서 요약이 아직 준비되지 않았습니다."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenDocument(document)}
                className="rounded-sm border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
              >
                문서 열기
              </button>
              <button
                onClick={() => onSwitch(document)}
                disabled={isSwitching}
                className="rounded-sm border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                이 문서로 다시 분석
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

const FollowUpPanel = ({ hasJob, onSelect }) => (
  <Panel>
    <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
      <FileQuestion size={16} className="mr-2 text-slate-500" />
      후속 분석 제안
    </h3>
    <ul className="space-y-3">
      {hasJob && (
        <li
          onClick={() =>
            onSelect(
              "이 공고의 핵심 요구사항에 맞춰 내 이력서의 어떤 부분을 수정하면 좋을지 구체적인 방향을 제시해 줘.",
            )
          }
          className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white p-3.5 text-sm font-bold leading-relaxed text-slate-800 shadow-sm transition-colors hover:border-indigo-600 hover:shadow-md"
        >
          <MoveRight
            size={16}
            className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100"
          />
          이 공고 기준으로 이력서 수정 방향 보기
        </li>
      )}
      <li
        onClick={() =>
          onSelect(
            "현재 내 프로필에서 부족한 역량이 무엇인지 정리하고, 이를 보완할 수 있는 학습 방향을 제시해 줘.",
          )
        }
        className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white p-3.5 text-sm font-bold leading-relaxed text-slate-800 shadow-sm transition-colors hover:border-indigo-600 hover:shadow-md"
      >
        <MoveRight
          size={16}
          className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100"
        />
        부족한 역량만 따로 심층 분석하기
      </li>
      <li
        onClick={() =>
          onSelect("추천 공고들의 마감일과 적합도를 함께 고려해서 우선순위를 다시 정리해 줘.")
        }
        className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white p-3.5 text-sm font-bold leading-relaxed text-slate-800 shadow-sm transition-colors hover:border-indigo-600 hover:shadow-md"
      >
        <MoveRight
          size={16}
          className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100"
        />
        마감일 기준으로 지원 우선순위 다시 보기
      </li>
    </ul>
  </Panel>
);

function buildAskWelcomeText(activeContext) {
  if (activeContext?.contextType === "document") {
    return `**${activeContext.title}** 문서를 기준으로 심층 분석을 시작할 준비가 되었습니다. 질문을 보내면 현재 문서에 grounded된 답변과 함께 근거, 연관 문서, 연관 공고를 함께 보여줍니다.`;
  }

  if (activeContext?.contextType === "opportunity") {
    return `**${activeContext.company ?? "선택한 회사"}**의 **${activeContext.title}** 공고를 기준으로 심층 분석을 시작할 준비가 되었습니다. 질문을 보내면 실제 WAS 응답을 기준으로 답변, 근거, 연관 공고를 함께 보여줍니다.`;
  }

  return "현재 전체 프로필을 기준으로 심층 분석 워크스페이스가 활성화되었습니다. 특정 공고 없이도 지원 전략, 역량 보완, 우선순위 질문을 바로 보낼 수 있습니다.";
}

const AskWorkspaceView = ({
  activeContext,
  profileSnapshot,
  initialPrompt = "",
  onContextChange,
  onOpenJob,
  onOpenDocument,
}) => {
  const [contextState, setContextState] = useState(() => activeContext ?? null);
  const [contextError, setContextError] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [input, setInput] = useState(() => initialPrompt ?? "");
  const [submittedQuestion, setSubmittedQuestion] = useState(null);
  const [askResult, setAskResult] = useState(null);
  const [initialError, setInitialError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingContext, setIsSwitchingContext] = useState(false);
  const scrollRef = useRef(null);
  const requestIdRef = useRef(0);
  const contextRequestIdRef = useRef(0);

  useEffect(() => {
    setContextState(activeContext ?? null);
    setContextError(null);
  }, [activeContext]);

  useEffect(() => {
    const shouldHydrateOpportunity =
      contextState?.contextType === "opportunity" &&
      Boolean(contextState?.opportunityId) &&
      (!contextState?.company || !contextState?.summary);
    const shouldHydrateDocument =
      contextState?.contextType === "document" &&
      Boolean(contextState?.documentId) &&
      (!contextState?.layer || !contextState?.title);

    if (!shouldHydrateOpportunity && !shouldHydrateDocument) {
      setIsLoadingContext(false);
      return undefined;
    }

    const requestId = contextRequestIdRef.current + 1;
    contextRequestIdRef.current = requestId;
    setIsLoadingContext(true);

    const request = shouldHydrateDocument
      ? getDocumentDetail(contextState.documentId).then((response) => ({
          contextType: "document",
          ...mapDocumentResponse(response),
        }))
      : getOpportunityDetail(contextState.opportunityId).then((response) => ({
          contextType: "opportunity",
          ...mapDetailOpportunity(response),
        }));

    request
      .then((nextContext) => {
        if (requestId !== contextRequestIdRef.current) {
          return;
        }

        setContextState(nextContext);
        setContextError(null);
      })
      .catch((requestError) => {
        if (requestId !== contextRequestIdRef.current) {
          return;
        }

        const normalizedError =
          requestError instanceof WasClientError
            ? requestError
            : new WasClientError({
                message: shouldHydrateDocument
                  ? "선택한 문서 컨텍스트를 보강하지 못했습니다."
                  : "선택한 공고 컨텍스트를 보강하지 못했습니다.",
              });

        setContextError(normalizedError);
      })
      .finally(() => {
        if (requestId === contextRequestIdRef.current) {
          setIsLoadingContext(false);
        }
      });

    return () => {
      contextRequestIdRef.current += 1;
    };
  }, [contextState]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [askResult, initialError, isSubmitting]);

  const submitQuestion = async (
    rawQuestion,
    { contextOverride = contextState, switchingContext = false } = {},
  ) => {
    const normalizedQuestion = rawQuestion.trim();

    if (!normalizedQuestion || isSubmitting) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const hadVisibleResult = Boolean(askResult);

    setSubmittedQuestion(normalizedQuestion);
    setInput("");
    setInitialError(null);
    setSubmitError(null);
    setIsSubmitting(true);
    setIsSwitchingContext(switchingContext);

    try {
      const response = await askWorkspace({
        question: normalizedQuestion,
        opportunityId:
          contextOverride?.contextType === "opportunity"
            ? contextOverride.opportunityId
            : undefined,
        documentId:
          contextOverride?.contextType === "document"
            ? contextOverride.documentId
            : undefined,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      const nextAskResult = mapAskResponse(response);

      setAskResult(nextAskResult);
      if (nextAskResult.activeContext) {
        setContextState(nextAskResult.activeContext);
        onContextChange(nextAskResult.activeContext);
      }
      setInitialError(null);
      setSubmitError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const normalizedError =
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "Ask 응답을 불러오지 못했습니다.",
            });

      if (hadVisibleResult) {
        setSubmitError(normalizedError);
      } else {
        setInitialError(normalizedError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSubmitting(false);
        setIsSwitchingContext(false);
      }
    }
  };

  const handleSend = (overrideText = null) => {
    const nextQuestion = (overrideText ?? input).trim();
    submitQuestion(nextQuestion);
  };

  const handleRetry = () => {
    if (!submittedQuestion) {
      return;
    }

    submitQuestion(submittedQuestion, {
      contextOverride: contextState,
      switchingContext: false,
    });
  };

  const handleSwitchContext = (context) => {
    const nextContext =
      context?.documentId != null
        ? { contextType: "document", ...normalizeDocumentContext(context) }
        : context?.opportunityId != null
          ? { contextType: "opportunity", ...normalizeOpportunityContext(context) }
          : null;

    if (!nextContext) {
      return;
    }

    setContextState(nextContext);
    setContextError(null);
    onContextChange(nextContext);

    if (submittedQuestion) {
      submitQuestion(submittedQuestion, {
        contextOverride: nextContext,
        switchingContext: true,
      });
      return;
    }

    setAskResult(null);
    setInitialError(null);
    setSubmitError(null);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const currentEvidence = askResult?.evidence ?? [];
  const relatedJobs = askResult?.relatedOpportunities ?? [];
  const relatedDocuments = askResult?.relatedDocuments ?? [];
  const currentSync = askResult?.sync ?? null;
  const generatedAt = formatKoreanDateTime(askResult?.generatedAt);

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-[1400px] flex-col gap-8 animate-in fade-in lg:flex-row">
      <div className="min-w-[600px] flex-1 overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              메인 분석 패널
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              실제 WAS Ask projection을 기준으로 답변, 근거, 연관 문서와 공고를 함께 읽습니다.
            </p>
          </div>
          {generatedAt ? (
            <div className="text-right text-xs font-bold text-slate-500">
              마지막 응답
              <div className="mt-1 text-sm text-slate-700">{generatedAt}</div>
            </div>
          ) : null}
        </div>

        <div
          className="custom-scrollbar h-[calc(100%-150px)] overflow-y-auto bg-white p-10"
          ref={scrollRef}
        >
          <div className="mx-auto max-w-3xl space-y-8">
            <SyncNotice
              surface="ask"
              sync={currentSync}
              refreshError={submitError}
              onRetry={
                submittedQuestion
                  ? () => submitQuestion(submittedQuestion)
                  : undefined
              }
              isRetrying={isSubmitting}
            />
            <AskActiveContextBanner activeContext={contextState} />

            {isSwitchingContext ? (
              <InlineNotice
                title="새 컨텍스트로 같은 질문을 다시 분석하는 중입니다"
                message="현재 화면은 유지하고, 새 기준의 답변이 준비되면 갱신합니다."
                className="border-sky-200 bg-sky-50 text-sky-900"
              />
            ) : null}

            {submittedQuestion ? (
              <div className="border-b border-slate-100 pb-8">
                <Label className="mb-3 text-indigo-600">분석 요청 사항</Label>
                <div className="whitespace-pre-wrap text-xl font-bold leading-relaxed text-slate-900">
                  {submittedQuestion}
                </div>
              </div>
            ) : (
              <Panel className="border-dashed bg-slate-50">
                <Label className="mb-3 text-indigo-600">Welcome</Label>
                <StructuredResponse text={buildAskWelcomeText(contextState)} />
              </Panel>
            )}

            {askResult ? (
              <div className="pb-6">
                <Label className="mb-4 text-slate-500">분석 결과 종합</Label>
                <StructuredResponse text={askResult.answerText} />
              </div>
            ) : null}

            {initialError && !askResult ? (
              <RetryPanel
                title="Ask 응답을 불러오지 못했습니다"
                message={initialError.message}
                onRetry={handleRetry}
              />
            ) : null}

            {isSubmitting ? (
              <div className="border-t border-slate-100 pt-4">
                <Label className="mb-4 flex items-center text-indigo-600">
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  구조화된 답변을 생성하는 중입니다...
                </Label>
                <div className="max-w-2xl space-y-4">
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-4/6 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-6">
          <div className="relative mx-auto flex max-w-3xl items-center rounded-sm border border-slate-300 bg-white shadow-sm transition-all focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
            <div className="pl-4 text-slate-400">
              <Search size={20} />
            </div>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="연구 주제 또는 추가 분석 요청을 입력해 주세요..."
              className="custom-scrollbar h-14 w-full resize-none overflow-hidden bg-transparent py-4 pl-3 pr-16 text-sm font-bold text-slate-800 outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={isSubmitting || !input.trim()}
              className="absolute right-2 rounded-sm bg-slate-900 p-2 text-white transition-colors hover:bg-slate-800 disabled:opacity-30"
            >
              <MoveRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex w-[420px] flex-shrink-0 flex-col gap-6 overflow-y-auto pr-2 pb-8">
        <ContextPanel
          activeContext={contextState}
          profileSnapshot={profileSnapshot}
          isLoadingContext={isLoadingContext}
          contextError={contextError}
        />
        <EvidencePanel evidence={currentEvidence} />
        <RelatedDocumentsPanel
          currentDocument={
            contextState?.contextType === "document" ? contextState : null
          }
          relatedDocuments={relatedDocuments}
          onOpenDocument={onOpenDocument}
          onSwitch={handleSwitchContext}
          isSwitching={isSwitchingContext}
        />
        <RelatedOpportunitiesPanel
          currentJob={
            contextState?.contextType === "opportunity" ? contextState : null
          }
          relatedJobs={relatedJobs}
          onOpenJob={onOpenJob}
          onSwitch={handleSwitchContext}
          isSwitching={isSwitchingContext}
        />
        <FollowUpPanel
          hasJob={contextState?.contextType === "opportunity"}
          onSelect={handleSend}
        />
      </div>
    </div>
  );
};

function getMonthStart(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function shiftMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

const CalendarLoadingView = () => (
  <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
    <div className="flex items-end justify-between border-b border-slate-200 pb-6">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-100" />
      </div>
      <div className="h-12 w-52 rounded bg-slate-200" />
    </div>
    <div className="h-[520px] rounded-sm border border-slate-200 bg-white" />
  </div>
);

const CalendarView = ({ onOpenJob, onOpenReport, onOpenAsk }) => {
  const [viewMode, setViewMode] = useState("list");
  const [calendarResponse, setCalendarResponse] = useState(null);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getMonthStart());
  const requestIdRef = useRef(0);

  const loadCalendar = async ({ preserveData = false } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (preserveData) {
      setIsRefreshing(true);
      setRefreshError(null);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await getCalendar();

      if (requestId !== requestIdRef.current) {
        return;
      }

      setCalendarResponse(response);
      setError(null);
      setRefreshError(null);

      const firstItem = response.items
        .map((item) => new Date(item.startsAt))
        .filter((item) => !Number.isNaN(item.getTime()))
        .sort((left, right) => left - right)[0];

      if (firstItem) {
        setCurrentMonth(getMonthStart(firstItem));
      }
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const normalizedError =
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "캘린더 데이터를 불러오지 못했습니다.",
            });

      if (preserveData) {
        setRefreshError(normalizedError);
      } else {
        setError(normalizedError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadCalendar();

    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  if (isLoading && !calendarResponse) {
    return <CalendarLoadingView />;
  }

  if (error && !calendarResponse) {
    return (
      <RetryPanel
        title="캘린더를 불러오지 못했습니다"
        message={error.message}
        onRetry={() => loadCalendar()}
      />
    );
  }

  const items = calendarResponse.items
    .map(mapCalendarItem)
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  const syncMeta = getSyncMeta(calendarResponse.sync);
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOffset = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const blanks = Array.from({ length: firstDayOffset }, (_, index) => index);
  const totalCells = days.length + blanks.length;
  const paddingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const monthlyItems = items.filter((item) => {
    const date = new Date(item.startsAt);

    return (
      date.getFullYear() === currentMonth.getFullYear() &&
      date.getMonth() === currentMonth.getMonth()
    );
  });
  const buildCalendarOpportunityContext = (item) => ({
    opportunityId: item.opportunityId,
    title: item.title,
    company: item.company,
    deadline: formatKoreanDate(item.startsAt),
    urgency: item.urgencyLabel,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-12 animate-in fade-in">
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            주요 채용 일정 관리
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            실제 WAS calendar projection을 기준으로 마감일과 공고 이동을
            확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncMeta?.badgeLabel ? (
            <div
              className={`rounded-sm border px-3 py-1.5 text-xs font-bold shadow-sm ${syncMeta.badgeClassName}`}
            >
              {syncMeta.badgeLabel}
            </div>
          ) : null}
          <button
            onClick={() => loadCalendar({ preserveData: Boolean(calendarResponse) })}
            disabled={isRefreshing}
            className="flex items-center rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            새로고침
          </button>
          <div className="flex rounded-sm border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center px-4 py-2 transition-all ${
                viewMode === "list"
                  ? "rounded-sm bg-white font-bold text-slate-900 shadow-sm"
                  : "font-medium text-slate-500 hover:text-slate-700"
              }`}
            >
              <List size={16} className="mr-2" />
              <span className="text-sm">타임라인</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center px-4 py-2 transition-all ${
                viewMode === "calendar"
                  ? "rounded-sm bg-white font-bold text-slate-900 shadow-sm"
                  : "font-medium text-slate-500 hover:text-slate-700"
              }`}
            >
              <Grid size={16} className="mr-2" />
              <span className="text-sm">캘린더</span>
            </button>
          </div>
        </div>
      </header>

      <SyncNotice
        surface="calendar"
        sync={calendarResponse.sync}
        refreshError={refreshError}
        onRetry={() => loadCalendar({ preserveData: Boolean(calendarResponse) })}
        isRetrying={isRefreshing}
      />

      <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
        {viewMode === "list" ? (
          items.length ? (
            <div className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <div
                  key={item.calendarItemId}
                  className="group flex flex-wrap items-center gap-6 p-8 transition-colors hover:bg-slate-50"
                >
                  <div className="w-32 flex-shrink-0 border-r border-slate-200 pr-8 text-center">
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                      마감일
                    </div>
                    <div className="text-3xl font-extrabold tracking-tighter text-slate-900">
                      {formatMonthDay(item.startsAt)}
                    </div>
                    <div
                      className={`mt-2 inline-block rounded-sm px-2 py-0.5 text-xs font-bold ${
                        index === 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.urgencyLabel ?? "-"}
                    </div>
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <h3 className="mb-2 text-xl font-bold text-slate-900">
                      {item.company}
                    </h3>
                    <p className="text-base font-medium text-slate-600">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => onOpenJob(buildCalendarOpportunityContext(item))}
                      disabled={!item.deepLinkEnabled}
                      className="rounded-sm border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      상세 보기
                    </button>
                    <button
                      onClick={() =>
                        onOpenAsk(buildCalendarOpportunityContext(item), {
                          prefillQuestion:
                            "이 공고의 마감 시점과 적합도를 같이 고려해서 지금 준비해야 할 우선순위를 정리해 줘.",
                        })
                      }
                      disabled={!item.deepLinkEnabled}
                      className="rounded-sm border border-indigo-200 bg-indigo-50 px-6 py-3 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Ask에서 분석
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10">
              <InlineNotice
                title="선택 기간에 일정이 없습니다"
                message="캘린더 자체는 유지하고 있습니다. 다른 기간으로 이동하거나 기본 리포트에서 다른 공고를 다시 확인해 보세요."
                className="border-slate-200 bg-slate-50 text-slate-900"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
                  className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm"
                >
                  다음 기간 보기
                </button>
                <button
                  onClick={onOpenReport}
                  className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
                >
                  기본 리포트로 돌아가기
                </button>
              </div>
            </div>
          )
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {formatMonthLabel(currentMonth)}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
                  className="rounded-sm border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <button
                  onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
                  className="rounded-sm border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            {monthlyItems.length === 0 ? (
              <div className="border-b border-slate-200 p-6">
                <InlineNotice
                  title="이 달에는 표시할 일정이 없습니다"
                  message="캘린더는 유지하되, 다른 달로 이동해 일정을 계속 탐색할 수 있습니다."
                  className="border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>
            ) : null}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-white text-center text-xs font-bold uppercase tracking-widest text-slate-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className={`py-4 ${day === "Sun" ? "text-red-500" : ""}`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px border-l border-slate-200 bg-slate-200">
              {blanks.map((blank) => (
                <div
                  key={`blank-${blank}`}
                  className="min-h-[160px] bg-slate-50 p-3"
                />
              ))}
              {days.map((day) => {
                const cellItems = monthlyItems.filter((item) => {
                  const date = new Date(item.startsAt);
                  return date.getDate() === day;
                });
                const today = new Date();
                const isToday =
                  currentMonth.getFullYear() === today.getFullYear() &&
                  currentMonth.getMonth() === today.getMonth() &&
                  day === today.getDate();

                return (
                  <div
                    key={day}
                    className="min-h-[160px] bg-white p-4 transition-colors hover:bg-slate-50"
                  >
                    <div
                      className={`mb-3 text-sm font-bold ${
                        isToday
                          ? "flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-2">
                      {cellItems.map((item) => (
                        <button
                          key={item.calendarItemId}
                          onClick={() =>
                            onOpenJob({
                              opportunityId: item.opportunityId,
                              title: item.title,
                              company: item.company,
                              deadline: formatKoreanDate(item.startsAt),
                              urgency: item.urgencyLabel,
                            })
                          }
                          disabled={!item.deepLinkEnabled}
                          className="w-full truncate rounded-sm border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-left text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:border-indigo-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {item.company} 마감
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: paddingCells }).map((_, index) => (
                <div
                  key={`pad-${index}`}
                  className="min-h-[160px] bg-slate-50 p-3"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function JobsWikiPrototype() {
  const [currentRoute, setCurrentRoute] = useState(() =>
    typeof window === "undefined"
      ? { view: "onboarding", opportunityId: null, documentId: null }
      : readAppRoute(window.location),
  );
  const [activeOpportunityContext, setActiveOpportunityContext] = useState(() =>
    typeof window === "undefined" || !readAppRoute(window.location).opportunityId
      ? null
      : createRouteOpportunityContext(readAppRoute(window.location).opportunityId),
  );
  const [activeDocumentContext, setActiveDocumentContext] = useState(() =>
    typeof window === "undefined" || !readAppRoute(window.location).documentId
      ? null
      : createRouteDocumentContext(readAppRoute(window.location).documentId),
  );
  const [askComposerSeed, setAskComposerSeed] = useState("");
  const [shellProfileSnapshot, setShellProfileSnapshot] = useState(() =>
    normalizeProfileSnapshot(),
  );
  const [workspaceNavigation, setWorkspaceNavigation] = useState(() =>
    mapWorkspaceNavigationResponse(null),
  );
  const [workspaceNavigationError, setWorkspaceNavigationError] = useState(null);
  const [isLoadingWorkspaceNavigation, setIsLoadingWorkspaceNavigation] =
    useState(true);
  const [workspaceSyncState, setWorkspaceSyncState] = useState(() =>
    mapWorkspaceSyncResponse(null),
  );
  const [workspaceSyncError, setWorkspaceSyncError] = useState(null);
  const [isLoadingWorkspaceSync, setIsLoadingWorkspaceSync] = useState(true);
  const [isRefreshingWorkspaceSync, setIsRefreshingWorkspaceSync] = useState(false);
  const [isTriggeringWorkspaceSync, setIsTriggeringWorkspaceSync] = useState(false);
  const [activeWorkspaceCommandId, setActiveWorkspaceCommandId] = useState(null);
  const [createDocumentLayer, setCreateDocumentLayer] = useState(null);
  const [createDocumentError, setCreateDocumentError] = useState(null);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const workspaceRequestIdRef = useRef(0);
  const syncRequestIdRef = useRef(0);
  const currentView = currentRoute.view;
  const currentPath = buildAppPath(
    currentRoute.view,
    currentRoute.opportunityId,
    currentRoute.documentId,
  );
  const displayProfileSnapshot = normalizeProfileSnapshot(shellProfileSnapshot);
  const latestWorkspaceCommand = workspaceSyncState.command ?? null;
  const activeShellContext = buildWorkspaceActiveContext({
    currentView,
    currentPath,
    currentDocumentId: currentRoute.documentId,
    activeOpportunityContext,
    activeDocumentContext,
    workspaceNavigation,
  });

  const loadWorkspaceNavigation = async () => {
    const requestId = workspaceRequestIdRef.current + 1;
    workspaceRequestIdRef.current = requestId;
    setIsLoadingWorkspaceNavigation(true);
    setWorkspaceNavigationError(null);

    try {
      const response = await getWorkspace();

      if (requestId !== workspaceRequestIdRef.current) {
        return;
      }

      setWorkspaceNavigation(mapWorkspaceNavigationResponse(response));
      setWorkspaceNavigationError(null);
    } catch (requestError) {
      if (requestId !== workspaceRequestIdRef.current) {
        return;
      }

      const normalizedError =
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "workspace navigation을 불러오지 못했습니다.",
            });

      setWorkspaceNavigationError(normalizedError);
    } finally {
      if (requestId === workspaceRequestIdRef.current) {
        setIsLoadingWorkspaceNavigation(false);
      }
    }
  };

  const loadWorkspaceSync = async ({
    commandId = activeWorkspaceCommandId,
    preserveData = false,
  } = {}) => {
    const requestId = syncRequestIdRef.current + 1;
    syncRequestIdRef.current = requestId;

    if (preserveData) {
      setIsRefreshingWorkspaceSync(true);
      setWorkspaceSyncError(null);
    } else {
      setIsLoadingWorkspaceSync(true);
      setWorkspaceSyncError(null);
    }

    try {
      const response = await getWorkspaceSync(
        commandId ? { commandId } : undefined,
      );

      if (requestId !== syncRequestIdRef.current) {
        return;
      }

      setWorkspaceSyncState(mapWorkspaceSyncResponse(response));
      setWorkspaceSyncError(null);
    } catch (requestError) {
      if (requestId !== syncRequestIdRef.current) {
        return;
      }

      const normalizedError =
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "workspace sync 상태를 불러오지 못했습니다.",
            });

      setWorkspaceSyncError(normalizedError);
    } finally {
      if (requestId === syncRequestIdRef.current) {
        setIsLoadingWorkspaceSync(false);
        setIsRefreshingWorkspaceSync(false);
      }
    }
  };

  const handleTriggerWorkspaceIngestion = async () => {
    setIsTriggeringWorkspaceSync(true);
    setWorkspaceSyncError(null);

    try {
      const response = await triggerWorknetIngestion(DEFAULT_INGESTION_SOURCE_ID);
      const acceptedState = mapAcceptedWorkspaceCommandResponse(response);
      const commandId =
        acceptedState.command?.commandId ??
        response.commandId ??
        createCommandAttemptKey(DEFAULT_INGESTION_SOURCE_ID);

      setWorkspaceSyncState((current) => ({
        command:
          acceptedState.command ??
          mapWorkspaceCommand({
            commandId,
            status: "accepted",
            acceptedAt: new Date().toISOString(),
          }) ??
          current.command,
        projections:
          acceptedState.projections.length
            ? acceptedState.projections
            : current.projections,
      }));
      setActiveWorkspaceCommandId(commandId);

      await loadWorkspaceSync({
        commandId,
        preserveData: true,
      });
    } catch (requestError) {
      const normalizedError =
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "WorkNet 수동 갱신 요청에 실패했습니다.",
            });

      setWorkspaceSyncError(normalizedError);
    } finally {
      setIsTriggeringWorkspaceSync(false);
    }
  };

  const navigateToPath = (path, { replace = false } = {}) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = new URL(path, window.location.origin);
    const nextRoute = readAppRoute(nextUrl);
    const nextLocation = `${nextUrl.pathname}${nextUrl.search}`;
    const currentLocation = `${window.location.pathname}${window.location.search}`;

    setAskComposerSeed("");
    setCurrentRoute(nextRoute);

    if (currentLocation === nextLocation) {
      return;
    }

    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", nextLocation);
  };

  const handleOpenCreatePersonalDocument = (layer) => {
    setCreateDocumentLayer(layer);
    setCreateDocumentError(null);
  };

  const handleCreatePersonalDocument = async ({ layer, title, bodyMarkdown }) => {
    setIsCreatingDocument(true);
    setCreateDocumentError(null);

    try {
      const response = await createDocument({
        layer,
        title,
        bodyMarkdown,
        kind: "note",
      });
      await loadWorkspaceNavigation();
      const createdDocumentId = response.item?.documentRef?.objectId ?? null;

      if (createdDocumentId) {
        navigateToPath(`/documents/${encodeURIComponent(createdDocumentId)}`);
      }

      setCreateDocumentLayer(null);
    } catch (requestError) {
      setCreateDocumentError(
        requestError instanceof WasClientError
          ? requestError
          : new WasClientError({
              message: "문서를 생성하지 못했습니다.",
            }),
      );
    } finally {
      setIsCreatingDocument(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = readAppRoute(window.location);
      setCurrentRoute(nextRoute);
      setAskComposerSeed("");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    getWorkspaceSummary()
      .then((response) => {
        if (!isSubscribed) {
          return;
        }

        setShellProfileSnapshot(normalizeProfileSnapshot(response.profileSnapshot));
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    loadWorkspaceNavigation();

    return () => {
      workspaceRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    loadWorkspaceSync();

    return () => {
      syncRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!activeWorkspaceCommandId) {
      return undefined;
    }

    let isCancelled = false;

    const poll = async () => {
      try {
        const response = await getWorkspaceSync({
          commandId: activeWorkspaceCommandId,
        });

        if (isCancelled) {
          return;
        }

        const normalized = mapWorkspaceSyncResponse(response);
        setWorkspaceSyncState(normalized);
        setWorkspaceSyncError(null);

        if (isTerminalCommandStatus(normalized.command?.status)) {
          setActiveWorkspaceCommandId(null);
          const readSideResponse = await getWorkspaceSync();

          if (!isCancelled) {
            setWorkspaceSyncState(mapWorkspaceSyncResponse(readSideResponse));
          }
        }
      } catch (requestError) {
        if (!isCancelled) {
          const normalizedError =
            requestError instanceof WasClientError
              ? requestError
              : new WasClientError({
                  message: "command 상태를 갱신하지 못했습니다.",
                });

          setWorkspaceSyncError(normalizedError);
        }
      }
    };

    poll();
    const intervalId = window.setInterval(poll, 4000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeWorkspaceCommandId]);

  useEffect(() => {
    if (currentView === "ask") {
      if (currentRoute.documentId) {
        setActiveDocumentContext((current) =>
          current?.documentId === currentRoute.documentId
            ? current
            : createRouteDocumentContext(currentRoute.documentId),
        );
        setActiveOpportunityContext(null);
        return;
      }

      if (!currentRoute.opportunityId) {
        setActiveOpportunityContext(null);
        setActiveDocumentContext(null);
        return;
      }

      setActiveOpportunityContext((current) =>
        current?.opportunityId === currentRoute.opportunityId
          ? current
          : createRouteOpportunityContext(currentRoute.opportunityId),
      );
      setActiveDocumentContext(null);
      return;
    }

    if (currentView === "detail" && currentRoute.opportunityId) {
      setActiveOpportunityContext((current) =>
        current?.opportunityId === currentRoute.opportunityId
          ? current
          : createRouteOpportunityContext(currentRoute.opportunityId),
      );
      setActiveDocumentContext(null);
    }

    if (currentView === "document" && currentRoute.documentId) {
      setActiveDocumentContext((current) =>
        current?.documentId === currentRoute.documentId
          ? current
          : createRouteDocumentContext(currentRoute.documentId),
      );
      setActiveOpportunityContext(null);
    }
  }, [currentRoute.documentId, currentRoute.opportunityId, currentView]);

  const navigateTo = (view, context = undefined, options = {}) => {
    const normalizedOpportunityContext =
      view === "ask" || view === "detail"
        ? context === undefined
          ? undefined
          : normalizeOpportunityContext(context)
        : undefined;
    const normalizedDocumentContext =
      view === "ask" || view === "document"
        ? context === undefined
          ? undefined
          : normalizeDocumentContext(context)
        : undefined;
    const nextRoute = {
      view,
      opportunityId:
        view === "ask" || view === "detail"
          ? normalizedDocumentContext?.documentId
            ? null
            : normalizedOpportunityContext?.opportunityId ?? null
          : null,
      documentId:
        view === "ask" || view === "document"
          ? normalizedDocumentContext?.documentId ?? null
          : null,
    };

    if (context !== undefined) {
      if (view === "ask" && !normalizedOpportunityContext && !normalizedDocumentContext) {
        setActiveOpportunityContext(null);
        setActiveDocumentContext(null);
      } else if (normalizedOpportunityContext) {
        setActiveOpportunityContext(normalizedOpportunityContext);
        setActiveDocumentContext(null);
      } else if (normalizedDocumentContext) {
        setActiveDocumentContext(normalizedDocumentContext);
        setActiveOpportunityContext(null);
      } else if (view === "detail") {
        setActiveDocumentContext(null);
      } else if (view === "document") {
        setActiveOpportunityContext(null);
      }
    }

    setAskComposerSeed(view === "ask" ? options.prefillQuestion ?? "" : "");
    setCurrentRoute(nextRoute);
    writeAppRoute(nextRoute, { replace: options.replace ?? false });
  };

  const openJobDetail = (job) => navigateTo("detail", job);
  const openDocument = (document) => navigateTo("document", document);
  const openAsk = (context = null, options = {}) =>
    navigateTo("ask", context, options);

  const renderMainContent = () => {
    switch (currentView) {
      case "workspace":
        return (
          <WorkspaceHomeView
            profileSnapshot={displayProfileSnapshot}
            syncState={workspaceSyncState}
            latestCommand={latestWorkspaceCommand}
            syncError={workspaceSyncError}
            isRefreshingSync={isRefreshingWorkspaceSync}
          />
        );
      case "report":
        return (
          <BaselineReportView
            onJobClick={openJobDetail}
            onOpenAsk={openAsk}
            onOpenCalendar={() => navigateTo("calendar")}
            onEditProfile={() => navigateTo("onboarding")}
          />
        );
      case "detail":
        return (
          <OpportunityDetailView
            opportunityContext={activeOpportunityContext}
            onBack={() => navigateTo("workspace")}
            onOpenAsk={openAsk}
          />
        );
      case "document":
        return (
          <DocumentDetailView
            documentId={currentRoute.documentId}
            onBack={() => navigateTo("workspace")}
            onOpenAsk={openAsk}
            onOpenDocument={openDocument}
            onWorkspaceChanged={loadWorkspaceNavigation}
          />
        );
      case "ask":
        return (
          <AskWorkspaceView
            activeContext={
              activeDocumentContext
                ? { contextType: "document", ...activeDocumentContext }
                : activeOpportunityContext
                  ? { contextType: "opportunity", ...activeOpportunityContext }
                  : null
            }
            profileSnapshot={displayProfileSnapshot}
            initialPrompt={askComposerSeed}
            onContextChange={(context) => navigateTo("ask", context)}
            onOpenJob={openJobDetail}
            onOpenDocument={openDocument}
          />
        );
      case "calendar":
        return (
          <CalendarView
            onOpenJob={openJobDetail}
            onOpenReport={() => navigateTo("workspace")}
            onOpenAsk={openAsk}
          />
        );
      default:
        return (
          <WorkspaceHomeView
            profileSnapshot={displayProfileSnapshot}
            syncState={workspaceSyncState}
            latestCommand={latestWorkspaceCommand}
            syncError={workspaceSyncError}
            isRefreshingSync={isRefreshingWorkspaceSync}
          />
        );
    }
  };

  if (["onboarding", "extraction"].includes(currentView)) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
          <div className="flex items-center text-2xl font-bold tracking-tighter text-slate-900">
            <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm bg-slate-900 text-sm font-bold text-white">
              JW
            </span>
            Jobs-Wiki
            <span className="ml-4 border-l-2 border-slate-200 pl-4 text-base font-semibold text-slate-500">
              커리어 초기화
            </span>
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-81px)] items-center justify-center p-8 md:p-16">
          {currentView === "onboarding" && (
            <OnboardingView onNext={() => navigateTo("extraction")} />
          )}
          {currentView === "extraction" && (
            <ExtractionReviewView onNext={() => navigateTo("workspace")} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
        <div className="mb-4 border-b border-slate-800/50 px-6 py-8">
          <button
            onClick={() => navigateTo("workspace")}
            className="flex items-center text-2xl font-extrabold tracking-tighter text-white transition-colors hover:text-indigo-200"
          >
            <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-sm bg-indigo-600 text-xs font-bold text-white shadow-sm">
              JW
            </span>
            Jobs-Wiki
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          <div className="mt-4 px-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Workspace
            </div>
            <div className="mt-1 text-sm font-bold text-white">
              layered navigation shell
            </div>
          </div>

          <button
            onClick={() => navigateTo("workspace")}
            className={`w-full rounded-sm px-4 py-3 text-left text-sm font-bold transition-all ${
              currentView === "workspace"
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex items-center">
              <Grid size={18} className="mr-3 opacity-90" />
              워크스페이스 홈
            </span>
          </button>
          <button
            onClick={() => navigateTo("report")}
            className={`w-full rounded-sm px-4 py-3 text-left text-sm font-bold transition-all ${
              currentView === "report"
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex items-center">
              <FileText size={18} className="mr-3 opacity-90" />
              리포트 프로젝션
            </span>
          </button>

          {isLoadingWorkspaceNavigation && !workspaceNavigation.sections.length ? (
            <div className="space-y-3 px-3">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
              <div className="h-16 animate-pulse rounded-sm bg-slate-800" />
              <div className="h-16 animate-pulse rounded-sm bg-slate-800" />
              <div className="h-16 animate-pulse rounded-sm bg-slate-800" />
            </div>
          ) : null}

          {workspaceNavigationError && !workspaceNavigation.sections.length ? (
            <div className="rounded-sm border border-amber-300/30 bg-amber-400/10 px-3 py-3 text-xs font-medium leading-relaxed text-amber-100">
              {workspaceNavigationError.message}
            </div>
          ) : null}

          {workspaceNavigation.sections.map((section) => (
            <WorkspaceNavigationSection
              key={section.sectionId}
              section={section}
              currentPath={currentPath}
              onNavigatePath={navigateToPath}
              onCreatePersonalDocument={handleOpenCreatePersonalDocument}
            />
          ))}

        </nav>

        <div className="border-t border-slate-800/50 bg-slate-900/50 p-5">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
              {displayProfileSnapshot.targetRole.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-white">
                {displayProfileSnapshot.targetRole}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                {displayProfileSnapshot.experience}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <CreatePersonalDocumentModal
        layer={createDocumentLayer}
        isSubmitting={isCreatingDocument}
        error={createDocumentError}
        onClose={() => {
          if (!isCreatingDocument) {
            setCreateDocumentLayer(null);
            setCreateDocumentError(null);
          }
        }}
        onSubmit={handleCreatePersonalDocument}
      />

      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-100/50">
        <div className="p-8 md:p-10 lg:p-12">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #cbd5e1;
              border-radius: 10px;
            }
          `}</style>
          <WorkspaceActiveContextCard
            context={activeShellContext}
            onOpenWorkspace={() => navigateTo("workspace")}
            onOpenAsk={() =>
              openAsk(
                currentView === "detail"
                  ? activeOpportunityContext
                  : currentView === "document"
                    ? activeDocumentContext
                    : currentView === "ask"
                      ? activeDocumentContext ?? activeOpportunityContext
                      : null,
              )
            }
          />
          {renderMainContent()}
        </div>
      </main>

      <aside className="flex w-72 flex-shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto">
        <div className="border-b border-slate-100 px-5 py-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Actions
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-slate-100 px-4 py-4">
            <button
              onClick={() => openAsk(activeDocumentContext ?? activeOpportunityContext)}
              className={`w-full rounded-sm border px-3 py-2.5 text-left text-sm font-bold transition-all ${
                currentView === "ask"
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-900"
              }`}
            >
              <span className="flex items-center">
                <Search size={15} className="mr-2 opacity-80" />
                심층 분석 워크스페이스
              </span>
            </button>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Sync
            </div>
            {workspaceSyncState.command?.commandId ? (
              <div className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  {(() => {
                    const meta = getCommandStatusMeta(workspaceSyncState.command.status);
                    return meta ? (
                      <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
            ) : null}
            {(workspaceSyncState.projections ?? []).map((p) => {
              const meta = getSyncMeta(p);
              return (
                <div key={p.projection} className="flex items-center justify-between rounded-sm border border-slate-100 px-3 py-2">
                  <span className="text-xs font-bold text-slate-700">{formatProjectionLabel(p.projection)}</span>
                  {meta?.badgeLabel ? (
                    <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${meta.badgeClassName}`}>
                      {meta.badgeLabel}
                    </span>
                  ) : null}
                </div>
              );
            })}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => loadWorkspaceSync({ preserveData: true })}
                disabled={isRefreshingWorkspaceSync}
                className="flex flex-1 items-center justify-center rounded-sm border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={13} className={`mr-1.5 ${isRefreshingWorkspaceSync ? "animate-spin" : ""}`} />
                새로고침
              </button>
              <button
                onClick={handleTriggerWorkspaceIngestion}
                disabled={isTriggeringWorkspaceSync || Boolean(activeWorkspaceCommandId)}
                className="flex flex-1 items-center justify-center rounded-sm border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
              >
                <Zap size={13} className="mr-1.5" />
                {isTriggeringWorkspaceSync ? "요청 중..." : Boolean(activeWorkspaceCommandId) ? "처리 중..." : "수동 갱신"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
