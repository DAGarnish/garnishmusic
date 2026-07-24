import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(`SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`);
  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const [rows] = await conn.query<any[]>(
      `SELECT p.ID, p.post_parent, parent.post_parent as grandparent
       FROM ${prefix}posts p
       JOIN ${prefix}posts parent ON parent.ID = p.post_parent
       WHERE p.post_type='page' AND p.post_status='publish' AND p.post_parent != 0 AND parent.post_parent != 0;`
    );
    if ((rows as any[]).length > 0) {
      console.log(`${blog.domain}: ${(rows as any[]).length} pages with 3+ level depth`, rows);
    }
  }
  console.log("done checking");
  await conn.end();
}
main();
