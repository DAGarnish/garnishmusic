import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(`SELECT blog_id FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`);
  let total = 0;
  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const [[c]] = await conn.query<any[]>(
      `SELECT COUNT(*) c FROM ${prefix}postmeta WHERE meta_key = 'mkd_carousel_image' AND meta_value != '';`
    );
    total += c.c;
  }
  console.log("mkd_carousel_image total:", total);
  await conn.end();
}
main();
