import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./garnishmusic.db" });

async function main() {
  const res = await db.execute(
    `SELECT id, title, content FROM pages WHERE content LIKE '%"type":"upload"%' LIMIT 3`
  );
  for (const row of res.rows) {
    console.log("Page:", row.id, row.title);
  }

  const prodRes = await db.execute(`SELECT id, name FROM products WHERE id IN (SELECT parent_id FROM products_rels LIMIT 1)`);
  console.log("products_rels sample check skipped, trying direct:");

  const anyImg = await db.execute(`SELECT COUNT(*) c FROM media`);
  console.log("media count:", anyImg.rows[0]);
}
main().catch(console.error);
