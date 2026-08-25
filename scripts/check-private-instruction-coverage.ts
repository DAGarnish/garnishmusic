import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });

  const affectedSlugs = new Set([
    "www","pdx","sf","lis","syd","hou","bcn","sea","tyo","edu","hk","ber","nsh","la","mia",
  ]);

  for (const site of sites.docs as any[]) {
    if (!affectedSlugs.has(site.slug)) continue;
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { slug: { equals: "private-instruction" } }] },
      limit: 1,
    });
    console.log(site.slug.padEnd(6), "has private-instruction page:", pages.docs.length > 0);
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
