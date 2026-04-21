import React from "react";
import { RefreshCw, Search, Zap } from "lucide-react";
import {
  formatDocumentLayerLabel,
  formatProjectionLabel,
  getCommandStatusMeta,
  getSyncMeta,
  isSharedLayer,
} from "./utils.js";

export const WorkspaceRightPanel = ({
  currentView,
  activeDocumentContext,
  activeOpportunityContext,
  workspaceSyncState,
  isRefreshingWorkspaceSync,
  isTriggeringWorkspaceSync,
  activeWorkspaceCommandId,
  onOpenAsk,
  onLoadWorkspaceSync,
  onTriggerWorkspaceIngestion,
}) => (
  <aside className="flex w-72 flex-shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-[#fbf8f2]">
    {currentView === "document" && activeDocumentContext ? (
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">문서</div>
        <div className="text-sm font-bold text-slate-900 truncate">
          {activeDocumentContext.title ?? "문서"}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeDocumentContext.layer ? (
            <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
              {formatDocumentLayerLabel(activeDocumentContext.layer)}
            </span>
          ) : null}
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${isSharedLayer(activeDocumentContext.layer) ? "border-slate-200 bg-slate-100 text-slate-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {isSharedLayer(activeDocumentContext.layer) ? "read-only" : "writable"}
          </span>
        </div>
      </div>
    ) : currentView === "detail" && activeOpportunityContext ? (
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">공고</div>
        <div className="text-sm font-bold text-slate-900 truncate">{activeOpportunityContext.title}</div>
        {activeOpportunityContext.company ? (
          <div className="mt-0.5 text-xs font-medium text-slate-600">{activeOpportunityContext.company}</div>
        ) : null}
        {activeOpportunityContext.deadline ? (
          <div className="mt-1 text-[11px] font-medium text-slate-500">마감: {activeOpportunityContext.deadline}</div>
        ) : null}
        {activeOpportunityContext.urgency ? (
          <div className="mt-1">
            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
              {activeOpportunityContext.urgency}
            </span>
          </div>
        ) : null}
      </div>
    ) : currentView === "ask" && (activeDocumentContext ?? activeOpportunityContext) ? (
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">분석 컨텍스트</div>
        <div className="text-xs font-medium text-slate-700 truncate">
          {activeDocumentContext?.title ?? activeOpportunityContext?.title ?? "워크스페이스 전체"}
        </div>
        {activeDocumentContext?.layer ? (
          <div className="mt-1.5">
            <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
              {formatDocumentLayerLabel(activeDocumentContext.layer)}
            </span>
          </div>
        ) : null}
      </div>
    ) : null}

    <div className="border-b border-slate-100 px-4 py-4">
      <button
        onClick={() => onOpenAsk(activeDocumentContext ?? activeOpportunityContext)}
        className={`w-full rounded-sm border px-3 py-2.5 text-left text-sm font-bold transition-all ${
          currentView === "ask"
            ? "border-slate-300 bg-white text-slate-900 shadow-sm"
            : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900"
        }`}
      >
        <span className="flex items-center">
          <Search size={15} className="mr-2 opacity-80" />
          심층 분석 워크스페이스
        </span>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto">
      <div className="space-y-3 px-4 py-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Sync</div>
        {workspaceSyncState.command?.commandId ? (
          <div className="rounded-sm border border-slate-200 bg-white px-3 py-2">
            {(() => {
              const meta = getCommandStatusMeta(workspaceSyncState.command.status);
              return meta ? (
                <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${meta.className}`}>
                  {meta.label}
                </span>
              ) : null;
            })()}
          </div>
        ) : null}
        {(workspaceSyncState.projections ?? []).map((p) => {
          const meta = getSyncMeta(p);
          return (
            <div key={p.projection} className="flex items-center justify-between rounded-sm border border-slate-100 bg-white px-3 py-2">
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
            onClick={() => onLoadWorkspaceSync({ preserveData: true })}
            disabled={isRefreshingWorkspaceSync}
            className="flex flex-1 items-center justify-center rounded-sm border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={`mr-1.5 ${isRefreshingWorkspaceSync ? "animate-spin" : ""}`} />
            새로고침
          </button>
          <button
            onClick={onTriggerWorkspaceIngestion}
            disabled={isTriggeringWorkspaceSync || Boolean(activeWorkspaceCommandId)}
            className="flex flex-1 items-center justify-center rounded-sm border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <Zap size={13} className="mr-1.5" />
            {isTriggeringWorkspaceSync ? "요청 중..." : Boolean(activeWorkspaceCommandId) ? "처리 중..." : "수동 갱신"}
          </button>
        </div>
      </div>
    </div>
  </aside>
);
