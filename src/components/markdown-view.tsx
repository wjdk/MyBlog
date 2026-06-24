export function MarkdownView({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  function flushList() {
    if (listItems.length) {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="list-disc space-y-2 pl-6">
          {listItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  }

  function flushCode() {
    if (codeLines.length) {
      blocks.push(
        <pre
          key={`code-${blocks.length}`}
          className="overflow-x-auto rounded-lg bg-stone-950 p-4 text-sm leading-7 text-stone-100"
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

    if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-2xl font-semibold text-stone-950">
          {line.slice(4)}
        </h3>,
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="text-3xl font-semibold text-stone-950">
          {line.slice(3)}
        </h2>,
      );
      continue;
    }

    if (line.startsWith("> ")) {
      flushList();
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="border-l-4 border-[#2f6f73] bg-white px-4 py-3 text-stone-700"
        >
          {line.slice(2)}
        </blockquote>,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-9">
        {line}
      </p>,
    );
  }

  flushList();
  flushCode();

  return <div className="space-y-6 text-lg text-stone-800">{blocks}</div>;
}
