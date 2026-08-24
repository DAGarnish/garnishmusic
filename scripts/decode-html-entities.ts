import { getPayload } from "payload";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  });
}

const APPLY = process.argv.includes("--apply");

// The WP -> Payload migration stored a handful of HTML entities as literal
// text ("&gt;", "&nbsp;") instead of decoding them, so they render as their
// raw entity code (e.g. "Track &gt; Other") rather than the real symbol
// ("Track > Other"). Scoped this to the exact entity set actually present
// in the data (checked via scripts/scope-entities-tmp.ts): &nbsp; &amp; &gt;
// &lt; &#038; and one emoji's numeric-codepoint sequence.
const NAMED: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  gt: ">",
  lt: "<",
  quot: '"',
  apos: "'",
};

const ENTITY_RE = /&(?:([a-zA-Z][a-zA-Z0-9]{1,31})|#([0-9]{1,7})|#[xX]([0-9a-fA-F]{1,6}));/g;

function decodeEntities(text: string): string {
  return text.replace(ENTITY_RE, (whole, named, dec, hex) => {
    if (named) return named in NAMED ? NAMED[named] : whole;
    if (dec !== undefined) return String.fromCodePoint(parseInt(dec, 10));
    if (hex !== undefined) return String.fromCodePoint(parseInt(hex, 16));
    return whole;
  });
}

function walkAndDecode(node: any, changed: { any: boolean }) {
  if (node.type === "text" && typeof node.text === "string") {
    const decoded = decodeEntities(node.text);
    if (decoded !== node.text) {
      node.text = decoded;
      changed.any = true;
    }
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) walkAndDecode(child, changed);
  }
}

// &nbsp; -> plain space leaves runs of multiple spaces (e.g. a paragraph
// that started "&nbsp; TYPES OF REVERB" becomes "  TYPES OF REVERB") and
// leading/trailing space on the block. Collapse and trim per block-level
// node (paragraph/heading/listitem) without touching meaningful single
// spaces between words.
function normalizeWhitespace(root: any) {
  function blockChildren(node: any): any[] {
    if (!Array.isArray(node.children)) return [];
    if (node.type === "paragraph" || node.type === "heading" || node.type === "listitem") {
      return [node];
    }
    return node.children.flatMap(blockChildren);
  }
  const blocks = blockChildren(root);
  for (const block of blocks) {
    const textNodes = block.children.filter((c: any) => c.type === "text");
    for (const tn of textNodes) {
      tn.text = tn.text.replace(/ {2,}/g, " ");
    }
    if (textNodes.length > 0) {
      textNodes[0].text = textNodes[0].text.replace(/^ +/, "");
      textNodes[textNodes.length - 1].text = textNodes[textNodes.length - 1].text.replace(/ +$/, "");
    }
  }
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  const sitesRes = await payload.find({ collection: "sites", limit: 100, depth: 0 });
  const edu: any = (sitesRes.docs as any[]).find((s) => s.slug === "edu");

  const allPosts: any[] = [];
  let page = 1;
  while (true) {
    const res = await payload.find({ collection: "posts", where: { site: { equals: edu.id } }, limit: 200, page, depth: 0 });
    allPosts.push(...res.docs);
    if (page >= res.totalPages) break;
    page++;
  }

  let changedCount = 0;
  for (const p of allPosts) {
    const changed = { any: false };
    walkAndDecode(p.content.root, changed);
    if (!changed.any) continue;
    normalizeWhitespace(p.content.root);
    changedCount++;
    console.log(`${APPLY ? "APPLY" : "DRY"}: id=${p.id} "${p.title}"`);
    if (APPLY) {
      await payload.update({ collection: "posts", id: p.id, data: { content: p.content } as any });
    }
  }

  console.log(`\n${APPLY ? "Updated" : "Would update"} ${changedCount} post(s) out of ${allPosts.length} total.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
