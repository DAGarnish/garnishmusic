import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(`SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`);
  let total = 0;
  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const [[row]] = await conn.query<any[]>(
      `SELECT COUNT(*) c FROM ${prefix}posts WHERE post_type='portfolio-item' AND post_status='publish';`
    );
    console.log(`${blog.domain}: ${row.c}`);
    total += row.c;
  }
  console.log("TOTAL:", total);
  await conn.end();
}
main();
