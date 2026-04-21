import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Pencil,
  RefreshCw,
  Target,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  attachWikiLinks,
  deleteDocument,
  generateWikiDocument,
  getDocumentDetail,
  registerPersonalAsset,
  suggestWikiLinks,
  updateDocument,
  WasClientError,
} from "../was-client";
import {
  formatDocumentLayerLabel,
  formatKoreanDateTime,
  getDocumentLayerBadgeClassName,
  mapDocumentResponse,
  normalizeProfileSnapshot,
  getSyncMeta,
} from "./utils.js";
import {
  DetailLoadingView,
  InlineNotice,
  Label,
  Panel,
  RetryPanel,
  StructuredResponse,
  SyncNotice,
} from "./primitives.jsx";

const AUTO_ATTACH_CONFIDENCE_THRESHOLD = 0.95;

function createDefaultAssetStorageRef(filename) {
  const safeName = String(filename ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;

  return `personal-assets/${(safeName || "asset")}-${suffix}`;
}

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
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-center text-sm font-bold text-slate-600">
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

export const DocumentDetailView = ({ documentId, onBack, onOpenAsk, onOpenDocument, onWorkspaceChanged }) => {
  const [documentResponse, setDocumentResponse] = useState(null);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorBody, setEditorBody] = useState("");
  const [editorWorkspacePath, setEditorWorkspacePath] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegisteringAsset, setIsRegisteringAsset] = useState(false);
  const [isGeneratingWiki, setIsGeneratingWiki] = useState(false);
  const [isSuggestingLinks, setIsSuggestingLinks] = useState(false);
  const [isAttachingLinks, setIsAttachingLinks] = useState(false);
  const [mutationError, setMutationError] = useState(null);
  const [mutationNotice, setMutationNotice] = useState(null);
  const [isGenerationTraceOpen, setIsGenerationTraceOpen] = useState(false);
  const [isAutoAttachEnabled, setIsAutoAttachEnabled] = useState(false);
  const [assetFilename, setAssetFilename] = useState("");
  const [assetMediaType, setAssetMediaType] = useState("application/pdf");
  const [assetStorageRef, setAssetStorageRef] = useState("");
  const [isAssetAdvancedMode, setIsAssetAdvancedMode] = useState(false);
  const [linkSuggestions, setLinkSuggestions] = useState([]);
  const [autoAttachedLinkKeys, setAutoAttachedLinkKeys] = useState([]);
  const requestIdRef = useRef(0);
  const suggestionRequestIdRef = useRef(0);
  const attachRequestIdRef = useRef(0);

  const loadDocument = async ({ preserveData = false } = {}) => {
    if (!documentId) { setIsLoading(false); return; }

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
      if (requestId !== requestIdRef.current) return;
      setDocumentResponse(response);
      const detail = mapDocumentResponse(response);
      setEditorTitle(detail.title ?? "");
      setEditorBody(detail.bodyMarkdown ?? "");
      setEditorWorkspacePath(detail.workspacePath?.segments?.join("/") ?? "");
      setError(null);
      setRefreshError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      const normalizedError = requestError instanceof WasClientError
        ? requestError
        : new WasClientError({ message: "문서 상세를 불러오지 못했습니다." });
      if (preserveData) setRefreshError(normalizedError);
      else setError(normalizedError);
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
    setIsGenerationTraceOpen(false);
    setMutationError(null);
    setMutationNotice(null);
    setLinkSuggestions([]);
    setAutoAttachedLinkKeys([]);
    suggestionRequestIdRef.current += 1;
    attachRequestIdRef.current += 1;
    setIsAssetAdvancedMode(false);
    setEditorWorkspacePath("");
    if (!documentId) { setIsLoading(false); return undefined; }
    loadDocument();
    return () => { requestIdRef.current += 1; };
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

  if (isLoading && !documentResponse) return <DetailLoadingView />;

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
          <button onClick={onBack} className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700">
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
  const generation = detail.metadata?.generation ?? null;
  const generationTrace = Array.isArray(generation?.trace) ? generation.trace : [];
  const showGenerationTrace = detail.layer === "personal_wiki" && generationTrace.length > 0;
  const autoAttachedLinkKeySet = new Set(autoAttachedLinkKeys);
  const buildLinkKey = (item) => `${item.layer}:${item.id}`;
  const isHighConfidenceLink = (item) => Number(item.confidence ?? 0) >= AUTO_ATTACH_CONFIDENCE_THRESHOLD;
  const pendingLinkSuggestions = linkSuggestions.filter((item) => !autoAttachedLinkKeySet.has(buildLinkKey(item)));
  const attachableLinkSuggestions = pendingLinkSuggestions;
  const canEditWorkspacePath = detail.writable && detail.layer !== "shared";
  const normalizedWorkspacePath = editorWorkspacePath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const refreshWorkspace = async () => { await onWorkspaceChanged?.(); };

  const loadLinkSuggestions = async ({ showNotice = true } = {}) => {
    if (detail.layer !== "personal_wiki" || !detail.writable || isSuggestingLinks) return;

    const requestId = suggestionRequestIdRef.current + 1;
    suggestionRequestIdRef.current = requestId;

    setIsSuggestingLinks(true);
    setMutationError(null);
    if (showNotice) {
      setMutationNotice(null);
    }

    try {
      const response = await suggestWikiLinks(detail.documentId, { maxSuggestions: 5 });
      if (requestId !== suggestionRequestIdRef.current) return;
      setLinkSuggestions(response.suggestions ?? []);
      if (showNotice) {
        setMutationNotice("link suggestion은 preview only이며 shared를 변경하지 않습니다.");
      }
    } catch (requestError) {
      if (requestId !== suggestionRequestIdRef.current) return;
      setMutationError(requestError instanceof WasClientError ? requestError : new WasClientError({ message: "link suggestion을 불러오지 못했습니다." }));
    } finally {
      if (requestId === suggestionRequestIdRef.current) {
        setIsSuggestingLinks(false);
      }
    }
  };

  useEffect(() => {
    if (!generation || detail.layer !== "personal_wiki" || !detail.writable || linkSuggestions.length > 0) {
      return undefined;
    }

    void loadLinkSuggestions({ showNotice: false });
    return undefined;
  }, [detail.documentId, detail.layer, detail.writable, generation?.generatedAt]);

  useEffect(() => {
    if (
      !isAutoAttachEnabled ||
      detail.layer !== "personal_wiki" ||
      !detail.writable ||
      !detail.version ||
      !generation ||
      linkSuggestions.length === 0 ||
      isSuggestingLinks ||
      isAttachingLinks
    ) {
      return undefined;
    }

    const autoAttachableSuggestions = linkSuggestions.filter(
      (item) =>
        isHighConfidenceLink(item) && !autoAttachedLinkKeySet.has(buildLinkKey(item)),
    );

    if (autoAttachableSuggestions.length === 0) {
      return undefined;
    }

    void autoAttachHighConfidenceLinks(autoAttachableSuggestions);
    return undefined;
  }, [
    detail.documentId,
    detail.layer,
    detail.writable,
    detail.version,
    generation?.generatedAt,
    isAutoAttachEnabled,
    linkSuggestions,
    autoAttachedLinkKeys,
    isSuggestingLinks,
    isAttachingLinks,
  ]);

  const autoAttachHighConfidenceLinks = async (suggestions) => {
    if (
      detail.layer !== "personal_wiki" ||
      !detail.writable ||
      !detail.version ||
      isAttachingLinks ||
      suggestions.length === 0
    ) {
      return;
    }

    const requestId = attachRequestIdRef.current + 1;
    attachRequestIdRef.current = requestId;

    setIsAttachingLinks(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      await attachWikiLinks(detail.documentId, {
        wikiDocumentVersion: detail.version,
        attachments: suggestions.map((item) => ({ layer: item.layer, id: item.id })),
      });
      if (requestId !== attachRequestIdRef.current) return;
      setAutoAttachedLinkKeys((current) => Array.from(new Set([...current, ...suggestions.map(buildLinkKey)])));
      await loadDocument({ preserveData: true });
      await refreshWorkspace();
      setMutationNotice(
        `confidence ${AUTO_ATTACH_CONFIDENCE_THRESHOLD.toFixed(2)} 이상 link ${suggestions.length}개를 auto-attach했습니다.`,
      );
    } catch (requestError) {
      if (requestId !== attachRequestIdRef.current) return;
      setMutationError(requestError instanceof WasClientError ? requestError : new WasClientError({ message: "link auto-attach에 실패했습니다." }));
    } finally {
      if (requestId === attachRequestIdRef.current) {
        setIsAttachingLinks(false);
      }
    }
  };

  const buildAssetRegistrationInput = () => {
    const filename = assetFilename.trim();
    const mediaType = assetMediaType.trim();

    if (!filename || !mediaType) {
      return null;
    }

    if (isAssetAdvancedMode) {
      const storageRef = assetStorageRef.trim();

      if (!storageRef) {
        return null;
      }

      return {
        filename,
        mediaType,
        storageRef,
      };
    }

    return {
      filename,
      mediaType,
      storageRef: createDefaultAssetStorageRef(filename),
    };
  };

  const registerPendingAsset = async ({ filename, mediaType, storageRef }) => {
    const assetResponse = await registerPersonalAsset({
      filename,
      mediaType,
      storageRef,
      assetKind: "file",
    });
    const nextAssetRefs = Array.from(
      new Set([...(assetRefs ?? []), assetResponse.assetId].filter(Boolean)),
    );
    const referenceLine = `- ${assetResponse.filename} (${assetResponse.assetId})`;
    const nextBody = editorBody.includes(referenceLine)
      ? editorBody
      : `${editorBody.trimEnd()}\n\n## Asset references\n${referenceLine}\n`;

    return {
      assetResponse,
      nextAssetRefs,
      nextBody,
    };
  };

  const handleGenerateWiki = async (operation) => {
    if (detail.layer !== "personal_raw" || !detail.writable || isGeneratingWiki) return;
    setIsGeneratingWiki(true);
    setMutationError(null);
    setMutationNotice(null);
    try {
      const response = await generateWikiDocument(detail.documentId, { operation });
      const generatedDocumentId = response.item?.documentRef?.objectId ?? null;
      await refreshWorkspace();
      setMutationNotice(
        operation === "summarize" ? "personal/wiki summary를 생성했습니다."
          : operation === "rewrite" ? "personal/wiki rewrite 결과를 생성했습니다."
          : "personal/wiki structured note를 생성했습니다.",
      );
      if (generatedDocumentId) onOpenDocument?.({ documentId: generatedDocumentId });
    } catch (requestError) {
      setMutationError(requestError instanceof WasClientError ? requestError : new WasClientError({ message: "personal/wiki 생성에 실패했습니다." }));
    } finally {
      setIsGeneratingWiki(false);
    }
  };

  const handleSuggestLinks = async () => {
    await loadLinkSuggestions({ showNotice: true });
  };

  const handleAttachSuggestedLinks = async () => {
    if (detail.layer !== "personal_wiki" || !detail.writable || !detail.version || isAttachingLinks || attachableLinkSuggestions.length === 0) return;
    setIsAttachingLinks(true);
    setMutationError(null);
    setMutationNotice(null);
    try {
      await attachWikiLinks(detail.documentId, {
        wikiDocumentVersion: detail.version,
        attachments: attachableLinkSuggestions.map((item) => ({ layer: item.layer, id: item.id })),
      });
      await loadDocument({ preserveData: true });
      await refreshWorkspace();
      setMutationNotice("선택된 link를 personal/wiki 문서에만 attach했습니다.");
    } catch (requestError) {
      setMutationError(requestError instanceof WasClientError ? requestError : new WasClientError({ message: "link attach에 실패했습니다." }));
    } finally {
      setIsAttachingLinks(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!detail.writable || !detail.version || isSaving) return;
    setIsSaving(true);
    setMutationError(null);
    setMutationNotice(null);
    try {
      const assetRegistrationInput =
        detail.layer === "personal_raw" ? buildAssetRegistrationInput() : null;
      const assetRegistrationResult =
        assetRegistrationInput && detail.layer === "personal_raw"
          ? await registerPendingAsset(assetRegistrationInput)
        : null;
      const nextBodyMarkdown = assetRegistrationResult?.nextBody ?? editorBody;
      const nextAssetRefs = assetRegistrationResult?.nextAssetRefs ?? assetRefs;

      await updateDocument(detail.documentId, {
        ifVersion: detail.version,
        title: editorTitle,
        bodyMarkdown: nextBodyMarkdown,
        assetRefs: nextAssetRefs,
        ...(canEditWorkspacePath
          ? {
              workspacePath: normalizedWorkspacePath.length
                ? { segments: normalizedWorkspacePath }
                : null,
            }
          : {}),
      });
      await loadDocument({ preserveData: true });
      await refreshWorkspace();
      setIsEditing(false);
      if (assetRegistrationResult) {
        setAssetFilename("");
        setAssetMediaType("application/pdf");
        setAssetStorageRef("");
        setMutationNotice("asset를 자동 등록하고 personal/raw 문서를 저장했습니다.");
      } else {
        setMutationNotice("personal 문서를 저장했습니다.");
      }
    } catch (requestError) {
      setMutationError(requestError instanceof WasClientError ? requestError : new WasClientError({ message: "문서를 저장하지 못했습니다." }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!detail.writable || !detail.version || isDeleting) return;
    const shouldDelete = window.confirm("이 personal 문서를 삭제하시겠습니까?");
    if (!shouldDelete) return;
    setIsDeleting(true);
    setMutationError(null);
    setMutationNotice(null);
    try {
      await deleteDocument(detail.documentId, { ifVersion: detail.version });
      await refreshWorkspace();
      onBack();
    } catch (requestError) {
      setMutationError(requestError instanceof WasClientError ? requestError : new WasClientError({ message: "문서를 삭제하지 못했습니다." }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegisterAsset = async () => {
    if (!detail.writable || !detail.version || isRegisteringAsset) return;
    setIsRegisteringAsset(true);
    setMutationError(null);
    setMutationNotice(null);
    try {
      const assetRegistrationInput = buildAssetRegistrationInput();

      if (!assetRegistrationInput) {
        throw new WasClientError({
          message: isAssetAdvancedMode
            ? "필수 정보와 storageRef를 입력한 뒤 다시 시도해 주세요."
            : "Filename과 Media Type을 입력한 뒤 다시 시도해 주세요.",
        });
      }

      const { nextAssetRefs, nextBody } = await registerPendingAsset(assetRegistrationInput);
      await updateDocument(detail.documentId, {
        ifVersion: detail.version,
        title: editorTitle,
        bodyMarkdown: nextBody,
        assetRefs: nextAssetRefs,
        ...(canEditWorkspacePath
          ? {
              workspacePath: normalizedWorkspacePath.length
                ? { segments: normalizedWorkspacePath }
                : null,
            }
          : {}),
      });
      setAssetFilename("");
      setAssetMediaType("application/pdf");
      setAssetStorageRef("");
      setIsAssetAdvancedMode(false);
      await loadDocument({ preserveData: true });
      await refreshWorkspace();
      setIsEditing(true);
      setEditorBody(nextBody);
      setMutationNotice("asset를 등록하고 현재 personal 문서에 연결했습니다.");
    } catch (requestError) {
      setMutationError(requestError instanceof WasClientError ? requestError : new WasClientError({ message: "asset 등록 또는 문서 연결에 실패했습니다." }));
    } finally {
      setIsRegisteringAsset(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <button onClick={onBack} className="flex items-center text-sm font-bold text-slate-600 transition-colors hover:text-slate-900">
          <ArrowLeft size={16} className="mr-2" />
          워크스페이스로 돌아가기
        </button>
        <div className="flex items-center gap-3">
          {syncMeta?.badgeLabel ? (
            <div className={`rounded-sm border px-3 py-1.5 text-xs font-bold ${syncMeta.badgeClassName}`}>
              {syncMeta.badgeLabel}
            </div>
          ) : null}
          <button
            onClick={() => loadDocument({ preserveData: Boolean(documentResponse) })}
            disabled={isRefreshing}
            className="flex items-center rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            새로고침
          </button>
          <div className="text-xs font-bold text-slate-400">문서 ID: {documentId}</div>
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
        <InlineNotice title="personal write 적용 완료" message={mutationNotice} className="border-emerald-200 bg-emerald-50 text-emerald-900" />
      ) : null}
      {mutationError ? (
        <InlineNotice title="personal write 실패" message={mutationError.message} className="border-rose-200 bg-rose-50 text-rose-900" />
      ) : null}

      <header className="rounded-sm border border-slate-200 bg-white p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">{detail.title}</h1>
            {detail.summary ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{detail.summary}</p>
            ) : null}
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
                    setEditorWorkspacePath(detail.workspacePath?.segments?.join("/") ?? "");
                  }}
                  className="rounded-sm border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Pencil size={14} className="mr-2 inline-flex" />
                  {isEditing ? "편집 닫기" : "편집"}
                </button>
                <button
                  onClick={handleDeleteDocument}
                  disabled={isDeleting}
                  className="rounded-sm border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-40"
                >
                  <Trash2 size={14} className="mr-2 inline-flex" />
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="space-y-8 md:col-span-8">
          {detail.writable && detail.layer === "personal_raw" ? (
            <Panel>
              <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">raw to wiki generation</h3>
              <p className="mb-4 text-sm font-medium leading-relaxed text-slate-600">
                이 액션은 shared를 publish하지 않고, 현재 personal/raw 문서를 기반으로 personal/wiki 결과만 생성합니다.
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => handleGenerateWiki("summarize")} disabled={isGeneratingWiki} className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 disabled:opacity-40">
                  {isGeneratingWiki ? "생성 중..." : "summarize"}
                </button>
                <button type="button" onClick={() => handleGenerateWiki("rewrite")} disabled={isGeneratingWiki} className="rounded-sm border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800 disabled:opacity-40">
                  {isGeneratingWiki ? "생성 중..." : "rewrite"}
                </button>
                <button type="button" onClick={() => handleGenerateWiki("structure")} disabled={isGeneratingWiki} className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 disabled:opacity-40">
                  {isGeneratingWiki ? "생성 중..." : "structure"}
                </button>
              </div>
            </Panel>
          ) : null}

          <section className="rounded-sm border border-slate-200 bg-white p-8">
            <Label>문서 본문</Label>
            {detail.writable && isEditing ? (
              <div className="space-y-4">
                <input
                  value={editorTitle}
                  onChange={(event) => setEditorTitle(event.target.value)}
                  className="w-full rounded-sm border border-slate-300 px-4 py-3 text-lg font-bold text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
                {canEditWorkspacePath ? (
                  <div>
                    <Label>폴더 경로</Label>
                    <input
                      value={editorWorkspacePath}
                      onChange={(event) => setEditorWorkspacePath(event.target.value)}
                      placeholder="projects/alpha"
                      className="w-full rounded-sm border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-indigo-500"
                    />
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      `folder/subfolder` 형식으로 입력하면 문서를 이동합니다.
                    </p>
                  </div>
                ) : null}
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
                      setEditorWorkspacePath(detail.workspacePath?.segments?.join("/") ?? "");
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
              <div className="space-y-6">
                <StructuredResponse text={detail.bodyMarkdown || detail.summary || "표시할 문서 본문이 아직 없습니다."} />
                {showGenerationTrace ? (
                  <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
                    <button
                      type="button"
                      onClick={() => setIsGenerationTraceOpen((current) => !current)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Generation trace</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">
                          {generation?.operation ?? "generation"} trace
                        </div>
                      </div>
                      {isGenerationTraceOpen ? (
                        <ChevronUp size={16} className="text-slate-500" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-500" />
                      )}
                    </button>
                    {isGenerationTraceOpen ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 text-xs font-medium text-slate-600 md:grid-cols-2">
                          <div className="rounded-sm border border-slate-200 bg-white px-3 py-2">
                            <span className="font-bold text-slate-500">Provider</span>
                            <div className="mt-1 font-bold text-slate-800">{generation?.provider ?? "unknown"}</div>
                          </div>
                          <div className="rounded-sm border border-slate-200 bg-white px-3 py-2">
                            <span className="font-bold text-slate-500">Model</span>
                            <div className="mt-1 font-bold text-slate-800">{generation?.model ?? "unknown"}</div>
                          </div>
                          <div className="rounded-sm border border-slate-200 bg-white px-3 py-2">
                            <span className="font-bold text-slate-500">Generated at</span>
                            <div className="mt-1 font-bold text-slate-800">{formatKoreanDateTime(generation?.generatedAt) ?? "unknown"}</div>
                          </div>
                          <div className="rounded-sm border border-slate-200 bg-white px-3 py-2">
                            <span className="font-bold text-slate-500">Source document</span>
                            <div className="mt-1 font-bold text-slate-800">
                              {generation?.sourceDocument?.title ?? generation?.sourceDocument?.documentId ?? "unknown"}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {generationTrace.map((traceItem, index) => (
                            <div key={`${traceItem.step}-${index}`} className="rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                {traceItem.step}
                              </div>
                              <div className="mt-1 font-medium leading-relaxed">
                                {traceItem.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8 md:col-span-4">
          {detail.writable && detail.layer === "personal_wiki" ? (
            <Panel>
              <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">wiki link actions</h3>
              <p className="mb-4 text-sm font-medium leading-relaxed text-slate-600">
                suggestion은 읽기 전용 preview이고, attach는 personal/wiki 문서 메타데이터에만 반영됩니다.
              </p>
              <label className="mb-4 flex items-start gap-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isAutoAttachEnabled}
                  onChange={(event) => setIsAutoAttachEnabled(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  <span className="block font-bold text-slate-900">Auto-attach high-confidence links</span>
                  <span className="block text-xs leading-relaxed text-slate-500">
                    confidence {AUTO_ATTACH_CONFIDENCE_THRESHOLD.toFixed(2)} 이상만 자동으로 attach하고, 나머지는 suggestion으로 남깁니다.
                  </span>
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleSuggestLinks} disabled={isSuggestingLinks} className="rounded-sm border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 disabled:opacity-40">
                  {isSuggestingLinks ? "조회 중..." : "suggest links"}
                </button>
                <button type="button" onClick={handleAttachSuggestedLinks} disabled={isAttachingLinks || attachableLinkSuggestions.length === 0} className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 disabled:opacity-40">
                  {isAttachingLinks ? "적용 중..." : "attach links"}
                </button>
              </div>
              {linkSuggestions.length ? (
                <div className="mt-4 space-y-2">
                  {linkSuggestions.map((item, index) => (
                    <div key={`${item.layer}-${item.id}-${index}`} className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{item.layer}: {item.id}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${autoAttachedLinkKeySet.has(buildLinkKey(item)) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : isHighConfidenceLink(item) && isAutoAttachEnabled ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500"}`}>
                          {autoAttachedLinkKeySet.has(buildLinkKey(item)) ? "auto-attached" : isHighConfidenceLink(item) ? "suggested" : "suggested"}
                        </span>
                        {typeof item.confidence === "number" ? (
                          <span className="text-[10px] font-bold text-slate-400">confidence {item.confidence.toFixed(2)}</span>
                        ) : null}
                      </div>
                      {item.reason ? <div className="mt-1 font-medium text-slate-600">{item.reason}</div> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </Panel>
          ) : null}

          {detail.writable ? (
            <Panel>
              <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">asset registration</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                파일 이름과 타입만 입력하면 됩니다. 저장 위치가 필요하면 고급 설정에서만 지정하세요.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">기본 모드</div>
                    <div className="text-[11px] font-medium text-slate-600">
                      storageRef는 자동 생성되고, 고급 모드에서만 직접 지정할 수 있습니다.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAssetAdvancedMode((current) => !current)}
                    className={`rounded-sm border px-3 py-2 text-xs font-bold shadow-sm transition-colors ${
                      isAssetAdvancedMode
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {isAssetAdvancedMode ? "고급 모드 사용 중" : "고급 모드 열기"}
                  </button>
                </div>
                <div>
                  <Label className="mb-1">Filename</Label>
                  <input value={assetFilename} onChange={(event) => setAssetFilename(event.target.value)} placeholder="resume_v4.pdf" className="w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-indigo-500" />
                </div>
                <div>
                  <Label className="mb-1">Media Type</Label>
                  <input value={assetMediaType} onChange={(event) => setAssetMediaType(event.target.value)} placeholder="application/pdf" className="w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-indigo-500" />
                </div>
                {isAssetAdvancedMode ? (
                  <div>
                    <Label className="mb-1">Storage Ref</Label>
                    <input value={assetStorageRef} onChange={(event) => setAssetStorageRef(event.target.value)} placeholder="s3://jobs-wiki-assets/resume_v4.pdf" className="w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-indigo-500" />
                  </div>
                ) : (
                  <div className="rounded-sm border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                    storageRef는 자동 생성됩니다. 고급 모드에서만 직접 지정할 수 있습니다.
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRegisterAsset}
                  disabled={
                    isRegisteringAsset ||
                    !assetFilename.trim() ||
                    !assetMediaType.trim() ||
                    (isAssetAdvancedMode && !assetStorageRef.trim())
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
            <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">문서 메타데이터</h3>
            <div className="space-y-4 text-sm font-medium text-slate-700">
              {detail.layer === "personal_wiki" && generation ? (
                <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4">
                  <div className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">Generation provenance</div>
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-1">Operation</Label>
                      <div className="font-bold text-emerald-950">{generation.operation ?? "unknown"}</div>
                    </div>
                    <div>
                      <Label className="mb-1">Provider</Label>
                      <div className="font-bold text-emerald-950">{generation.provider ?? "unknown"}</div>
                    </div>
                    <div>
                      <Label className="mb-1">Model</Label>
                      <div className="font-bold text-emerald-950">{generation.model ?? "unknown"}</div>
                    </div>
                    <div>
                      <Label className="mb-1">Source document</Label>
                      <div className="font-bold text-emerald-950">
                        {generation.sourceDocument?.title ?? generation.sourceDocument?.documentId ?? "unknown"}
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1">Generated at</Label>
                      <div className="font-bold text-emerald-950">
                        {formatKoreanDateTime(generation.generatedAt) ?? "unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div>
                <Label className="mb-1">Source</Label>
                <div>{detail.metadata?.source?.provider ?? "출처 정보 없음"}</div>
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
                      <span key={tag} className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{tag}</span>
                    ))}
                  </div>
                ) : <div>표시할 태그가 없습니다.</div>}
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
                  <div key={assetRef} className="rounded-sm border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-700">{assetRef}</div>
                    ))}
                  </div>
                ) : <div>연결된 asset이 없습니다.</div>}
              </div>
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">연관 객체</h3>
            {detail.relatedObjects.length ? (
              <div className="space-y-3">
                {detail.relatedObjects.map((object) => (
                  <div key={object.objectId} className="rounded-sm border border-slate-200 bg-slate-50/80 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{object.objectKind}</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{object.title ?? object.objectId}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm font-medium text-slate-500">연결된 객체가 아직 없습니다.</div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
