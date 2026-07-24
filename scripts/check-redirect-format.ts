import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(1);

  console.log("=== redirection_items schema ===");
  const [schema] = await conn.query<any[]>(`DESCRIBE ${prefix}redirection_items;`);
  console.log((schema as any[]).map((r) => `${r.Field} (${r.Type})`).join(", "));

  console.log("\n=== redirection_items sample ===");
  const [items] = await conn.query<any[]>(
    `SELECT id, url, match_url, action_data, action_type, action_code, regex, status
     FROM ${prefix}redirection_items LIMIT 10;`
  );
  console.log(items);

  console.log("\n=== rank_math_redirections schema ===");
  const [schema2] = await conn.query<any[]>(`DESCRIBE ${prefix}rank_math_redirections;`);
  console.log((schema2 as any[]).map((r) => `${r.Field} (${r.Type})`).join(", "));

  console.log("\n=== rank_math_redirections sample ===");
  const [items2] = await conn.query<any[]>(`SELECT * FROM ${prefix}rank_math_redirections LIMIT 10;`);
  console.log(items2);

  await conn.end();
}
main();
