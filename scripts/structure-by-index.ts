// Generic surgical structure-adder: operates on a post's EXISTING paragraph
// nodes by original index, reusing node objects unchanged wherever possible
// (zero retype risk) and only inserting headings / splitting text where a
// heading label is glued to a paragraph's start. Safer than full hand-retype
// for long, already-clean posts (no OCR corruption to fix).
import { getPayload } from "payload";
import fs from "fs";
import path from "path";
import { t, link, heading as makeHeading } from "./add-post-structure";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  });
}

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

function flatten(node: any): string {
  const parts: string[] = [];
  (function walk(n: any) {
    if (n.type === "text") parts.push(n.text || "");
    if (Array.isArray(n.children)) n.children.forEach(walk);
  })(node);
  return parts.join("");
}

function words(s: string): string[] {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function multisetDiff(a: string[], b: string[]) {
  const count = new Map<string, number>();
  for (const w of a) count.set(w, (count.get(w) || 0) + 1);
  for (const w of b) count.set(w, (count.get(w) || 0) - 1);
  const missing: string[] = [];
  const extra: string[] = [];
  for (const [w, c] of count) {
    if (c > 0) for (let i = 0; i < c; i++) missing.push(w);
    if (c < 0) for (let i = 0; i < -c; i++) extra.push(w);
  }
  return { missing, extra };
}

function boldTerms(node: any, terms: string[]) {
  const text = flatten(node);
  let remaining = text;
  const children: any[] = [];
  let termsLeft = [...terms];
  while (remaining.length > 0) {
    let earliest: { idx: number; term: string } | null = null;
    for (const term of termsLeft) {
      const idx = remaining.indexOf(term);
      if (idx !== -1 && (earliest === null || idx < earliest.idx)) earliest = { idx, term };
    }
    if (!earliest) {
      children.push(t(remaining));
      break;
    }
    if (earliest.idx > 0) children.push(t(remaining.slice(0, earliest.idx)));
    children.push(t(earliest.term, 1));
    remaining = remaining.slice(earliest.idx + earliest.term.length);
    termsLeft = termsLeft.filter((x) => x !== earliest!.term);
  }
  node.children = children;
}

export type Op =
  | { kind: "headingBefore"; index: number; text: string; tag?: "h2" | "h3" }
  | { kind: "split"; index: number; headingText: string; tag?: "h2" | "h3"; bodyPrefix: string }
  | { kind: "splitTwo"; index: number; midHeadingText: string; midTag?: "h2" | "h3"; firstPart: string; secondPart: string }
  | { kind: "bold"; index: number; terms: string[] }
  | { kind: "replaceText"; index: number; text: string }
  | { kind: "delete"; index: number }
  | { kind: "toHeading"; index: number; text?: string; tag?: "h2" | "h3" }
  | { kind: "expand"; index: number; texts: string[] }
  | { kind: "linkify"; index: number; matchText: string; linkText: string; url: string };

export async function runOps(postId: number, ops: Op[]) {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });
  const p: any = await payload.findByID({ collection: "posts", id: postId, depth: 0 });
  const origChildren = p.content.root.children;
  const origText = origChildren.map(flatten).join(" ");

  const byIndex = new Map<number, Op[]>();
  for (const op of ops) {
    if (!byIndex.has(op.index)) byIndex.set(op.index, []);
    byIndex.get(op.index)!.push(op);
  }

  const newChildren: any[] = [];
  origChildren.forEach((node: any, i: number) => {
    const nodeOps = byIndex.get(i) || [];
    const deleteOp = nodeOps.find((o) => o.kind === "delete");
    if (deleteOp) return;

    for (const op of nodeOps) {
      if (op.kind === "headingBefore") {
        newChildren.push(makeHeading(op.text, op.tag || "h2"));
      }
    }

    const splitOp = nodeOps.find((o) => o.kind === "split") as Extract<Op, { kind: "split" }> | undefined;
    const splitTwoOp = nodeOps.find((o) => o.kind === "splitTwo") as Extract<Op, { kind: "splitTwo" }> | undefined;
    const replaceOp = nodeOps.find((o) => o.kind === "replaceText") as Extract<Op, { kind: "replaceText" }> | undefined;
    const boldOp = nodeOps.find((o) => o.kind === "bold") as Extract<Op, { kind: "bold" }> | undefined;
    const linkOp = nodeOps.find((o) => o.kind === "linkify") as Extract<Op, { kind: "linkify" }> | undefined;
    const toHeadingOp = nodeOps.find((o) => o.kind === "toHeading") as Extract<Op, { kind: "toHeading" }> | undefined;
    const expandOp = nodeOps.find((o) => o.kind === "expand") as Extract<Op, { kind: "expand" }> | undefined;

    if (expandOp) {
      for (const text of expandOp.texts) {
        newChildren.push({ ...node, children: [t(text)] });
      }
    } else if (toHeadingOp) {
      newChildren.push(makeHeading(toHeadingOp.text || flatten(node).replace(/\.$/, ""), toHeadingOp.tag || "h2"));
    } else if (splitOp) {
      newChildren.push(makeHeading(splitOp.headingText, splitOp.tag || "h3"));
      node.children = [t(splitOp.bodyPrefix)];
      if (boldOp) boldTerms(node, boldOp.terms);
      newChildren.push(node);
    } else if (splitTwoOp) {
      node.children = [t(splitTwoOp.firstPart)];
      newChildren.push(node);
      newChildren.push(makeHeading(splitTwoOp.midHeadingText, splitTwoOp.midTag || "h3"));
      const second = { ...node, children: [t(splitTwoOp.secondPart)] };
      newChildren.push(second);
    } else if (replaceOp) {
      node.children = [t(replaceOp.text)];
      if (boldOp) boldTerms(node, boldOp.terms);
      newChildren.push(node);
    } else {
      if (boldOp) boldTerms(node, boldOp.terms);
      if (linkOp) {
        const text = flatten(node);
        const idx = text.indexOf(linkOp.matchText);
        if (idx === -1) {
          console.log(`WARN: linkify match not found at index ${i}: "${linkOp.matchText}"`);
        } else {
          const before = text.slice(0, idx);
          const after = text.slice(idx + linkOp.matchText.length);
          const children: any[] = [];
          if (before) children.push(t(before));
          children.push(link(linkOp.linkText, linkOp.url));
          if (after) children.push(t(after));
          node.children = children;
        }
      }
      newChildren.push(node);
    }
  });

  const newText = newChildren.map(flatten).join(" ");
  const { missing, extra } = multisetDiff(words(origText), words(newText));
  console.log(`id=${postId} "${p.title}" -> ${newChildren.length} nodes (${newChildren.filter((c) => c.type === "heading").length} headings)`);
  if (missing.length || extra.length) {
    console.log(`MISSING (${missing.length}):`, missing.slice(0, 300).join(" | "));
    console.log(`EXTRA (${extra.length}):`, extra.slice(0, 300).join(" | "));
  } else {
    console.log("Word-for-word match confirmed.");
  }

  if (APPLY) {
    if (missing.length > 0 && !FORCE) {
      console.log("Refusing to apply: missing words detected (pass --force after manual review).");
      process.exit(1);
    }
    const newContent = { ...p.content, root: { ...p.content.root, children: newChildren } };
    await payload.update({ collection: "posts", id: postId, data: { content: newContent } as any });
    console.log("Applied.");
  }
  process.exit(0);
}
