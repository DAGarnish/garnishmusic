import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });

  const missingSites = new Set(["www","hk","mia","la","tyo","sea","bcn","lis","sf"]);

  for (const site of sites.docs as any[]) {
    if (!missingSites.has(site.slug)) continue;
    const pages = await payload.find({
      collection: "pages",
      where: {
        and: [
          { site: { equals: site.id } },
          {
            or: [
              { slug: { like: "private" } },
              { slug: { like: "tuition" } },
              { title: { like: "Private" } },
              { title: { like: "tuition" } },
            ],
          },
        ],
      },
      limit: 10,
      depth: 0,
    });
    console.log(`\n${site.slug}:`, pages.docs.map((p: any) => `${p.slug} ("${p.title}")`));
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
