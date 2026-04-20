import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { WORKSPACE_LAYER_META, DOCUMENT_LAYER_LABELS, getWorkspaceItemIcon } from "./utils.js";
import { Label, InlineNotice } from "./primitives.jsx";

export const WorkspaceNavigationSection = ({ section, currentPath, onNavigatePath, onCreatePersonalDocument }) => {
  const layerMeta = WORKSPACE_LAYER_META[section.sectionId] ?? { emptyLabel: "표시할 항목이 아직 없습니다." };
  const canCreate = section.sectionId === "personal_raw" || section.sectionId === "personal_wiki";
  const sectionLabel = DOCUMENT_LAYER_LABELS[section.sectionId] ?? section.label;

  return (
    <div>
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1">
          <ChevronRight size={11} className="text-slate-600 flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {sectionLabel}
          </span>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => onCreatePersonalDocument(section.sectionId)}
            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
            title="새 문서 만들기"
          >
            +
          </button>
        ) : null}
      </div>

      <div className="ml-3 border-l border-slate-800/60 pl-2">
        {section.items.length ? (
          <div className="space-y-px">
            {section.items.map((item) => {
              const Icon = getWorkspaceItemIcon(item.kind);
              const isActive = Boolean(item.path) && item.path === currentPath;
              const isDisabled = !item.path;
              return (
                <button
                  key={`${section.sectionId}-${item.objectRef?.objectId ?? item.title}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => item.path && onNavigatePath(item.path)}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : isDisabled
                        ? "cursor-not-allowed text-slate-700"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={12} className="flex-shrink-0 opacity-70" />
                  <span className="truncate text-xs font-medium">{item.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-1 text-[11px] font-medium text-slate-700">
            {layerMeta.emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export const CreatePersonalDocumentModal = ({ layer, isSubmitting, error, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");

  useEffect(() => {
    setTitle("");
    setBodyMarkdown("");
  }, [layer]);

  if (!layer) return null;

  const titleLabel = layer === "personal_wiki" ? "personal/wiki 새 문서" : "personal/raw 새 문서";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-2xl rounded-sm border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{titleLabel}</h2>
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
              onClick={() => onSubmit({ layer, title: title.trim(), bodyMarkdown: bodyMarkdown.trim() })}
              className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-40"
            >
              {isSubmitting ? "만드는 중..." : "만들기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
