import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });
  let totalMigrated = 0;

  for (const site of sites.docs) {
    const blogId = site.wpBlogId as number;
    const prefix = tablePrefixForBlog(blogId);

    const [posts] = await conn.query<any[]>(
      `SELECT ID, post_title FROM ${prefix}posts WHERE post_type = 'testimonials' AND post_status = 'publish';`
    );
    const postIds = (posts as any[]).map((p) => p.ID);
    if (postIds.length === 0) {
      console.log(`${site.domain}: 0 testimonials`);
      continue;
    }

    const [metaRows] = await conn.query<any[]>(
      `SELECT post_id, meta_key, meta_value FROM ${prefix}postmeta
       WHERE post_id IN (${postIds.join(",")}) AND meta_key IN
       ('mkd_testimonial_text','mkd_testimonial_author','_thumbnail_id');`
    );
    const getMeta = (postId: number, key: string) =>
      (metaRows as any[]).find((r) => r.post_id === postId && r.meta_key === key)?.meta_value;

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

    // Resolve featured image wpAttachmentId -> Payload media id via the
    // same media map file the other migration scripts use.
    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const mediaMap = JSON.parse(fs.readFileSync(path.resolve(dirname, ".media-map.json"), "utf-8"));
    const siteMediaMap = mediaMap[site.domain] || {};

    let siteMigrated = 0;
    for (const p of posts as any[]) {
      const text = getMeta(p.ID, "mkd_testimonial_text");
      const author = getMeta(p.ID, "mkd_testimonial_author") || p.post_title;
      if (!text) continue;

      const thumbId = getMeta(p.ID, "_thumbnail_id");
      const image = thumbId ? siteMediaMap[parseInt(thumbId, 10)] : undefined;

      const termIds = categoryTermsByPost.get(p.ID) || [];
      const categoryIds = termIds.map((t) => categoryByWpId.get(t)).filter(Boolean);

      const existing = await payload.find({
        collection: "testimonials",
        where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: p.ID } }] },
        limit: 1,
      });

      const data = {
        author,
        text,
        site: site.id,
        image: image ?? undefined,
        categories: categoryIds as any,
        wpPostId: p.ID,
      };

      if (existing.docs[0]) {
        await payload.update({ collection: "testimonials", id: existing.docs[0].id, data });
      } else {
        await payload.create({ collection: "testimonials", data });
      }
      siteMigrated += 1;
    }

    console.log(`${site.domain}: ${siteMigrated} testimonials migrated`);
    totalMigrated += siteMigrated;
  }

  await conn.end();
  console.log(`\nDONE. Total testimonials migrated: ${totalMigrated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
