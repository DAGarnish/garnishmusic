import { getPayload } from "payload";
import config from "../payload.config";

// Sitewide search for every use of the "CONNECT" button graphic
// (connect-button.png / wp-image-13381, the same shared asset fixed on ny's
// private-instruction page) across all sites, to check whether each one is
// wrapped in a centered element or left bare (and thus rendered flush left
// by app/globals.css's `.wpb-content-wrapper img:not(...) { display: inline }`
// rule).
const COLLECTIONS = ["pages", "products", "posts"] as const;

async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", limit: 100, depth: 0 });
  const siteNameById = new Map(sites.docs.map((s: any) => [s.id, s.slug]));

  for (const collection of COLLECTIONS) {
    let page = 1;
    let hasNext = true;
    while (hasNext) {
      const result = await payload.find({ collection: collection as any, depth: 0, limit: 100, page });
      for (const doc of result.docs as any[]) {
        const raw = doc.wpRawContent as string | undefined;
        if (!raw) continue;
        if (!/connect-button|wp-image-13381/i.test(raw)) continue;
        const siteName = siteNameById.get(doc.site) ?? doc.site;
        console.log(`\n=== ${collection} id=${doc.id} slug=${doc.slug ?? "(no slug)"} site=${siteName} ===`);
        const re = /connect-button|wp-image-13381/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(raw))) {
          const idx = m.index;
          console.log("  ..." + raw.slice(Math.max(0, idx - 150), idx + 250).replace(/\s+/g, " ") + "...");
        }
      }
      hasNext = result.hasNextPage;
      page++;
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
