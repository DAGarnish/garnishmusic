import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });

  for (const site of sites.docs as any[]) {
    const count = await payload.count({ collection: "posts", where: { site: { equals: site.id } } });
    if (count.totalDocs > 0) console.log(site.slug, "->", count.totalDocs, "posts");
  }

  const edu = sites.docs.find((s: any) => s.slug === "edu");
  if (edu) {
    const posts = await payload.find({
      collection: "posts",
      where: { site: { equals: edu.id } },
      limit: 15,
      depth: 1,
      sort: "-publishedDate",
    });
    console.log("\nSample edu posts:");
    for (const p of posts.docs as any[]) {
      const cats = (p.categories || []).map((c: any) => (typeof c === "object" ? c.title || c.name : c));
      const tags = (p.tags || []).map((t: any) => (typeof t === "object" ? t.title || t.name : t));
      console.log({ title: p.title, slug: p.slug, cats, tags, excerptLen: p.excerpt?.length });
    }
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
