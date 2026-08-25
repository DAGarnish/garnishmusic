import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", limit: 100 });
  const siteById = new Map(sites.docs.map((s: any) => [s.id, s]));

  const linkRe = /https?:\/\/([a-z0-9-]+)\.garnishmusicproduction\.com\/private-instruction\/?/gi;

  let scanned = 0;
  let page = 1;
  const findings: { site: string; pageSlug: string; pageId: number; wrongDomain: string; fullMatch: string }[] = [];

  while (true) {
    const result = await payload.find({
      collection: "pages",
      where: { wpRawContent: { like: "private-instruction" } },
      limit: 100,
      page,
      depth: 0,
    });
    for (const doc of result.docs as any[]) {
      scanned++;
      const site = siteById.get(typeof doc.site === "object" ? doc.site.id : doc.site);
      const raw: string = doc.wpRawContent || "";
      for (const m of raw.matchAll(linkRe)) {
        const linkedDomainPrefix = m[1];
        if (site && linkedDomainPrefix !== site.slug) {
          findings.push({
            site: site.slug,
            pageSlug: doc.slug,
            pageId: doc.id,
            wrongDomain: linkedDomainPrefix,
            fullMatch: m[0],
          });
        }
      }
    }
    if (!result.hasNextPage) break;
    page++;
  }

  console.log(`Scanned ${scanned} pages containing "private-instruction".`);
  console.log(`Found ${findings.length} cross-site link(s):`);
  console.table(findings);
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
