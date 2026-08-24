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

function richTextLen(content: any): number {
  try {
    return JSON.stringify(content || {}).length;
  } catch {
    return 0;
  }
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", limit: 100, depth: 0 });
  const siteMap = new Map<string, any>();
  for (const s of sites.docs) siteMap.set(String(s.id), s);

  const allPosts: any[] = [];
  let page = 1;
  while (true) {
    const res = await payload.find({ collection: "posts", limit: 200, page, depth: 0 });
    allPosts.push(...res.docs);
    if (page >= res.totalPages) break;
    page++;
  }

  const out = allPosts.map((p: any) => {
    const site = siteMap.get(String(p.site));
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      site: site?.slug || p.site,
      siteDomain: site?.domain,
      len: richTextLen(p.content),
      categories: p.categories,
    };
  });

  fs.writeFileSync(
    "/private/tmp/claude-501/-Users-garnish-Documents-GMP-garnishmusic/0c224173-4a49-4956-8f88-267644b75faf/scratchpad/blog-posts-scope.json",
    JSON.stringify(out, null, 2)
  );
  console.log(`total posts: ${out.length}, total sites: ${sites.docs.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
