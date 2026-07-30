import { parse, HTMLElement, Node, NodeType } from "node-html-parser";
import {
  TEXT_FORMAT,
  textNode,
  linebreakNode,
  paragraphNode,
  headingNode,
  quoteNode,
  listNode,
  listItemNode,
  linkNode,
  uploadNode,
  horizontalRuleNode,
  rootDoc,
} from "./lexical-nodes";

const INLINE_FORMAT_TAGS: Record<string, number> = {
  strong: TEXT_FORMAT.bold,
  b: TEXT_FORMAT.bold,
  em: TEXT_FORMAT.italic,
  i: TEXT_FORMAT.italic,
  u: TEXT_FORMAT.underline,
  s: TEXT_FORMAT.strikethrough,
  strike: TEXT_FORMAT.strikethrough,
  del: TEXT_FORMAT.strikethrough,
  code: TEXT_FORMAT.code,
  sub: TEXT_FORMAT.subscript,
  sup: TEXT_FORMAT.superscript,
};

export type MediaResolver = (src: string) => number | string | undefined;

function walkInline(node: Node, format: number, mediaResolver: MediaResolver, out: any[]) {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const text = node.rawText.replace(/\s+/g, " ");
    if (text.trim().length > 0 || (text.length > 0 && out.length > 0)) {
      out.push(textNode(text, format));
    }
    return;
  }

  if (node.nodeType !== NodeType.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  const tag = el.tagName?.toLowerCase();

  if (tag === "br") {
    out.push(linebreakNode());
    return;
  }

  if (tag === "img") {
    const src = el.getAttribute("src");
    const mediaId = src ? mediaResolver(src) : undefined;
    if (mediaId !== undefined) {
      out.push(uploadNode(mediaId));
    }
    return;
  }

  if (tag === "a") {
    const href = el.getAttribute("href") || "";
    const target = el.getAttribute("target");
    const children: any[] = [];
    for (const child of el.childNodes) {
      walkInline(child, format, mediaResolver, children);
    }
    if (children.length > 0) {
      out.push(linkNode(href, children, target === "_blank"));
    }
    return;
  }

  const addedFormat = INLINE_FORMAT_TAGS[tag] ?? 0;
  const nextFormat = format | addedFormat;
  for (const child of el.childNodes) {
    walkInline(child, nextFormat, mediaResolver, out);
  }
}

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "section",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "blockquote",
  "hr",
  "figure",
  "table",
]);

function walkBlock(node: Node, mediaResolver: MediaResolver, out: any[]) {
  if (node.nodeType === NodeType.TEXT_NODE) {
    // Loose text between block tags (e.g. inside a WPBakery vc_column_text
    // that was typed as plain paragraphs, never wrapped in real <p>/<br>
    // markup) relied on WordPress's wpautop() to turn a blank line into a
    // paragraph break and a single newline into a <br> at render time.
    // Replicate that here, or every such block collapses into one
    // run-on paragraph with all its internal breaks lost.
    const paragraphs = node.rawText
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    for (const paragraph of paragraphs) {
      const lines = paragraph
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const children: any[] = [];
      lines.forEach((line, i) => {
        if (i > 0) children.push(linebreakNode());
        children.push(textNode(line));
      });
      if (children.length > 0) out.push(paragraphNode(children));
    }
    return;
  }

  if (node.nodeType !== NodeType.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  const tag = el.tagName?.toLowerCase();

  if (tag === "hr") {
    out.push(horizontalRuleNode());
    return;
  }

  if (tag === "img") {
    const src = el.getAttribute("src");
    const mediaId = src ? mediaResolver(src) : undefined;
    if (mediaId !== undefined) {
      out.push(uploadNode(mediaId));
    }
    return;
  }

  if (tag === "figure") {
    for (const child of el.childNodes) {
      walkBlock(child, mediaResolver, out);
    }
    return;
  }

  if (/^h[1-6]$/.test(tag || "")) {
    const children: any[] = [];
    for (const child of el.childNodes) walkInline(child, 0, mediaResolver, children);
    if (children.length > 0) out.push(headingNode(tag as any, children));
    return;
  }

  if (tag === "blockquote") {
    const children: any[] = [];
    for (const child of el.childNodes) walkInline(child, 0, mediaResolver, children);
    if (children.length > 0) out.push(quoteNode(children));
    return;
  }

  if (tag === "ul" || tag === "ol") {
    const items: any[] = [];
    let idx = 1;
    for (const child of el.childNodes) {
      if (child.nodeType === NodeType.ELEMENT_NODE && (child as HTMLElement).tagName?.toLowerCase() === "li") {
        const liChildren: any[] = [];
        for (const liChild of (child as HTMLElement).childNodes) {
          walkInline(liChild, 0, mediaResolver, liChildren);
        }
        if (liChildren.length > 0) {
          items.push(listItemNode(liChildren, idx));
          idx += 1;
        }
      }
    }
    if (items.length > 0) out.push(listNode(tag, items));
    return;
  }

  if (tag === "table") {
    // Tables are extracted as plain paragraphs of their text content;
    // full table structure is not modeled in this migration.
    const text = el.text.replace(/\s+/g, " ").trim();
    if (text.length > 0) out.push(paragraphNode([textNode(text)]));
    return;
  }

  if (tag === "p" || (!BLOCK_TAGS.has(tag || "") && tag !== undefined)) {
    // <p> or unknown inline-ish wrapper: treat as a paragraph of inline content,
    // but first check if it contains nested block tags (common in WP div soup).
    const hasBlockChild = el.childNodes.some(
      (c) =>
        c.nodeType === NodeType.ELEMENT_NODE &&
        BLOCK_TAGS.has((c as HTMLElement).tagName?.toLowerCase() || "")
    );
    if (hasBlockChild) {
      for (const child of el.childNodes) walkBlock(child, mediaResolver, out);
      return;
    }
    const children: any[] = [];
    for (const child of el.childNodes) walkInline(child, 0, mediaResolver, children);
    if (children.length > 0) out.push(paragraphNode(children));
    return;
  }

  // div/section: recurse into children as blocks
  for (const child of el.childNodes) {
    walkBlock(child, mediaResolver, out);
  }
}

export function htmlToLexical(html: string, mediaResolver: MediaResolver = () => undefined) {
  if (!html || html.trim().length === 0) {
    return rootDoc([]);
  }
  const root = parse(html, { comment: false });
  const out: any[] = [];
  for (const child of root.childNodes) {
    walkBlock(child, mediaResolver, out);
  }
  return rootDoc(out);
}

export function htmlToPlainText(html: string): string {
  if (!html) return "";
  const root = parse(html, { comment: false });
  return root.text.replace(/\s+/g, " ").trim();
}
