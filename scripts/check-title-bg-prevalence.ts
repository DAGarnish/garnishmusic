import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(`SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`);
  let total = 0;
  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const [[row]] = await conn.query<any[]>(
      `SELECT COUNT(DISTINCT post_id) c FROM ${prefix}postmeta
       WHERE meta_key = 'mkd_title_area_background_image_meta' AND meta_value != '';`
    );
    total += row.c;
  }
  console.log("Total pages with title area background image:", total);
  await conn.end();
}
main();
