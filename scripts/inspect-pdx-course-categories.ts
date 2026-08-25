import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx!.id } }, { slug: { like: "courses/" } }] },
    limit: 100,
    depth: 1,
  });
  for (const p of pages.docs as any[]) {
    const cats = (p.portfolioCategories || []).map((c: any) => (typeof c === "object" ? c.title || c.name || c.slug : c));
    console.log(p.slug.padEnd(45), "|", cats.join(", "));
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
