import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });
  let totalUpdated = 0;

  for (const site of sites.docs) {
    const blogId = site.wpBlogId as number;
    const prefix = tablePrefixForBlog(blogId);

    const existingCategories = await payload.find({
      collection: "categories",
      where: { site: { equals: site.id } },
      limit: 1000,
    });
    const categoryByWpId = new Map<number, number | string>(
      existingCategories.docs.map((c: any) => [c.wpTermId, c.id])
    );

    const [rows] = await conn.query<any[]>(
      `SELECT tr.object_id, tt.term_id
       FROM ${prefix}term_relationships tr
       JOIN ${prefix}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
       WHERE tt.taxonomy = 'portfolio-category';`
    );

    const termIdsByPost = new Map<number, number[]>();
    for (const row of rows as any[]) {
      const list = termIdsByPost.get(row.object_id) || [];
      list.push(row.term_id);
      termIdsByPost.set(row.object_id, list);
    }

    let siteUpdated = 0;
    for (const [postId, termIds] of termIdsByPost) {
      const categoryIds = termIds.map((t) => categoryByWpId.get(t)).filter(Boolean);
      if (categoryIds.length === 0) continue;

      const existingPage = await payload.find({
        collection: "pages",
        where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: postId } }] },
        limit: 1,
      });
      if (existingPage.docs[0]) {
        await payload.update({
          collection: "pages",
          id: existingPage.docs[0].id,
          data: { portfolioCategories: categoryIds as any },
        });
        siteUpdated += 1;
      }
    }

    console.log(`${site.domain}: ${siteUpdated} pages updated with portfolio categories`);
    totalUpdated += siteUpdated;
  }

  await conn.end();
  console.log(`\nDONE. Total pages updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
