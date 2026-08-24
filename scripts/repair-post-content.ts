import { getPayload } from "payload";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

const APPLY = process.argv.includes("--apply");
const onlyIdsArg = process.argv.find((a) => a.startsWith("--ids="));
const ONLY_IDS = onlyIdsArg ? onlyIdsArg.slice(6).split(",").map(Number) : null;

// A fragment "completes" a paragraph if it ends in sentence-terminal
// punctuation (optionally followed by a closing quote/paren) - anything
// else is treated as a continuation that got wrongly split into its own
// top-level paragraph node during the original WP migration (every text
// node in this content carries format:0, so the original bold/italic that
// caused the split is unrecoverable - merging back into flowing prose is
// the best available repair).
function endsTerminal(text: string): boolean {
  return /[.!?][")’”]?\s*$/.test(text);
}

// No space before these - they're attaching punctuation/suffixes that
// should butt up directly against the preceding fragment.
function needsNoLeadingSpace(text: string): boolean {
  return /^[.,;:!?)’”…]/.test(text) || text.startsWith("'") || text.startsWith("’");
}

type TextNode = { mode: "normal"; text: string; type: "text"; style: string; detail: number; format: number; version: number };

function textNode(text: string, format: number): TextNode {
  return { mode: "normal", text, type: "text", style: "", detail: 0, format, version: 1 };
}

// Converts leftover literal markdown in merged paragraph text into real
// Lexical text-node children with bold/italic format bits, and strips
// [+Label][anchor-slug] internal e-book cross-reference stubs down to just
// the label (there's no live page those anchors can point to anymore).
function parseInlineMarkdown(raw: string): TextNode[] {
  let text = raw.replace(/\[\+([^\]]+)\]\[[^\]]*\]/g, "$1");

  const nodes: TextNode[] = [];
  // Order matters: ** / __ (bold) checked before single * / _ (italic) so
  // "**x**" isn't first consumed as italic-with-leftover-asterisks.
  const pattern = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text))) {
    if (m.index > lastIndex) nodes.push(textNode(text.slice(lastIndex, m.index), 0));
    const bold = m[2] ?? m[3];
    const italic = m[4] ?? m[5];
    if (bold !== undefined) nodes.push(textNode(bold, 1));
    else if (italic !== undefined) nodes.push(textNode(italic, 2));
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(textNode(text.slice(lastIndex), 0));
  if (nodes.length === 0) nodes.push(textNode(text, 0));
  return nodes;
}

function makeParagraph(text: string): any {
  return {
    type: "paragraph",
    format: "",
    indent: 0,
    version: 1,
    children: parseInlineMarkdown(text),
    direction: "ltr",
    textStyle: "",
    textFormat: 0,
  };
}

function flattenParagraphText(node: any): string {
  const parts: string[] = [];
  (function walk(n: any) {
    if (n.type === "text") parts.push(n.text || "");
    if (Array.isArray(n.children)) n.children.forEach(walk);
  })(node);
  return parts.join("");
}

function joinFragments(buffer: string, next: string): string {
  if (buffer.length === 0) return next;
  if (needsNoLeadingSpace(next)) return buffer + next;
  if (/[\s(‘“]$/.test(buffer)) return buffer + next;
  return buffer + " " + next;
}

function mergeParagraphRun(nodes: any[]): any[] {
  // Split each paragraph's text on embedded literal \r\n\r\n (a real
  // paragraph break that survived inside a single node) into sub-fragments.
  const fragments: string[] = [];
  for (const node of nodes) {
    const text = flattenParagraphText(node);
    const parts = text.split(/\r?\n\r?\n/);
    for (const p of parts) fragments.push(p.trim());
  }

  const finalParagraphs: string[] = [];
  let buffer = "";
  for (const frag of fragments) {
    if (frag.length === 0) continue;
    buffer = joinFragments(buffer, frag);
    if (endsTerminal(buffer)) {
      finalParagraphs.push(buffer.trim());
      buffer = "";
    }
  }
  if (buffer.trim().length > 0) finalParagraphs.push(buffer.trim());

  return finalParagraphs.map(makeParagraph);
}

export function repairContent(content: any): { newContent: any; before: number; after: number } {
  const children = content?.root?.children || [];
  const newChildren: any[] = [];
  let run: any[] = [];
  let before = 0;
  let after = 0;

  function flushRun() {
    if (run.length === 0) return;
    before += run.length;
    const merged = mergeParagraphRun(run);
    after += merged.length;
    newChildren.push(...merged);
    run = [];
  }

  for (const node of children) {
    if (node.type === "paragraph") {
      run.push(node);
    } else {
      flushRun();
      newChildren.push(node);
    }
  }
  flushRun();

  return {
    newContent: { ...content, root: { ...content.root, children: newChildren } },
    before,
    after,
  };
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  const sitesRes = await payload.find({ collection: "sites", limit: 100, depth: 0 });
  const eduSite = (sitesRes.docs as any[]).find((s) => s.slug === "edu");

  const allPosts: any[] = [];
  let page = 1;
  while (true) {
    const res = await payload.find({
      collection: "posts",
      where: { site: { equals: eduSite.id } },
      limit: 200,
      page,
      depth: 0,
    });
    allPosts.push(...res.docs);
    if (page >= res.totalPages) break;
    page++;
  }

  let changed = 0;
  for (const p of allPosts) {
    if (ONLY_IDS && !ONLY_IDS.includes(p.id)) continue;
    const { newContent, before, after } = repairContent(p.content);
    if (after === before) continue;
    changed++;
    console.log(`${APPLY ? "APPLY" : "DRY"}: id=${p.id} "${p.title}" paragraphs ${before} -> ${after}`);
    if (ONLY_IDS) {
      // Verbose sample when targeting specific ids for review.
      const sampleText = newContent.root.children
        .filter((n: any) => n.type === "paragraph")
        .slice(0, 6)
        .map((n: any) => flattenParagraphText(n))
        .join("\n---\n");
      console.log(sampleText);
    }
    if (APPLY) {
      await payload.update({ collection: "posts", id: p.id, data: { content: newContent } as any });
    }
  }

  console.log(`\n${APPLY ? "Updated" : "Would update"} ${changed} post(s) out of ${allPosts.length} total.`);
  process.exit(0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
