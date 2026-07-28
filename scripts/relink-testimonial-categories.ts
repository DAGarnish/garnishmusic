import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

// Lighter, parallel replacement for re-running the full migrate-testimonials.ts
// (which re-fetches text/author/image and does a find-then-update per row,
// sequentially, over a slow network connection) - testimonials are already
// migrated, they just need their `categories` field populated now that
// testimonials_category terms exist in Payload. Batches updates concurrently
// instead of one at a time.

async function processInBatches<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(fn));
  }
}

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });
  let totalUpdated = 0;

  for (const site of sites.docs as any[]) {
    const blogId = site.wpBlogId as number;
    if (!blogId) continue;
    const prefix = tablePrefixForBlog(blogId);

    const existing = await payload.find({
      collection: "testimonials",
      where: { site: { equals: site.id } },
      limit: 5000,
      depth: 0,
    });
    if (existing.docs.length === 0) continue;

    const postIds = existing.docs.map((t: any) => t.wpPostId).filter(Boolean);
    if (postIds.length === 0) continue;

    const [termRows] = await conn.query<any[]>(
      `SELECT tr.object_id, tt.term_id
       FROM ${prefix}term_relationships tr
       JOIN ${prefix}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
       WHERE tt.taxonomy = 'testimonials_category' AND tr.object_id IN (${postIds.join(",")});`
    );
    const categoryTermsByPost = new Map<number, number[]>();
    for (const row of termRows as any[]) {
      const list = categoryTermsByPost.get(row.object_id) || [];
      list.push(row.term_id);
      categoryTermsByPost.set(row.object_id, list);
    }

    const existingCategories = await payload.find({
      collection: "categories",
      where: { site: { equals: site.id } },
      limit: 1000,
    });
    const categoryByWpId = new Map<number, number | string>(
      existingCategories.docs.map((c: any) => [c.wpTermId, c.id])
    );

    const toUpdate = existing.docs.filter((t: any) => {
      const termIds = categoryTermsByPost.get(t.wpPostId) || [];
      const categoryIds = termIds.map((id) => categoryByWpId.get(id)).filter(Boolean);
      return categoryIds.length > 0;
    });

    await processInBatches(toUpdate, 15, async (t: any) => {
      const termIds = categoryTermsByPost.get(t.wpPostId) || [];
      const categoryIds = termIds.map((id) => categoryByWpId.get(id)).filter(Boolean);
      await payload.update({
        collection: "testimonials",
        id: t.id,
        data: { categories: categoryIds as any },
      });
    });

    console.log(`${site.domain}: ${toUpdate.length}/${existing.docs.length} testimonials relinked`);
    totalUpdated += toUpdate.length;
  }

  await conn.end();
  console.log(`\nDONE. Total testimonials relinked: ${totalUpdated}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
