import { getPayload } from "payload";
import config from "../payload.config";
import { parse } from "node-html-parser";

// Sitewide follow-up to scripts/center-connect-button.ts (which fixed ny's
// private-instruction page). The CONNECT button graphic (connect-button.png
// / wp-image-13381) is reused as a shared CTA across ~300 pages network-
// wide. app/globals.css's `.wpb-content-wrapper img:not(...) { display:
// inline }` rule means every use of this image only renders centered when
// some ancestor element carries an inline `text-align: center` style -
// otherwise it's flush left. This script finds every occurrence across all
// sites that lacks such an ancestor and wraps just that occurrence in
// `<p style="text-align: center;">...</p>`, matching the pattern already
// used by the majority (156/506) of existing correct occurrences on the
// same pages.
const IMG_OR_LINKED_IMG =
  /<a\s[^>]*>\s*<img[^>]*wp-image-13381[^>]*>\s*<\/a>|<img[^>]*wp-image-13381[^>]*\/?>/g;

function isCentered(raw: string, matchStart: number, matchEnd: number): boolean | "unknown" {
  const windowStart = Math.max(0, matchStart - 2000);
  const snippet = raw.slice(windowStart, matchEnd + 50);
  let root;
  try {
    root = parse(`<div id="__root__">${snippet}</div>`, { lowerCaseTagName: false });
  } catch {
    return "unknown";
  }
  const imgs = root.querySelectorAll("img").filter((el) => (el.getAttribute("class") || "").includes("wp-image-13381"));
  if (imgs.length === 0) return "unknown";
  const target = imgs[imgs.length - 1];
  let node: any = target;
  while (node && node.tagName !== undefined) {
    const style = node.getAttribute ? node.getAttribute("style") : undefined;
    if (style && /text-align\s*:\s*center/i.test(style)) return true;
    node = node.parentNode;
  }
  return false;
}

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const payload = await getPayload({ config });

  let page = 1;
  let hasNext = true;
  let docsUpdated = 0;
  let occurrencesWrapped = 0;
  const skippedUnknown: number[] = [];

  while (hasNext) {
    const result = await payload.find({ collection: "pages", depth: 0, limit: 100, page });
    for (const doc of result.docs as any[]) {
      const raw = doc.wpRawContent as string | undefined;
      if (!raw) continue;

      const re = new RegExp(IMG_OR_LINKED_IMG.source, "g");
      const matches: { start: number; end: number; text: string; centered: boolean | "unknown" }[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw))) {
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          centered: isCentered(raw, m.index, m.index + m[0].length),
        });
      }

      const broken = matches.filter((x) => x.centered === false);
      const unknown = matches.filter((x) => x.centered === "unknown");
      if (unknown.length > 0) skippedUnknown.push(doc.id);
      if (broken.length === 0) continue;

      // Apply wraps back-to-front so earlier offsets stay valid.
      let updated = raw;
      for (const b of [...broken].sort((a, c) => c.start - a.start)) {
        updated = updated.slice(0, b.start) + `<p style="text-align: center;">${b.text}</p>` + updated.slice(b.end);
      }

      if (!DRY_RUN) {
        await payload.update({ collection: "pages", id: doc.id, data: { wpRawContent: updated } });
      }
      docsUpdated++;
      occurrencesWrapped += broken.length;
      console.log(`${DRY_RUN ? "[dry-run] would update" : "updated"} page id=${doc.id} slug=${doc.slug} - wrapped ${broken.length} occurrence(s)`);
    }
    hasNext = result.hasNextPage;
    page++;
  }

  console.log("\ndone. docs updated:", docsUpdated, "occurrences wrapped:", occurrencesWrapped);
  if (skippedUnknown.length > 0) {
    console.log("docs with at least one unknown/unparseable occurrence (left untouched for those):", skippedUnknown);
  }

  process.exit(0);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
