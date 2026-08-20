import { getPayload } from "payload";
import config from "../payload.config";
import { parse } from "node-html-parser";

const COLLECTIONS = ["pages", "products", "posts"] as const;
const IMG_OR_LINKED_IMG =
  /<a\s[^>]*>\s*<img[^>]*wp-image-13381[^>]*>\s*<\/a>|<img[^>]*wp-image-13381[^>]*\/?>/g;

function isCentered(raw: string, matchStart: number, matchEnd: number): boolean | "unknown" {
  const windowStart = Math.max(0, matchStart - 2000);
  const snippet = raw.slice(windowStart, matchEnd + 50);
  // node-html-parser chokes on WPBakery shortcode tokens like [vc_column_text]
  // only in the sense that it treats them as harmless text nodes - fine for
  // our purposes since we only need element nesting of real HTML tags.
  let root;
  try {
    root = parse(`<div id="__root__">${snippet}</div>`, { lowerCaseTagName: false });
  } catch {
    return "unknown";
  }
  const imgs = root.querySelectorAll("img").filter((el) => (el.getAttribute("class") || "").includes("wp-image-13381"));
  if (imgs.length === 0) return "unknown";
  const target = imgs[imgs.length - 1]; // the one closest to the end of the snippet = our match
  let node: any = target;
  while (node && node.tagName !== undefined) {
    const style = node.getAttribute ? node.getAttribute("style") : undefined;
    if (style && /text-align\s*:\s*center/i.test(style)) return true;
    node = node.parentNode;
  }
  return false;
}

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100, depth: 0 });
  const siteNameById = new Map(sites.docs.map((s: any) => [s.id, s.slug]));

  const broken: { collection: string; id: number; slug: string; site: string; matchStart: number; matchText: string }[] = [];
  const unknown: { collection: string; id: number; slug: string; site: string; matchStart: number; matchText: string }[] = [];
  let totalOccurrences = 0;
  let centeredCount = 0;

  for (const collection of COLLECTIONS) {
    let page = 1;
    let hasNext = true;
    while (hasNext) {
      const result = await payload.find({ collection: collection as any, depth: 0, limit: 100, page });
      for (const doc of result.docs as any[]) {
        const raw = doc.wpRawContent as string | undefined;
        if (!raw) continue;
        const re = new RegExp(IMG_OR_LINKED_IMG.source, "g");
        let m: RegExpExecArray | null;
        while ((m = re.exec(raw))) {
          totalOccurrences++;
          const centered = isCentered(raw, m.index, m.index + m[0].length);
          const siteName = siteNameById.get(doc.site) ?? String(doc.site);
          if (centered === true) {
            centeredCount++;
          } else if (centered === false) {
            broken.push({ collection, id: doc.id, slug: doc.slug ?? "", site: siteName, matchStart: m.index, matchText: m[0] });
          } else {
            unknown.push({ collection, id: doc.id, slug: doc.slug ?? "", site: siteName, matchStart: m.index, matchText: m[0] });
          }
        }
      }
      hasNext = result.hasNextPage;
      page++;
    }
  }

  console.log("total occurrences:", totalOccurrences);
  console.log("centered:", centeredCount);
  console.log("broken (not centered):", broken.length);
  console.log("unknown (parse issue):", unknown.length);

  console.log("\n=== BROKEN ===");
  for (const b of broken) {
    console.log(`${b.collection} id=${b.id} site=${b.site} slug=${b.slug}`);
  }
  console.log("\n=== UNKNOWN ===");
  for (const u of unknown) {
    console.log(`${u.collection} id=${u.id} site=${u.site} slug=${u.slug}`);
  }

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
