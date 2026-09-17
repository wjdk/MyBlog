import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownView } from "./markdown-view";

function render(content: string) {
  return renderToStaticMarkup(<MarkdownView content={content} />);
}

test("renders the screenshot's inline, bold and multiline display formulas", () => {
  const html = render(String.raw`### 题目概括
给定长度为 \(n\) (\(n\le10^6\)) 的数组 \(A,B,C\)。
$$
a_i\le a_j,\quad b_i\le b_j
$$
经过交换使 **\(B=C\)**。
无需 \(O(n^2)\) 建图。`);
  assert.equal((html.match(/class="katex"/g) ?? []).length, 6);
  assert.match(html, /class="math-display"/);
  assert.match(html, /<strong><span class="math-inline">/);
  assert.doesNotMatch(html, /katex-error/);
});

test("supports dollar math and bracket blocks including CRLF and matrices", () => {
  const html = render(String.raw`$x^2$ and $$y_1$$
\[
\begin{pmatrix}a & b \\ c & d\end{pmatrix}
\]
$$z=1$$`.replaceAll("\n", "\r\n"));
  assert.equal((html.match(/class="katex"/g) ?? []).length, 4);
  assert.equal((html.match(/class="math-display"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /katex-error/);
});

test("keeps code, escaped currency and unclosed delimiters literal", () => {
  const html = render('`\\(x\\)` and `$y$`\n```latex\n$$\nx^2\n$$\n```\n\\$5 and \\$10\n\\(unfinished\n$$\nunfinished');
  assert.doesNotMatch(html, /class="katex"/);
  assert.match(html, /<code>\$\$\nx\^2\n\$\$<\/code>/);
  assert.match(html, /\$5 and \$10/);
  assert.match(html, /unfinished/);
});

test("renders formulas inside lists, tables, quotes and details", () => {
  const html = render(String.raw`- \(x\)

1. $y$

> \(z\)
| Value |
| --- |
| $a$ |
<details>
<summary>\(b\)</summary>
\(c\)
</details>`);
  assert.equal((html.match(/class="katex"/g) ?? []).length, 6);
});

test("invalid or untrusted LaTeX cannot crash rendering or inject HTML", () => {
  const html = render(String.raw`\(\notARealCommand{x}\)
\(\frac{1}{\)
\(\href{javascript:alert(1)}{click}\)
\(\htmlClass{injected}{x}\)
<script>alert(1)</script>`);
  assert.match(html, /katex-error/);
  assert.doesNotMatch(html, /href="javascript:|class="injected"|<script>/);
});
