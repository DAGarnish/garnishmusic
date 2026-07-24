import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(
    `SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`
  );

  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    try {
      const [rows] = await conn.query<any[]>(
        `SELECT option_value FROM ${prefix}options WHERE option_name = 'blogname' LIMIT 1;`
      );
      const name = (rows as any[])[0]?.option_value ?? "(unknown)";
      console.log(`${blog.blog_id}\t${blog.domain}\t${prefix}\t${name}`);
    } catch (err) {
      console.log(`${blog.blog_id}\t${blog.domain}\t${prefix}\tERROR: ${(err as Error).message}`);
    }
  }

  await conn.end();
}

main();
