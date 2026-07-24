import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(8);
  const [rows] = await conn.query<any[]>(
    `SELECT ID, post_title, post_name, guid FROM ${prefix}posts WHERE ID IN (1964, 24087);`
  );
  console.log(rows);
  await conn.end();
}
main();
