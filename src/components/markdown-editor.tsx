"use client";

import { MarkdownView } from "@/components/markdown-view";
import { useMemo, useRef, useState } from "react";

type MarkdownEditorProps = {
  defaultValue?: string;
};

const tools = [
  { label: "H2", before: "## ", after: "", fallback: "小标题" },
  { label: "B", before: "**", after: "**", fallback: "加粗文字" },
  { label: "I", before: "*", after: "*", fallback: "斜体文字" },
  { label: "Link", before: "[", after: "](https://example.com)", fallback: "链接文字" },
  { label: "Quote", before: "> ", after: "", fallback: "引用内容" },
  { label: "List", before: "- ", after: "", fallback: "列表项" },
  { label: "Code", before: "```\n", after: "\n```", fallback: "code" },
];

export function MarkdownEditor({ defaultValue = "" }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const stats = useMemo(() => {
    const trimmed = value.trim();

    return {
      chars: value.length,
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      lines: value ? value.split("\n").length : 1,
    };
  }, [value]);

  function insert(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    const cursor = start + before.length + selected.length + after.length;

    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-[0_1px_0_rgba(28,25,23,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-white hover:text-stone-950"
              onClick={() => insert(tool.before, tool.after, tool.fallback)}
              title={tool.label}
            >
              {tool.label}
            </button>
          ))}
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
            placeholder="支持标题、列表、引用、代码块、图片和 [文字](链接)"
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
