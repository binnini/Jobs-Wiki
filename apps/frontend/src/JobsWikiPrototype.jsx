import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Calendar as CalIcon,
  ChevronRight,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  FileCode,
  FileText,
  Grid,
  Lightbulb,
  List,
  MapPin,
  MessageSquare,
  MoveRight,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Zap,
  Database,
} from "lucide-react";
import {
  createDocument,
  getCalendar,
  getWorkspace,
  getWorkspaceSync,
  getWorkspaceSummary,
  getOpportunityDetail,
  triggerWorknetIngestion,
  WasClientError,
} from "./was-client";
import {
  buildAppPath,
  buildHeroHeadline,
  buildWorkspaceActiveContext,
  createCommandAttemptKey,
  createRouteDocumentContext,
  createRouteOpportunityContext,
  DEFAULT_INGESTION_SOURCE_ID,
  formatDocumentLayerLabel,
  formatEmploymentType,
  formatKoreanDate,
  formatKoreanDateTime,
  formatMonthDay,
  formatMonthLabel,
  formatProjectionLabel,
  formatStatusLabel,
  getFallbackUrgencyLabel,
  getCommandGuidance,
  getCommandStatusMeta,
  getDocumentLayerBadgeClassName,
  getMonthStart,
  getStatusBadgeClassName,
  getSyncMeta,
  getWorkspaceItemIcon,
  getWritableBadgeClassName,
  isSharedLayer,
  isTerminalCommandStatus,
  mapAcceptedWorkspaceCommandResponse,
  mapCalendarItem,
  mapDetailOpportunity,
  mapDocumentResponse,
  mapSummaryOpportunity,
  mapWorkspaceNavigationResponse,
  mapWorkspaceSyncResponse,
  normalizeDocumentContext,
  normalizeOpportunityContext,
  normalizeProfileSnapshot,
  normalizeStringList,
  readAppRoute,
  shiftMonth,
  splitBlockText,
  writeAppRoute,
} from "./workspace/utils.js";
import {
  BlockPlaceholder,
  DetailLoadingView,
  InlineNotice,
  Label,
  MetaTag,
  Panel,
  RetryPanel,
  StructuredResponse,
  SyncNotice,
} from "./workspace/primitives.jsx";
import {
  CreatePersonalDocumentModal,
  WorkspaceNavigationSection,
} from "./workspace/WorkspaceTree.jsx";
import { DocumentDetailView } from "./workspace/DocumentView.jsx";
import { AskWorkspaceView } from "./workspace/AskPanel.jsx";
import { WorkspaceRightPanel } from "./workspace/WorkspaceRightPanel.jsx";

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

const WorkspaceHomeView = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-300">
    <div className="text-sm font-medium text-slate-500">
      트리에서 항목을 선택하면 여기에서 열립니다
    </div>
    <div className="mt-1.5 text-xs text-slate-400">
      shared 공고, 리포트, personal 문서를 탐색하려면 좌측 tree를 이용하세요
    </div>
  </div>
);

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
      <header className="mt-4 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              기본 분석 리포트
            </h1>
            {syncMeta?.badgeLabel ? (
              <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${syncMeta.badgeClassName}`}>
                {syncMeta.badgeLabel}
              </span>
            ) : null}
            {updatedAt ? (
              <span className="text-xs font-medium text-slate-400">{updatedAt} 확인</span>
            ) : null}
            {hasPartialBlocks ? (
              <span className="rounded-sm border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                일부 블록 준비 중
              </span>
            ) : null}
          </div>
          <button
            onClick={() => loadSummary({ preserveData: Boolean(summary) })}
            disabled={isRefreshing}
            className="flex items-center rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={`mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
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

  if (!detailResponse?.item) {
    return (
      <RetryPanel
        title="공고를 찾을 수 없습니다"
        message="선택한 공고의 상세 데이터가 아직 준비되지 않았거나 더 이상 접근할 수 없습니다."
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
    <div className="mx-auto max-w-5xl space-y-8 animate-in slide-in-from-right-4 duration-500">
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
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">
            {detail.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
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

      <div className="grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 md:grid-cols-12">
        <div className="space-y-8 md:col-span-8">
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
              <div className="flex items-baseline text-3xl font-bold tracking-tight text-slate-900">
                {detail.matchScore ?? "-"}
                <span className="ml-1 text-sm font-medium text-slate-500">점</span>
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
      <header className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            채용 일정
          </h1>
          {syncMeta?.badgeLabel ? (
            <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${syncMeta.badgeClassName}`}>
              {syncMeta.badgeLabel}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadCalendar({ preserveData: Boolean(calendarResponse) })}
            disabled={isRefreshing}
            className="flex items-center rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={`mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
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
                    <div className="text-xl font-bold tracking-tight text-slate-900">
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
  const [createDocumentTarget, setCreateDocumentTarget] = useState(null);
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

  const handleOpenCreatePersonalDocument = (target) => {
    setCreateDocumentTarget(target);
    setCreateDocumentError(null);
  };

  const handleCreatePersonalDocument = async ({ layer, title, bodyMarkdown, workspacePath }) => {
    setIsCreatingDocument(true);
    setCreateDocumentError(null);

    try {
      const response = await createDocument({
        layer,
        title,
        bodyMarkdown,
        kind: "note",
        ...(workspacePath ? { workspacePath } : {}),
      });
      await loadWorkspaceNavigation();
      const createdDocumentId = response.item?.documentRef?.objectId ?? null;

      if (createdDocumentId) {
        navigateToPath(`/documents/${encodeURIComponent(createdDocumentId)}`);
      }

      setCreateDocumentTarget(null);
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

    if (["workspace", "report", "calendar", "onboarding", "extraction"].includes(currentView)) {
      setActiveDocumentContext(null);
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
          <WorkspaceHomeView />
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
          <WorkspaceHomeView />
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
    <div className="flex h-screen overflow-hidden bg-[#f4efe6] font-sans text-slate-900 selection:bg-stone-200 selection:text-stone-950">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-[#262626] bg-[#171717] text-slate-300">
        <div className="border-b border-[#262626] px-4 py-4">
          <button
            onClick={() => navigateTo("workspace")}
            className="flex items-center text-sm font-extrabold tracking-tight text-white transition-colors hover:text-indigo-200"
          >
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-sm bg-indigo-600 text-[10px] font-bold text-white shadow-sm">
              JW
            </span>
            Jobs-Wiki
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <div className="space-y-px px-2">
            <button
              onClick={() => navigateTo("report")}
              className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-bold transition-all ${
                currentView === "report"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-50"
              }`}
            >
              <FileText size={14} className="flex-shrink-0 opacity-80" />
              리포트
            </button>
            <button
              onClick={() => navigateTo("calendar")}
              className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-bold transition-all ${
                currentView === "calendar"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-50"
              }`}
            >
              <CalIcon size={14} className="flex-shrink-0 opacity-80" />
              캘린더
            </button>
          </div>

          <div className="mt-3 border-t border-[#262626] px-2 pt-3">
            {isLoadingWorkspaceNavigation && !workspaceNavigation.sections.length ? (
              <div className="space-y-3">
                <div className="h-2.5 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-5 animate-pulse rounded bg-white/10" />
                <div className="h-5 animate-pulse rounded bg-white/10" />
                <div className="h-5 animate-pulse rounded bg-white/10" />
              </div>
            ) : null}

            {workspaceNavigationError && !workspaceNavigation.sections.length ? (
              <div className="rounded-sm border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-[11px] font-medium text-amber-100">
                {workspaceNavigationError.message}
              </div>
            ) : null}

            <div className="space-y-4">
              {workspaceNavigation.sections.map((section) => (
                <WorkspaceNavigationSection
                  key={section.sectionId}
                  section={section}
                  currentPath={currentPath}
                  onNavigatePath={navigateToPath}
                  onCreatePersonalDocument={handleOpenCreatePersonalDocument}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-[#262626] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
              {displayProfileSnapshot.targetRole.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {displayProfileSnapshot.targetRole}
              </p>
              <p className="truncate text-[10px] font-medium text-slate-400">
                {displayProfileSnapshot.experience}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <CreatePersonalDocumentModal
        layer={createDocumentTarget?.layer ?? null}
        workspacePath={createDocumentTarget?.workspacePath ?? null}
        isSubmitting={isCreatingDocument}
        error={createDocumentError}
        onClose={() => {
          if (!isCreatingDocument) {
            setCreateDocumentTarget(null);
            setCreateDocumentError(null);
          }
        }}
        onSubmit={handleCreatePersonalDocument}
      />

      <main className="flex-1 min-w-0 overflow-y-auto bg-transparent">
        <div className="p-8 md:p-10 lg:p-12">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #cbd5e1;
              border-radius: 10px;
            }
          `}</style>
          {renderMainContent()}
        </div>
      </main>

      <WorkspaceRightPanel
        currentView={currentView}
        activeDocumentContext={activeDocumentContext}
        activeOpportunityContext={activeOpportunityContext}
        workspaceSyncState={workspaceSyncState}
        isRefreshingWorkspaceSync={isRefreshingWorkspaceSync}
        isTriggeringWorkspaceSync={isTriggeringWorkspaceSync}
        activeWorkspaceCommandId={activeWorkspaceCommandId}
        onOpenAsk={openAsk}
        onLoadWorkspaceSync={loadWorkspaceSync}
        onTriggerWorkspaceIngestion={handleTriggerWorkspaceIngestion}
      />
    </div>
  );
}
