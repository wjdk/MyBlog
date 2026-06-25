import type { ReactNode } from "react";

export function MarkdownView({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let orderedListItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  function flushList() {
    if (listItems.length) {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="list-disc space-y-2 pl-6 marker:text-[#2f6f73]">
          {listItems.map((item, index) => (
            <li key={`${item}-${index}`}>{renderInline(item, `ul-${blocks.length}-${index}`)}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }

    if (orderedListItems.length) {
      blocks.push(
        <ol key={`olist-${blocks.length}`} className="list-decimal space-y-2 pl-6 marker:text-[#2f6f73]">
          {orderedListItems.map((item, index) => (
            <li key={`${item}-${index}`}>{renderInline(item, `ol-${blocks.length}-${index}`)}</li>
          ))}
        </ol>,
      );
      orderedListItems = [];
    }
  }

  function flushCode() {
    if (codeLines.length) {
      blocks.push(
        <pre
          key={`code-${blocks.length}`}
          className="overflow-x-auto rounded-2xl bg-stone-950 p-5 text-sm leading-7 text-stone-100 shadow-[0_18px_45px_rgba(28,25,23,0.18)]"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      codeLines = [];
    }
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        flushList();
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushList();
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      blocks.push(
        <h1 key={`h1-${blocks.length}`} className="pt-4 font-serif text-4xl font-semibold text-stone-950 text-balance">
          {renderInline(line.slice(2), `h1-${blocks.length}`)}
        </h1>,
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="pt-2 text-2xl font-semibold text-stone-950 text-balance">
          {renderInline(line.slice(4), `h3-${blocks.length}`)}
        </h3>,
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="pt-4 font-serif text-3xl font-semibold text-stone-950 text-balance">
          {renderInline(line.slice(3), `h2-${blocks.length}`)}
        </h2>,
      );
      continue;
    }

    if (line.startsWith("> ")) {
      flushList();
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="rounded-r-2xl border-l-4 border-[#2f6f73] bg-white/80 px-5 py-4 text-stone-700"
        >
          {renderInline(line.slice(2), `quote-${blocks.length}`)}
        </blockquote>,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      orderedListItems = [];
      listItems.push(line.slice(2));
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      listItems = [];
      orderedListItems.push(orderedMatch[1]);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-9 text-pretty">
        {renderInline(line, `p-${blocks.length}`)}
      </p>,
    );
  }

  flushList();
  flushCode();

  return <div className="space-y-7 text-lg text-stone-800">{blocks}</div>;
}

function renderInline(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|!\[[^\]]*]\([^)]+\)|\[[^\]]+]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const value = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (value.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-sm text-stone-900">
          {value.slice(1, -1)}
        </code>,
      );
    } else if (value.startsWith("![")) {
      const image = value.match(/^!\[([^\]]*)]\(([^)]+)\)$/);
      if (image) {
        nodes.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={safeUrl(image[2])}
            alt={image[1]}
            className="my-5 max-h-[520px] w-full rounded-2xl object-cover"
          />,
        );
      }
    } else if (value.startsWith("[")) {
      const link = value.match(/^\[([^\]]+)]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <a
            key={key}
            href={safeUrl(link[2])}
            className="font-medium text-[#2f6f73] underline decoration-[#2f6f73]/30 underline-offset-4 transition hover:text-[#24575a]"
            rel="noreferrer"
            target={isExternalUrl(link[2]) ? "_blank" : undefined}
          >
            {link[1]}
          </a>,
        );
      }
    } else if (value.startsWith("**")) {
      nodes.push(<strong key={key}>{value.slice(2, -2)}</strong>);
    } else if (value.startsWith("*")) {
      nodes.push(<em key={key}>{value.slice(1, -1)}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
}

function safeUrl(url: string) {
  const value = url.trim();

  if (
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:")
  ) {
    return value;
  }

  return "#";
}

function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url);
}
