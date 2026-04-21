import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { formatSurfaceLabel, getSurfaceRetryLabel, getSurfaceSyncGuidance } from "./utils.js";

export const Label = ({ children, className = "" }) => (
  <div className={`mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 ${className}`}>
    {children}
  </div>
);

export const MetaTag = ({ icon: Icon, children }) => (
  <span className="mr-5 inline-flex items-center text-sm font-medium text-slate-600">
    <Icon size={15} className="mr-2 text-slate-400" />
    {children}
  </span>
);

export const Panel = ({ children, className = "", noPadding = false }) => (
  <div className={`rounded-sm border border-slate-200/80 bg-white/95 ${noPadding ? "" : "p-6"} ${className}`}>
    {children}
  </div>
);

export function renderInlineBold(text, keyPrefix) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export function StructuredResponse({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-4 text-base leading-loose text-slate-800">
      {lines.map((line, index) => {
        if (!line.trim()) return <div key={`sp-${index}`} className="h-2" />;
        if (line.startsWith("### ")) {
          return (
            <h3 key={`h3-${index}`} className="border-b border-slate-100 pb-2 pt-4 text-xl font-bold text-slate-900">
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return <div key={`ol-${index}`} className="ml-4 font-bold text-slate-900">{renderInlineBold(line, `ol-${index}`)}</div>;
        }
        if (line.startsWith("- ")) {
          return <div key={`li-${index}`} className="ml-4 font-medium text-slate-700">{renderInlineBold(line.replace("- ", ""), `li-${index}`)}</div>;
        }
        return <p key={`p-${index}`} className="font-medium text-slate-700">{renderInlineBold(line, `p-${index}`)}</p>;
      })}
    </div>
  );
}

export const InlineNotice = ({ title, message, className = "" }) => (
  <div className={`rounded-sm border px-4 py-3 ${className}`}>
    <div className="text-sm font-bold">{title}</div>
    {message ? <p className="mt-1 text-sm leading-relaxed">{message}</p> : null}
  </div>
);

export const RetryPanel = ({ title, message, onRetry, retryLabel = "다시 시도", secondaryAction }) => (
  <div className="mx-auto max-w-3xl rounded-sm border border-slate-200/80 bg-white/95 p-8">
    <div className="mb-4 flex items-center text-amber-700">
      <AlertCircle size={20} className="mr-3" />
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
    </div>
    <p className="mb-6 text-sm leading-relaxed text-slate-600">{message}</p>
    <div className="flex flex-wrap gap-3">
      <button onClick={onRetry} className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white">
        {retryLabel}
      </button>
      {secondaryAction}
    </div>
  </div>
);

export const SyncNotice = ({ surface, sync, refreshError, onRetry, isRetrying = false }) => {
  const syncGuidance = getSurfaceSyncGuidance(surface, sync);
  const showRetryAction = Boolean(onRetry && (refreshError || syncGuidance?.showRetry || sync?.refreshRecommended));

  if (!syncGuidance && !refreshError && !showRetryAction) return null;

  return (
    <div className="space-y-3">
      {syncGuidance ? (
        <InlineNotice title={syncGuidance.title} message={syncGuidance.message} className={syncGuidance.className} />
      ) : null}
      {refreshError ? (
        <InlineNotice
          title={`${formatSurfaceLabel(surface)} 다시 확인에 실패했습니다`}
          message={refreshError.message}
          className={refreshError.retryable ? "border-amber-200 bg-amber-50 text-amber-900" : "border-rose-200 bg-rose-50 text-rose-900"}
        />
      ) : null}
      {showRetryAction ? (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-slate-200/80 bg-white/95 px-4 py-3">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center rounded-sm border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`mr-2 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying
              ? `${formatSurfaceLabel(surface)} 다시 확인 중...`
              : getSurfaceRetryLabel(surface, sync, refreshError)}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export const BlockPlaceholder = ({ title, description }) => (
  <Panel className="border-dashed bg-slate-50">
    <Label>{title}</Label>
    <p className="text-sm leading-relaxed text-slate-500">{description}</p>
  </Panel>
);

export const DetailLoadingView = () => (
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
