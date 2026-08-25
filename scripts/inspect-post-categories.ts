import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const edu = sites.docs.find((s: any) => s.slug === "edu");

  const posts = await payload.find({
    collection: "posts",
    where: { site: { equals: edu!.id } },
    limit: 400,
    depth: 1,
  });

  const catCounts = new Map<string, number>();
  for (const p of posts.docs as any[]) {
    for (const c of p.categories || []) {
      const name = typeof c === "object" ? c.title || c.name : c;
      catCounts.set(name, (catCounts.get(name) || 0) + 1);
    }
  }
  console.log("Category counts:");
  console.log([...catCounts.entries()].sort((a, b) => b[1] - a[1]));

  console.log("\nTotal posts:", posts.docs.length);
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
