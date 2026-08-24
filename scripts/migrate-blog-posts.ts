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

const APPLY = process.argv.includes("--apply");

function contentLen(content: any): number {
  try {
    return JSON.stringify(content || {}).length;
  } catch {
    return 0;
  }
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  const sitesRes = await payload.find({ collection: "sites", limit: 100, depth: 0 });
  const sites = sitesRes.docs as any[];
  const eduSite = sites.find((s) => s.slug === "edu");
  if (!eduSite) throw new Error("edu site not found");
  const eduSiteId = eduSite.id;
  const eduDomain = eduSite.domain;
  const siteById = new Map<string, any>(sites.map((s) => [String(s.id), s]));

  const allPosts: any[] = [];
  {
    let page = 1;
    while (true) {
      const res = await payload.find({ collection: "posts", limit: 200, page, depth: 0 });
      allPosts.push(...res.docs);
      if (page >= res.totalPages) break;
      page++;
    }
  }

  const allCategories: any[] = [];
  {
    let page = 1;
    while (true) {
      const res = await payload.find({ collection: "categories", limit: 200, page, depth: 0 });
      allCategories.push(...res.docs);
      if (page >= res.totalPages) break;
      page++;
    }
  }
  const allTags: any[] = [];
  {
    let page = 1;
    while (true) {
      const res = await payload.find({ collection: "tags", limit: 200, page, depth: 0 });
      allTags.push(...res.docs);
      if (page >= res.totalPages) break;
      page++;
    }
  }

  const categoryById = new Map<string, any>(allCategories.map((c) => [String(c.id), c]));
  const tagById = new Map<string, any>(allTags.map((t) => [String(t.id), t]));
  // key: `${siteId}:${slug}` -> id
  const categoryKey = new Map<string, any>(allCategories.map((c) => [`${c.site}:${c.slug}`, c.id]));
  const tagKey = new Map<string, any>(allTags.map((t) => [`${t.site}:${t.slug}`, t.id]));

  async function remapIds(
    oldIds: any[] | undefined | null,
    byId: Map<string, any>,
    key: Map<string, any>,
    collection: "categories" | "tags",
    log: string[]
  ): Promise<any[]> {
    if (!oldIds || oldIds.length === 0) return [];
    const result: any[] = [];
    for (const oldId of oldIds) {
      const rec = byId.get(String(oldId));
      if (!rec) continue;
      const eduKey = `${eduSiteId}:${rec.slug}`;
      let eduId = key.get(eduKey);
      if (!eduId) {
        if (APPLY) {
          const created = await payload.create({
            collection,
            data: { name: rec.name, slug: rec.slug, site: eduSiteId, wpTermId: rec.wpTermId },
          });
          eduId = created.id;
          key.set(eduKey, eduId);
          byId.set(String(eduId), { ...rec, id: eduId, site: eduSiteId });
        } else {
          log.push(`  [would create ${collection} "${rec.slug}" on edu]`);
          continue;
        }
      }
      if (!result.includes(eduId)) result.push(eduId);
    }
    return result;
  }

  const byTitle = new Map<string, any[]>();
  for (const p of allPosts) {
    const arr = byTitle.get(p.title) || [];
    arr.push(p);
    byTitle.set(p.title, arr);
  }

  // Slug -> post already on edu, used so a duplicate group whose "winner"
  // slug happens to already exist on edu (under a slightly different title
  // string from another site's WP migration) redirects to that existing
  // edu post instead of colliding with it.
  const eduPostBySlug = new Map<string, any>();
  for (const p of allPosts) {
    if (String(p.site) === String(eduSiteId)) eduPostBySlug.set(p.slug, p);
  }

  const plan: {
    title: string;
    canonical: any;
    canonicalSite: string;
    deletions: { post: any; site: string }[];
  }[] = [];

  for (const [title, posts] of byTitle) {
    let canonical = posts[0];
    for (const p of posts) {
      if (contentLen(p.content) > contentLen(canonical.content)) canonical = p;
    }

    // If some OTHER post already sits on edu at the slug our candidate
    // would take, that existing edu post wins instead (it's already live
    // there) - redirect every post in this group, including our candidate,
    // to it.
    const existingAtSlug = eduPostBySlug.get(canonical.slug);
    if (existingAtSlug && existingAtSlug.id !== canonical.id) {
      canonical = existingAtSlug;
    }

    const canonicalSite = siteById.get(String(canonical.site))?.slug || String(canonical.site);
    const deletions = posts
      .filter((p) => p.id !== canonical.id)
      .map((p) => ({ post: p, site: siteById.get(String(p.site))?.slug || String(p.site) }));

    plan.push({ title, canonical, canonicalSite, deletions });
  }

  console.log(`Total distinct titles: ${byTitle.size}`);
  console.log(`\nAuto-plan: ${plan.length} canonical posts, ${plan.reduce((n, g) => n + g.deletions.length, 0)} deletions/redirects`);

  let reassigned = 0;
  let alreadyEdu = 0;
  let deleted = 0;
  let redirectsCreated = 0;
  const slugCollisions: string[] = [];

  for (const group of plan) {
    const { canonical, canonicalSite, deletions } = group;
    // slug collision check on edu (excluding itself)
    const collision = allPosts.find(
      (p) => String(p.site) === String(eduSiteId) && p.slug === canonical.slug && p.id !== canonical.id
    );
    if (collision) {
      slugCollisions.push(`"${group.title}" slug "${canonical.slug}" collides with edu post #${collision.id} ("${collision.title}")`);
      continue;
    }

    const log: string[] = [];
    const newCategories = await remapIds(canonical.categories, categoryById, categoryKey, "categories", log);
    const newTags = await remapIds(canonical.tags, tagById, tagKey, "tags", log);

    if (String(canonical.site) === String(eduSiteId)) {
      alreadyEdu++;
      if (APPLY) {
        await payload.update({
          collection: "posts",
          id: canonical.id,
          data: { categories: newCategories, tags: newTags } as any,
        });
      }
    } else {
      reassigned++;
      if (APPLY) {
        await payload.update({
          collection: "posts",
          id: canonical.id,
          data: { site: eduSiteId, categories: newCategories, tags: newTags } as any,
        });
        await payload.create({
          collection: "redirects",
          data: {
            site: canonical.site,
            source: `/${canonical.slug}`,
            destination: `https://${eduDomain}/${canonical.slug}/`,
            statusCode: 301,
          } as any,
        });
      }
      redirectsCreated++;
    }
    if (log.length) console.log(`"${group.title}" (canonical ${canonicalSite}#${canonical.id} -> edu):\n${log.join("\n")}`);

    for (const d of deletions) {
      deleted++;
      redirectsCreated++;
      if (APPLY) {
        await payload.delete({ collection: "posts", id: d.post.id });
        await payload.create({
          collection: "redirects",
          data: {
            site: d.post.site,
            source: `/${d.post.slug}`,
            destination: `https://${eduDomain}/${canonical.slug}/`,
            statusCode: 301,
          } as any,
        });
      }
    }
  }

  console.log(`\n${APPLY ? "APPLIED" : "DRY RUN"}:`);
  console.log(`  Reassigned to edu (moved from another site): ${reassigned}`);
  console.log(`  Already on edu (category/tag remap only): ${alreadyEdu}`);
  console.log(`  Deleted duplicate posts: ${deleted}`);
  console.log(`  Redirects created: ${redirectsCreated}`);
  console.log(`  Slug collisions on edu (skipped, need manual handling): ${slugCollisions.length}`);
  for (const c of slugCollisions) console.log("  " + c);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
