import { getPayload } from "payload";
import config from "../payload.config";

const HANDLED = new Set([
  "mkd_accordion",
  "mkd_accordion_tab",
  "mkd_button",
  "mkd_elements_holder",
  "mkd_elements_holder_item",
  "mkd_icon_with_text",
  "mkd_image_with_text",
  "mkd_portfolio_list",
  "mkd_section_title",
  "mkd_testimonials",
  "rev_slider",
  "sr7",
  "vc_column",
  "vc_column_inner",
  "vc_column_text",
  "vc_empty_space",
  "vc_raw_html",
  "vc_row",
  "vc_row_inner",
  "vc_single_image",
]);

const TAG_RE = /\[\/?([a-zA-Z_][a-zA-Z0-9_]*)/g;

async function main() {
  const payload = await getPayload({ config });

  const tagCounts = new Map<string, number>();
  const tagPageCounts = new Map<string, number>();

  for (const collection of ["pages", "posts", "products"] as const) {
    let page = 1;
    for (;;) {
      const result = await payload.find({
        collection,
        limit: 200,
        page,
        depth: 0,
        select: { wpRawContent: true } as any,
      });
      for (const doc of result.docs as any[]) {
        const raw = doc.wpRawContent as string | undefined;
        if (!raw) continue;
        const seenInThisDoc = new Set<string>();
        let m: RegExpExecArray | null;
        TAG_RE.lastIndex = 0;
        while ((m = TAG_RE.exec(raw))) {
          const tag = m[1];
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          seenInThisDoc.add(tag);
        }
        for (const tag of seenInThisDoc) {
          tagPageCounts.set(tag, (tagPageCounts.get(tag) || 0) + 1);
        }
      }
      if (!result.hasNextPage) break;
      page += 1;
    }
    console.log(`processed collection: ${collection}`);
  }

  const unhandled = [...tagPageCounts.entries()]
    .filter(([tag]) => !HANDLED.has(tag) && !["vc_column_text_close"].includes(tag))
    .sort((a, b) => b[1] - a[1]);

  console.log("\n=== UNHANDLED SHORTCODES (tag, pageCount, totalOccurrences) ===");
  for (const [tag, pageCount] of unhandled) {
    console.log(`${tag}\t${pageCount} pages\t${tagCounts.get(tag)} occurrences`);
  }

  console.log(`\nTotal distinct tags seen: ${tagPageCounts.size}`);
  console.log(`Unhandled distinct tags: ${unhandled.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
