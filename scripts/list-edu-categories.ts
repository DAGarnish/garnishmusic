import { getPayload } from "payload";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  const sitesRes = await payload.find({ collection: "sites", limit: 100, depth: 0 });
  const eduSite = (sitesRes.docs as any[]).find((s) => s.slug === "edu");

  const catsRes = await payload.find({ collection: "categories", where: { site: { equals: eduSite.id } }, limit: 200, depth: 0 });
  const allPosts: any[] = [];
  {
    let page = 1;
    while (true) {
      const res = await payload.find({ collection: "posts", where: { site: { equals: eduSite.id } }, limit: 200, page, depth: 0, sort: "-publishedDate" });
      allPosts.push(...res.docs);
      if (page >= res.totalPages) break;
      page++;
    }
  }

  const counts: Record<string, number> = {};
  const latestFeaturedImage: Record<string, any> = {};
  for (const p of allPosts) {
    const catIds = Array.isArray(p.categories) ? p.categories : [];
    for (const cid of catIds) {
      const key = String(cid);
      counts[key] = (counts[key] || 0) + 1;
      if (!latestFeaturedImage[key] && p.featuredImage) latestFeaturedImage[key] = p.featuredImage;
    }
  }

  const rows = (catsRes.docs as any[])
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: counts[String(c.id)] || 0, hasImage: !!latestFeaturedImage[String(c.id)] }))
    .sort((a, b) => b.count - a.count);

  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
