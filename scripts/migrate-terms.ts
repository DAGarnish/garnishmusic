import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });

  let totalCategories = 0;
  let totalTags = 0;

  for (const site of sites.docs) {
    const blogId = site.wpBlogId as number;
    const prefix = tablePrefixForBlog(blogId);

    for (const [taxonomy, collection] of [
      ["category", "categories"],
      ["product_cat", "categories"],
      ["portfolio-category", "categories"],
      ["testimonials_category", "categories"],
      ["post_tag", "tags"],
    ] as const) {
      const [rows] = await conn.query<any[]>(
        `SELECT t.term_id, t.name, t.slug
         FROM ${prefix}terms t
         JOIN ${prefix}term_taxonomy tt ON tt.term_id = t.term_id
         WHERE tt.taxonomy = '${taxonomy}' AND tt.count > 0;`
      );

      for (const row of rows as any[]) {
        const existing = await payload.find({
          collection,
          where: {
            and: [{ site: { equals: site.id } }, { wpTermId: { equals: row.term_id } }],
          },
          limit: 1,
        });

        if (existing.docs.length === 0) {
          await payload.create({
            collection,
            data: {
              name: row.name,
              slug: row.slug,
              site: site.id,
              wpTermId: row.term_id,
            },
          });
          if (taxonomy === "category") totalCategories += 1;
          else totalTags += 1;
        }
      }
    }

    console.log(`${site.domain}: terms migrated`);
  }

  await conn.end();
  console.log(`\nDONE. Categories: ${totalCategories}, Tags: ${totalTags}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
