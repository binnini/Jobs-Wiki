import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import {
  WORKSPACE_LAYER_META,
  DOCUMENT_LAYER_LABELS,
  getWorkspaceItemIcon,
} from "./utils.js";
import { Label, InlineNotice } from "./primitives.jsx";

function collectActiveTreeKeys(nodes, currentPath) {
  const activeKeys = new Set();

  const visit = (node) => {
    const children = Array.isArray(node.children) ? node.children : [];
    const selfIsActive = Boolean(node.path) && node.path === currentPath;
    const descendantIsActive = children.some(visit);

    if ((node.nodeType === "folder" && descendantIsActive) || selfIsActive) {
      if (node.workspacePath?.key) {
        activeKeys.add(node.workspacePath.key);
      }
    }

    return selfIsActive || descendantIsActive;
  };

  nodes.forEach(visit);
  return activeKeys;
}

function WorkspaceTreeNode({
  node,
  currentPath,
  expandedKeys,
  onToggle,
  onNavigatePath,
  depth = 0,
}) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isFolder = node.nodeType === "folder";
  const isExpanded = node.workspacePath?.key
    ? expandedKeys.has(node.workspacePath.key)
    : false;
  const isActive = Boolean(node.path) && node.path === currentPath;
  const isAncestorActive =
    !isActive &&
    hasChildren &&
    node.children.some((child) => Boolean(child.path) && child.path === currentPath);
  const Icon = isFolder ? (isExpanded ? FolderOpen : Folder) : getWorkspaceItemIcon(node.kind);

  return (
    <div className="space-y-px">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => {
            if (hasChildren && node.workspacePath?.key) {
              onToggle(node.workspacePath.key);
            } else if (node.path) {
              onNavigatePath(node.path);
            }
          }}
          aria-current={isActive ? "page" : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-all ${
            isActive
              ? "bg-indigo-600 text-white"
              : isAncestorActive
                ? "bg-slate-800/80 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          style={{ paddingLeft: `${0.5 + depth * 0.8}rem` }}
        >
          {hasChildren ? (
            <ChevronRight
              size={11}
              className={`flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          ) : (
            <span className="h-[11px] w-[11px] flex-shrink-0" />
          )}
          <Icon size={12} className="flex-shrink-0 opacity-80" />
          <span className="truncate text-xs font-medium">{node.label ?? node.title}</span>
        </button>
      </div>
      {hasChildren && isExpanded ? (
        <div className="space-y-px">
          {node.children.map((child) => (
            <WorkspaceTreeNode
              key={child.workspacePath?.key ?? `${child.label}-${child.path ?? "folder"}`}
              node={child}
              currentPath={currentPath}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
              onNavigatePath={onNavigatePath}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const WorkspaceNavigationSection = ({
  section,
  currentPath,
  onNavigatePath,
  onCreatePersonalDocument,
}) => {
  const layerMeta = WORKSPACE_LAYER_META[section.sectionId] ?? {
    emptyLabel: "표시할 항목이 아직 없습니다.",
  };
  const canCreate = section.sectionId === "personal_raw" || section.sectionId === "personal_wiki";
  const sectionLabel = DOCUMENT_LAYER_LABELS[section.sectionId] ?? section.label;
  const sectionTree = Array.isArray(section.tree) && section.tree.length ? section.tree : null;
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());

  const activeKeys = useMemo(
    () => collectActiveTreeKeys(sectionTree ?? [], currentPath),
    [sectionTree, currentPath],
  );

  useEffect(() => {
    setExpandedKeys((current) => {
      const next = new Set(current);
      activeKeys.forEach((key) => next.add(key));
      return next;
    });
  }, [activeKeys]);

  const toggleNode = (key) => {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1">
          <ChevronRight size={11} className="flex-shrink-0 text-slate-600" />
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
        {sectionTree ? (
          <div className="space-y-px">
            {sectionTree.map((node) => (
              <WorkspaceTreeNode
                key={node.workspacePath?.key ?? `${node.label}-${node.path ?? "folder"}`}
                node={node}
                currentPath={currentPath}
                expandedKeys={expandedKeys}
                onToggle={toggleNode}
                onNavigatePath={onNavigatePath}
              />
            ))}
          </div>
        ) : section.items.length ? (
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

export const CreatePersonalDocumentModal = ({
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

  if (!layer) return null;

  const titleLabel =
    layer === "personal_wiki" ? "personal/wiki 새 문서" : "personal/raw 새 문서";

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
              onClick={() =>
                onSubmit({
                  layer,
                  title: title.trim(),
                  bodyMarkdown: bodyMarkdown.trim(),
                })
              }
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
