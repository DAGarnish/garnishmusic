import { getPayload } from "payload";
import config from "../payload.config";

// User request (2026-09-03): remove the "Garnish Music School in Los
// Angeles" video (youtu.be/lw8jCikgUxs) from every page on staging. This
// finds every real [vc_video link="..."] embed across edu's (site 15)
// pages and how many times each URL is reused, to confirm it's a shared
// boilerplate clip rather than page-specific content.
async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: 15 } }, { wpRawContent: { like: "%vc_video%" } }] },
    limit: 200,
    depth: 0,
  });
  console.log("total pages with vc_video on edu:", res.totalDocs);
  const linkCounts = new Map<string, { count: number; slugs: string[] }>();
  for (const doc of res.docs as any[]) {
    const raw = doc.wpRawContent || "";
    for (const m of raw.matchAll(/\[vc_video\s+link="([^"]*)"/gi)) {
      const link = m[1];
      const entry = linkCounts.get(link) || { count: 0, slugs: [] };
      entry.count++;
      entry.slugs.push(doc.slug);
      linkCounts.set(link, entry);
    }
  }
  const sorted = [...linkCounts.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [link, info] of sorted) {
    console.log(`\n${link} (${info.count}x)`);
    console.log("  ", info.slugs.slice(0, 30).join(", "));
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
