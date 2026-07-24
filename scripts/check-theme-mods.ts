import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(9);
  const [rows] = await conn.query<any[]>(
    `SELECT option_name, option_value FROM ${prefix}options WHERE option_name LIKE '%theme_mods%';`
  );
  for (const row of rows as any[]) {
    console.log(row.option_name, "=", row.option_value);
  }
  await conn.end();
}
main();
