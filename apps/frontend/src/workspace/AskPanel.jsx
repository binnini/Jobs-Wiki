import React, { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  Briefcase,
  Database,
  FileCode,
  FileQuestion,
  FileText,
  GitMerge,
  Lightbulb,
  Loader2,
  MoveRight,
  Search,
  Target,
} from "lucide-react";
import {
  askWorkspace,
  getDocumentDetail,
  getOpportunityDetail,
  WasClientError,
} from "../was-client";
import {
  formatDocumentLayerLabel,
  formatKoreanDateTime,
  getDocumentLayerBadgeClassName,
  mapAskResponse,
  mapDetailOpportunity,
  mapDocumentResponse,
  normalizeDocumentContext,
  normalizeOpportunityContext,
  normalizeProfileSnapshot,
} from "./utils.js";
import {
  InlineNotice,
  Label,
  Panel,
  RetryPanel,
  StructuredResponse,
  SyncNotice,
} from "./primitives.jsx";

const ContextPanel = ({ activeContext, profileSnapshot, isLoadingContext = false, contextError = null }) => {
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
            <span className="ml-2 font-semibold text-slate-500">({profile.experience})</span>
          </div>
        </div>
        <div>
          <Label className="mb-1">현재 Ask 기준</Label>
          {contextType === "opportunity" ? (
            <div className="space-y-3 rounded-sm border border-indigo-100 bg-indigo-50/70 p-4">
              <div>
                <div className="mb-1 text-xs font-bold text-indigo-900">{activeContext.company ?? "공고 컨텍스트"}</div>
                <div className="text-sm font-bold text-indigo-700">{activeContext.title}</div>
              </div>
              {activeContext.summary ? (
                <p className="text-sm font-medium leading-relaxed text-indigo-950/80">{activeContext.summary}</p>
              ) : null}
              {activeContext.deadline || activeContext.urgency ? (
                <div className="flex flex-wrap gap-3 text-[11px] font-bold text-indigo-800/70">
                  {activeContext.deadline ? <span>마감 {activeContext.deadline}</span> : null}
                  {activeContext.urgency ? <span>{activeContext.urgency}</span> : null}
                </div>
              ) : null}
            </div>
          ) : contextType === "document" ? (
            <div className="space-y-3 rounded-sm border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${getDocumentLayerBadgeClassName(activeContext.layer)}`}>
                  {formatDocumentLayerLabel(activeContext.layer)}
                </span>
                <span className="text-xs font-bold text-amber-900">문서 컨텍스트</span>
              </div>
              <div className="text-sm font-bold text-amber-900">{activeContext.title}</div>
              <p className="text-sm font-medium leading-relaxed text-amber-950/80">
                {activeContext.summary ?? "현재 문서를 기준으로 답변, 근거, 연관 객체를 정리합니다."}
              </p>
            </div>
          ) : (
            <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-3 text-center text-sm font-bold text-slate-600">
              전체 워크스페이스 기반 분석 (지정 문서/공고 없음)
            </div>
          )}
          {isLoadingContext ? (
            <p className="mt-3 text-xs font-bold text-slate-500">현재 컨텍스트를 보강하는 중입니다.</p>
          ) : null}
          {contextError ? (
            <div className="mt-3 rounded-sm border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-bold text-amber-900">
              {contextError.message}
            </div>
          ) : null}
        </div>
        <div>
          <Label className="mb-1">핵심 역량</Label>
          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
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
  if (!activeContext || activeContext.contextType === "workspace") return null;
  const isDocument = activeContext.contextType === "document";
  const badgeClassName = isDocument
    ? getDocumentLayerBadgeClassName(activeContext.layer)
    : "border-indigo-200 bg-indigo-50 text-indigo-700";

  return (
    <Panel className={isDocument ? "border-amber-200 bg-amber-50/40" : "border-indigo-200 bg-indigo-50/40"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Label className={isDocument ? "text-amber-700" : "text-indigo-700"}>active context</Label>
          <h3 className="text-lg font-bold text-slate-900">{activeContext.title}</h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
            {isDocument
            ? "이 문서를 기준으로 답변과 근거를 함께 보여줍니다."
            : "이 공고를 기준으로 답변과 근거를 함께 보여줍니다."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-sm border px-2.5 py-1 text-[11px] font-bold ${badgeClassName}`}>
            {isDocument ? formatDocumentLayerLabel(activeContext.layer) : "opportunity"}
          </span>
          <span className="rounded-sm border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
            grounded answer
          </span>
        </div>
      </div>
    </Panel>
  );
};

function getEvidenceMeta(kind) {
  if (kind === "personal") {
    return { Icon: FileText, iconClassName: "text-indigo-600", badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700", label: "개인 자료" };
  }
  if (kind === "interpretation") {
    return { Icon: BarChart2, iconClassName: "text-amber-600", badgeClassName: "border-amber-200 bg-amber-50 text-amber-700", label: "해석" };
  }
  return { Icon: Briefcase, iconClassName: "text-emerald-600", badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "사실" };
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
          <div key={ev.evidenceId ?? `${ev.label}-${index}`} className="rounded-sm border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center">
                  <Icon size={14} className={`mr-2 ${evidenceMeta.iconClassName}`} />
                  <span className="text-xs font-bold text-slate-800">{ev.label}</span>
                </div>
                <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${evidenceMeta.badgeClassName}`}>
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
        <div className="p-4 text-center text-sm font-medium text-slate-500">현재 답변에 직접 연결된 근거가 없습니다.</div>
      )}
    </div>
  </Panel>
);

const RelatedOpportunitiesPanel = ({ currentJob, relatedJobs, onOpenJob, onSwitch, isSwitching = false }) => {
  const visibleJobs = (relatedJobs ?? []).filter((job) => job.opportunityId !== currentJob?.opportunityId);
  if (visibleJobs.length === 0) return null;

  return (
    <Panel>
      <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
        <GitMerge size={16} className="mr-2 text-slate-500" />
        연관 추천 공고 비교
      </h3>
      <div className="space-y-4">
        {visibleJobs.map((job) => (
          <div key={job.opportunityId} className="rounded-sm border border-slate-200 bg-white/80 p-4 transition-colors hover:border-slate-300">
            <div className="mb-2 flex items-start justify-between gap-3">
              <span className="text-xs font-bold text-slate-900">{job.company}</span>
              <span className="text-xs font-bold text-slate-500">{job.matchScore ? `적합도 ${job.matchScore}` : job.urgency ?? "비교 가능"}</span>
            </div>
            <h4 className="mb-3 text-sm font-bold text-slate-800">{job.title}</h4>
            <p className="mb-4 text-xs font-medium leading-relaxed text-slate-600">
              {job.matchReason ?? job.summary ?? "연관 공고 설명이 아직 준비되지 않았습니다."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onOpenJob(job)} className="rounded-sm border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50">상세 보기</button>
              <button onClick={() => onSwitch(job)} disabled={isSwitching} className="rounded-sm border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">이 공고로 다시 분석</button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

const RelatedDocumentsPanel = ({ currentDocument, relatedDocuments, onOpenDocument, onSwitch, isSwitching = false }) => {
  const visibleDocuments = (relatedDocuments ?? []).filter((document) => document.documentId !== currentDocument?.documentId);
  if (visibleDocuments.length === 0) return null;

  return (
    <Panel>
      <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
        <FileCode size={16} className="mr-2 text-slate-500" />
        연관 문서
      </h3>
      <div className="space-y-4">
        {visibleDocuments.map((document) => (
          <div key={document.documentId} className="rounded-sm border border-slate-200 bg-white/80 p-4 transition-colors hover:border-slate-300">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-800">{document.title}</h4>
              <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${getDocumentLayerBadgeClassName(document.layer)}`}>
                {formatDocumentLayerLabel(document.layer)}
              </span>
            </div>
            <p className="mb-4 text-xs font-medium leading-relaxed text-slate-600">
              {document.summary ?? "연결된 문서 요약이 아직 준비되지 않았습니다."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onOpenDocument(document)} className="rounded-sm border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50">문서 열기</button>
              <button onClick={() => onSwitch(document)} disabled={isSwitching} className="rounded-sm border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">이 문서로 다시 분석</button>
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
          onClick={() => onSelect("이 공고의 핵심 요구사항에 맞춰 내 이력서의 어떤 부분을 수정하면 좋을지 구체적인 방향을 제시해 줘.")}
          className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white/80 p-3.5 text-sm font-bold leading-relaxed text-slate-800 transition-colors hover:border-slate-300"
        >
          <MoveRight size={16} className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100" />
          이 공고 기준으로 이력서 수정 방향 보기
        </li>
      )}
      <li
        onClick={() => onSelect("현재 내 프로필에서 부족한 역량이 무엇인지 정리하고, 이를 보완할 수 있는 학습 방향을 제시해 줘.")}
        className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white/80 p-3.5 text-sm font-bold leading-relaxed text-slate-800 transition-colors hover:border-slate-300"
      >
        <MoveRight size={16} className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100" />
        부족한 역량만 따로 심층 분석하기
      </li>
      <li
        onClick={() => onSelect("추천 공고들의 마감일과 적합도를 함께 고려해서 우선순위를 다시 정리해 줘.")}
        className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white/80 p-3.5 text-sm font-bold leading-relaxed text-slate-800 transition-colors hover:border-slate-300"
      >
        <MoveRight size={16} className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100" />
        마감일 기준으로 지원 우선순위 다시 보기
      </li>
    </ul>
  </Panel>
);

function buildAskWelcomeText(activeContext) {
  if (activeContext?.contextType === "document") {
    return `**${activeContext.title}** 문서를 기준으로 질문을 시작할 수 있습니다.`;
  }
  if (activeContext?.contextType === "opportunity") {
    return `**${activeContext.company ?? "선택한 회사"}**의 **${activeContext.title}** 공고를 기준으로 질문을 시작할 수 있습니다.`;
  }
  return "현재 전체 프로필 기준으로 질문을 바로 보낼 수 있습니다.";
}

export const AskWorkspaceView = ({ activeContext, profileSnapshot, initialPrompt = "", onContextChange, onOpenJob, onOpenDocument }) => {
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
      ? getDocumentDetail(contextState.documentId).then((response) => ({ contextType: "document", ...mapDocumentResponse(response) }))
      : getOpportunityDetail(contextState.opportunityId).then((response) => ({ contextType: "opportunity", ...mapDetailOpportunity(response) }));

    request
      .then((nextContext) => {
        if (requestId !== contextRequestIdRef.current) return;
        setContextState(nextContext);
        setContextError(null);
      })
      .catch((requestError) => {
        if (requestId !== contextRequestIdRef.current) return;
        const normalizedError = requestError instanceof WasClientError
          ? requestError
          : new WasClientError({ message: shouldHydrateDocument ? "선택한 문서 컨텍스트를 보강하지 못했습니다." : "선택한 공고 컨텍스트를 보강하지 못했습니다." });
        setContextError(normalizedError);
      })
      .finally(() => {
        if (requestId === contextRequestIdRef.current) setIsLoadingContext(false);
      });

    return () => { contextRequestIdRef.current += 1; };
  }, [contextState]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [askResult, initialError, isSubmitting]);

  const submitQuestion = async (rawQuestion, { contextOverride = contextState, switchingContext = false } = {}) => {
    const normalizedQuestion = rawQuestion.trim();
    if (!normalizedQuestion || isSubmitting) return;

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
        opportunityId: contextOverride?.contextType === "opportunity" ? contextOverride.opportunityId : undefined,
        documentId: contextOverride?.contextType === "document" ? contextOverride.documentId : undefined,
      });
      if (requestId !== requestIdRef.current) return;

      const nextAskResult = mapAskResponse(response);
      setAskResult(nextAskResult);
      if (nextAskResult.activeContext) {
        setContextState(nextAskResult.activeContext);
        onContextChange(nextAskResult.activeContext);
      }
      setInitialError(null);
      setSubmitError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      const normalizedError = requestError instanceof WasClientError
        ? requestError
        : new WasClientError({ message: "Ask 응답을 불러오지 못했습니다." });
      if (hadVisibleResult) setSubmitError(normalizedError);
      else setInitialError(normalizedError);
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
    if (!submittedQuestion) return;
    submitQuestion(submittedQuestion, { contextOverride: contextState, switchingContext: false });
  };

  const handleSwitchContext = (context) => {
    const nextContext = context?.documentId != null
      ? { contextType: "document", ...normalizeDocumentContext(context) }
      : context?.opportunityId != null
        ? { contextType: "opportunity", ...normalizeOpportunityContext(context) }
        : null;
    if (!nextContext) return;
    setContextState(nextContext);
    setContextError(null);
    onContextChange(nextContext);
    if (submittedQuestion) {
      submitQuestion(submittedQuestion, { contextOverride: nextContext, switchingContext: true });
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
      <div className="min-w-[600px] flex-1 overflow-hidden rounded-sm border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">메인 분석 패널</h2>
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

        <div className="custom-scrollbar h-[calc(100%-150px)] overflow-y-auto bg-white p-10" ref={scrollRef}>
          <div className="mx-auto max-w-3xl space-y-8">
            <SyncNotice
              surface="ask"
              sync={currentSync}
              refreshError={submitError}
              onRetry={submittedQuestion ? () => submitQuestion(submittedQuestion) : undefined}
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
                <div className="whitespace-pre-wrap text-xl font-bold leading-relaxed text-slate-900">{submittedQuestion}</div>
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
              <RetryPanel title="Ask 응답을 불러오지 못했습니다" message={initialError.message} onRetry={handleRetry} />
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
          <div className="relative mx-auto flex max-w-3xl items-center rounded-sm border border-slate-300 bg-white transition-all focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
            <div className="pl-4 text-slate-400"><Search size={20} /></div>
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
        <ContextPanel activeContext={contextState} profileSnapshot={profileSnapshot} isLoadingContext={isLoadingContext} contextError={contextError} />
        <EvidencePanel evidence={currentEvidence} />
        <RelatedDocumentsPanel
          currentDocument={contextState?.contextType === "document" ? contextState : null}
          relatedDocuments={relatedDocuments}
          onOpenDocument={onOpenDocument}
          onSwitch={handleSwitchContext}
          isSwitching={isSwitchingContext}
        />
        <RelatedOpportunitiesPanel
          currentJob={contextState?.contextType === "opportunity" ? contextState : null}
          relatedJobs={relatedJobs}
          onOpenJob={onOpenJob}
          onSwitch={handleSwitchContext}
          isSwitching={isSwitchingContext}
        />
        <FollowUpPanel hasJob={contextState?.contextType === "opportunity"} onSelect={handleSend} />
      </div>
    </div>
  );
};
