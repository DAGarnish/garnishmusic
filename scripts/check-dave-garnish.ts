import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(8);
  const [rows] = await conn.query<any[]>(
    `SELECT ID, post_title, post_name, post_type, post_status FROM ${prefix}posts WHERE post_name LIKE '%dave-garnish%' OR post_title LIKE '%Dave Garnish%';`
  );
  console.log(rows);
  await conn.end();
}
main();
