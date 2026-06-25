"use client";

import { MarkdownView } from "@/components/markdown-view";
import { useMemo, useRef, useState } from "react";

type MarkdownEditorProps = {
  defaultValue?: string;
};

export function MarkdownEditor({ defaultValue = "" }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const stats = useMemo(() => {
    const trimmed = value.trim();

    return {
      chars: value.length,
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      lines: value ? value.split("\n").length : 1,
    };
  }, [value]);

  function updateText(next: string, cursor?: number) {
    setValue(next);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      if (typeof cursor === "number") {
        textarea.setSelectionRange(cursor, cursor);
      }
    });
  }

  function wrapSelection(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    const cursor = start + before.length + selected.length + after.length;

    updateText(next, cursor);
  }

  function prefixLines(prefix: string, fallback: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const nextSelected = selected
      .split("\n")
      .map((line) => (line ? `${prefix}${line}` : prefix.trimEnd()))
      .join("\n");
    const next = `${value.slice(0, start)}${nextSelected}${value.slice(end)}`;

    updateText(next, start + nextSelected.length);
  }

  function setHeading(level: number) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || "标题";
    const marker = `${"#".repeat(level)} `;
    const nextSelected = selected
      .split("\n")
      .map((line) => `${marker}${line.replace(/^#{1,6}\s+/, "")}`)
      .join("\n");
    const next = `${value.slice(0, start)}${nextSelected}${value.slice(end)}`;

    updateText(next, start + nextSelected.length);
  }

  function insertBlock(markdown: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(textarea.selectionEnd);
    const needsLeadingBreak = before && !before.endsWith("\n") ? "\n\n" : "";
    const needsTrailingBreak = after && !after.startsWith("\n") ? "\n\n" : "";
    const block = `${needsLeadingBreak}${markdown}${needsTrailingBreak}`;
    const next = `${before}${block}${after}`;

    updateText(next, start + block.length);
  }

  function formatMarkdown() {
    const next = value
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) =>
        line
          .replace(/[ \t]+$/g, "")
          .replace(/^(#{1,6})([^#\s])/g, "$1 $2")
          .replace(/^([-*])([^\s])/g, "$1 $2")
          .replace(/^(\d+\.)([^\s])/g, "$1 $2")
          .replace(/^(>)([^\s])/g, "$1 $2"),
      )
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    updateText(next ? `${next}\n` : "");
  }

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-[0_1px_0_rgba(28,25,23,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <div className="relative">
            <button
              type="button"
              className="h-9 rounded-lg px-2.5 text-lg font-semibold text-stone-700 transition hover:bg-white hover:text-stone-950"
              title="标题"
              aria-haspopup="menu"
              aria-expanded={headingMenuOpen}
              onClick={() => setHeadingMenuOpen((open) => !open)}
            >
              H
            </button>
            {headingMenuOpen ? (
              <div className="absolute left-0 top-10 z-20 w-36 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-[0_18px_45px_rgba(28,25,23,0.14)]">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
                    onClick={() => {
                      setHeading(level);
                      setHeadingMenuOpen(false);
                    }}
                  >
                    H{level} {levelText(level)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <ToolButton label="B" title="加粗" onClick={() => wrapSelection("**", "**", "加粗文字")} />
          <ToolButton label="I" title="斜体" italic onClick={() => wrapSelection("*", "*", "斜体文字")} />
          <ToolButton label="🔗" title="链接" onClick={() => wrapSelection("[", "](https://example.com)", "链接文字")} />
          <ToolButton
            label="表"
            title="表格"
            onClick={() =>
              insertBlock("| 标题 | 说明 |\n| --- | --- |\n| 内容 | 内容 |")
            }
          />
          <ToolButton label="❝" title="引用" onClick={() => prefixLines("> ", "引用内容")} />
          <ToolButton
            label="图"
            title="图片"
            onClick={() => wrapSelection("![", "](https://example.com/image.jpg)", "图片说明")}
          />
          <ToolButton label="</>" title="代码块" onClick={() => wrapSelection("```\n", "\n```", "code")} />
          <ToolButton label="格式化" title="格式化 Markdown" onClick={formatMarkdown} />
        </div>

        <div className="flex rounded-full bg-white p-1 text-xs font-medium text-stone-600">
          {(["edit", "split", "preview"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-full px-3 py-1 transition ${
                mode === item ? "bg-stone-950 text-white" : "hover:bg-stone-100"
              }`}
              onClick={() => setMode(item)}
            >
              {item === "edit" ? "编辑" : item === "split" ? "分屏" : "预览"}
            </button>
          ))}
        </div>
      </div>

      <div className={mode === "split" ? "grid lg:grid-cols-2" : ""}>
        {mode !== "preview" ? (
          <textarea
            ref={textareaRef}
            required
            name="content"
            value={value}
            rows={18}
            className="min-h-[28rem] w-full resize-y border-0 bg-white px-4 py-4 font-mono text-sm leading-7 text-stone-950 outline-none"
            placeholder="支持多级标题、表格、引用、代码块、图片和 [文字](链接)"
            onChange={(event) => setValue(event.target.value)}
          />
        ) : null}

        {mode !== "edit" ? (
          <div className="min-h-[28rem] border-t border-stone-200 bg-[#fffdf8] px-5 py-5 lg:border-l lg:border-t-0">
            {value.trim() ? (
              <MarkdownView content={value} />
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
                预览会显示在这里。
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-500">
        <span>Markdown</span>
        <span>
          {stats.lines} 行 · {stats.words} 词 · {stats.chars} 字符
        </span>
      </div>
    </div>
  );
}

function levelText(level: number) {
  return ["一级标题", "二级标题", "三级标题", "四级标题", "五级标题", "六级标题"][
    level - 1
  ];
}

function ToolButton({
  label,
  title,
  italic,
  onClick,
}: {
  label: string;
  title: string;
  italic?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`h-9 rounded-lg px-2.5 text-sm font-semibold text-stone-700 transition hover:bg-white hover:text-stone-950 ${
        italic ? "italic" : ""
      }`}
      title={title}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
