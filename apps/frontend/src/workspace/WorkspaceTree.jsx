import React, { useEffect, useMemo, useRef, useState } from "react";
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

function treeContainsPath(node, currentPath) {
  if (Boolean(node.path) && node.path === currentPath) {
    return true;
  }

  return (Array.isArray(node.children) ? node.children : []).some((child) =>
    treeContainsPath(child, currentPath),
  );
}

function buildVisibleTreeEntries(
  nodes,
  currentPath,
  expandedKeys,
  depth = 0,
  parentKey = null,
) {
  const entries = [];

  for (const node of nodes ?? []) {
    const key = node.workspacePath?.key ?? `${node.label}-${node.path ?? "folder"}`;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isFolder = node.nodeType === "folder";
    const isExpanded = key ? expandedKeys.has(key) : false;
    const isActive = Boolean(node.path) && node.path === currentPath;
    const isAncestorActive = !isActive && hasChildren && treeContainsPath(node, currentPath);

    entries.push({
      key,
      node,
      depth,
      parentKey,
      hasChildren,
      isFolder,
      isExpanded,
      isActive,
      isAncestorActive,
    });

    if (hasChildren && isFolder && isExpanded) {
      entries.push(
        ...buildVisibleTreeEntries(
          node.children,
          currentPath,
          expandedKeys,
          depth + 1,
          key,
        ),
      );
    }
  }

  return entries;
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
  const rowRefs = useRef(new Map());

  const activeKeys = useMemo(
    () => collectActiveTreeKeys(sectionTree ?? [], currentPath),
    [sectionTree, currentPath],
  );

  const visibleEntries = useMemo(
    () =>
      buildVisibleTreeEntries(sectionTree ?? [], currentPath, expandedKeys),
    [sectionTree, currentPath, expandedKeys],
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

  const focusNode = (key) => {
    const row = rowRefs.current.get(key);
    if (row) {
      row.focus();
    }
  };

  const moveFocus = (currentKey, direction) => {
    const currentIndex = visibleEntries.findIndex((entry) => entry.key === currentKey);
    if (currentIndex === -1) {
      return;
    }

    if (direction === "next" && visibleEntries[currentIndex + 1]) {
      focusNode(visibleEntries[currentIndex + 1].key);
    }

    if (direction === "prev" && visibleEntries[currentIndex - 1]) {
      focusNode(visibleEntries[currentIndex - 1].key);
    }
  };

  const handleNodeKeyDown = (event, entry) => {
    if (event.altKey || event.metaKey || event.ctrlKey) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveFocus(entry.key, "next");
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(entry.key, "prev");
        break;
      case "ArrowRight":
        if (entry.hasChildren && entry.isFolder && !entry.isExpanded) {
          event.preventDefault();
          toggleNode(entry.key);
          window.requestAnimationFrame(() => focusNode(entry.key));
        } else if (entry.hasChildren && entry.isFolder) {
          event.preventDefault();
          const firstChild = visibleEntries[visibleEntries.findIndex((item) => item.key === entry.key) + 1];
          if (firstChild) {
            focusNode(firstChild.key);
          }
        }
        break;
      case "ArrowLeft":
        if (entry.hasChildren && entry.isFolder && entry.isExpanded) {
          event.preventDefault();
          toggleNode(entry.key);
          window.requestAnimationFrame(() => focusNode(entry.key));
        } else if (entry.parentKey) {
          event.preventDefault();
          focusNode(entry.parentKey);
        }
        break;
      case "Home":
        event.preventDefault();
        if (visibleEntries[0]) {
          focusNode(visibleEntries[0].key);
        }
        break;
      case "End":
        event.preventDefault();
        if (visibleEntries.at(-1)) {
          focusNode(visibleEntries.at(-1).key);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1">
          <ChevronRight size={11} className="flex-shrink-0 text-slate-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {sectionLabel}
          </span>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => onCreatePersonalDocument({ layer: section.sectionId })}
            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
            title="새 문서 만들기"
          >
            +
          </button>
        ) : null}
      </div>

      <div className="ml-3 border-l border-white/10 pl-2">
        {sectionTree ? (
          <div className="space-y-px">
            {visibleEntries.map((entry) => {
              const {
                key,
                node,
                depth,
                hasChildren,
                isFolder,
                isExpanded,
                isActive,
                isAncestorActive,
              } = entry;
              const Icon = isFolder ? (isExpanded ? FolderOpen : Folder) : getWorkspaceItemIcon(node.kind);

              return (
                <div key={key} className="flex items-center gap-1">
                  <button
                    ref={(element) => {
                      if (element) {
                        rowRefs.current.set(key, element);
                      } else {
                        rowRefs.current.delete(key);
                      }
                    }}
                    type="button"
                    onClick={() => {
                      if (hasChildren && isFolder && key) {
                        toggleNode(key);
                      } else if (node.path) {
                        onNavigatePath(node.path);
                      }
                    }}
                    onKeyDown={(event) => handleNodeKeyDown(event, entry)}
                    aria-current={isActive ? "page" : undefined}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-all ${
                      isActive
                        ? "bg-white/10 text-white"
                        : isAncestorActive
                          ? "bg-white/5 text-slate-100"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
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
                  {canCreate && isFolder && node.workspacePath ? (
                    <button
                      type="button"
                      onClick={() =>
                        onCreatePersonalDocument({
                          layer: section.sectionId,
                          workspacePath: node.workspacePath,
                        })
                      }
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
                      title="이 폴더에 새 문서 만들기"
                    >
                      +
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-1 text-[11px] font-medium text-slate-500">
            {layerMeta.emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export const CreatePersonalDocumentModal = ({
  layer,
  workspacePath,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [workspacePathInput, setWorkspacePathInput] = useState("");

  useEffect(() => {
    setTitle("");
    setBodyMarkdown("");
    setWorkspacePathInput(workspacePath?.segments?.join("/") ?? "");
  }, [layer, workspacePath]);

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
          <div>
            <Label>폴더 경로</Label>
            <input
              value={workspacePathInput}
              onChange={(event) => setWorkspacePathInput(event.target.value)}
              placeholder="projects/alpha"
              className="w-full rounded-sm border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-0 transition-colors focus:border-indigo-500"
            />
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              비워두면 root에 만들고, `folder/subfolder` 형식은 선택한 위치 아래에 생성됩니다.
            </p>
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
                  ...(workspacePathInput.trim()
                    ? {
                        workspacePath: {
                          segments: workspacePathInput
                            .split("/")
                            .map((segment) => segment.trim())
                            .filter(Boolean),
                        },
                      }
                    : {}),
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
