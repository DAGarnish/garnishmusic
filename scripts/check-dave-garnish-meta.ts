import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(8);
  const [rows] = await conn.query<any[]>(
    `SELECT meta_key, meta_value FROM ${prefix}postmeta WHERE post_id = 1964;`
  );
  for (const row of rows as any[]) {
    const val = String(row.meta_value);
    console.log(`${row.meta_key}: ${val.slice(0, 200)}`);
  }
  await conn.end();
}
main();
