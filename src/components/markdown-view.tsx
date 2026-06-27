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

  function pushTable(startIndex: number) {
    const rows: string[][] = [];
    let currentIndex = startIndex;

    while (currentIndex < lines.length && isTableRow(lines[currentIndex])) {
      rows.push(parseTableRow(lines[currentIndex]));
      currentIndex += 1;
    }

    if (rows.length < 2 || !isDividerRow(rows[1])) {
      return startIndex;
    }

    blocks.push(
      <div key={`table-${blocks.length}`} className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full border-collapse text-left text-base">
          <thead className="bg-stone-100 text-stone-950">
            <tr>
              {rows[0].map((cell, index) => (
                <th key={`${cell}-${index}`} className="border-b border-stone-200 px-4 py-3 font-semibold">
                  {renderInline(cell, `th-${blocks.length}-${index}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(2).map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="border-b border-stone-100 last:border-0">
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="px-4 py-3 text-stone-700">
                    {renderInline(cell, `td-${blocks.length}-${rowIndex}-${cellIndex}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );

    return currentIndex;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/\r$/, "");
    const blockLine = line.trimStart();

    if (blockLine.startsWith("```")) {
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

    if (isTableRow(line) && index + 1 < lines.length && isTableRow(lines[index + 1])) {
      flushList();
      const nextIndex = pushTable(index);
      if (nextIndex !== index) {
        index = nextIndex - 1;
        continue;
      }
    }

    if (blockLine.toLowerCase() === "<details>") {
      flushList();
      const detailLines: string[] = [];
      let summary = "展开内容";
      let currentIndex = index + 1;

      while (currentIndex < lines.length) {
        const detailLine = lines[currentIndex].replace(/\r$/, "");
        const trimmedDetailLine = detailLine.trim();
        const summaryMatch = trimmedDetailLine.match(/^<summary>(.*)<\/summary>$/i);

        if (summaryMatch) {
          summary = summaryMatch[1].trim() || summary;
          currentIndex += 1;
          continue;
        }

        if (trimmedDetailLine.toLowerCase() === "</details>") {
          break;
        }

        detailLines.push(detailLine);
        currentIndex += 1;
      }

      blocks.push(
        <details
          key={`details-${blocks.length}`}
          className="rounded-2xl border border-stone-200 bg-white/80 p-5"
        >
          <summary className="cursor-pointer font-semibold text-[#2f6f73]">
            {renderInline(summary, `summary-${blocks.length}`)}
          </summary>
          <div className="mt-5">
            <MarkdownView content={detailLines.join("\n")} />
          </div>
        </details>,
      );

      index = currentIndex;
      continue;
    }

    if (blockLine.startsWith("# ")) {
      flushList();
      blocks.push(
        <h1 key={`h1-${blocks.length}`} className="pt-4 font-serif text-4xl font-semibold text-stone-950 text-balance">
          {renderInline(blockLine.slice(2), `h1-${blocks.length}`)}
        </h1>,
      );
      continue;
    }

    const headingMatch = blockLine.match(/^(#{4,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const className =
        level === 4
          ? "pt-2 text-xl font-semibold text-stone-950 text-balance"
          : "pt-1 text-lg font-semibold text-stone-950 text-balance";
      const Heading = `h${level}` as "h4" | "h5" | "h6";

      blocks.push(
        <Heading key={`h${level}-${blocks.length}`} className={className}>
          {renderInline(headingMatch[2], `h${level}-${blocks.length}`)}
        </Heading>,
      );
      continue;
    }

    if (blockLine.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="pt-2 text-2xl font-semibold text-stone-950 text-balance">
          {renderInline(blockLine.slice(4), `h3-${blocks.length}`)}
        </h3>,
      );
      continue;
    }

    if (blockLine.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="pt-4 font-serif text-3xl font-semibold text-stone-950 text-balance">
          {renderInline(blockLine.slice(3), `h2-${blocks.length}`)}
        </h2>,
      );
      continue;
    }

    if (blockLine.startsWith("> ")) {
      flushList();
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="rounded-r-2xl border-l-4 border-[#2f6f73] bg-white/80 px-5 py-4 text-stone-700"
        >
          {renderInline(blockLine.slice(2), `quote-${blocks.length}`)}
        </blockquote>,
      );
      continue;
    }

    if (blockLine.startsWith("- ")) {
      orderedListItems = [];
      listItems.push(blockLine.slice(2));
      continue;
    }

    const orderedMatch = blockLine.match(/^\d+\.\s+(.+)$/);
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

  return <div className="markdown-body space-y-7 text-lg text-stone-800">{blocks}</div>;
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

function isTableRow(line: string) {
  return /^\s*\|.+\|\s*$/.test(line);
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isDividerRow(row: string[]) {
  return row.every((cell) => /^:?-{3,}:?$/.test(cell));
}
