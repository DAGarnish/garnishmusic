import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const [blogs] = await conn.query<any[]>(
    `SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`
  );

  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const [rows] = await conn.query<any[]>(
      `SELECT option_value FROM ${prefix}options WHERE option_name = 'blogname' LIMIT 1;`
    );
    const name = (rows as any[])[0]?.option_value ?? blog.domain;
    const domain: string = blog.domain;
    const slug = domain.split(".")[0];

    const existing = await payload.find({
      collection: "sites",
      where: { domain: { equals: domain } },
      limit: 1,
    });

    const data = {
      name,
      domain,
      slug,
      isMainSite: blog.blog_id === 1,
      wpBlogId: blog.blog_id,
      wpTablePrefix: prefix,
    };

    if (existing.docs.length > 0) {
      await payload.update({
        collection: "sites",
        id: existing.docs[0].id,
        data,
      });
      console.log(`Updated: ${name} (${domain})`);
    } else {
      await payload.create({
        collection: "sites",
        data,
      });
      console.log(`Created: ${name} (${domain})`);
    }
  }

  await conn.end();
  console.log(`\nDone. Seeded ${(blogs as any[]).length} sites.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
