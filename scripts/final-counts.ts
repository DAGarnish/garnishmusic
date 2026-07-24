import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./garnishmusic.db" });

async function main() {
  const tables = ["sites", "media", "categories", "tags", "pages", "posts", "products", "customers", "orders", "form_submissions", "users"];
  for (const t of tables) {
    const res = await db.execute(`SELECT COUNT(*) as c FROM ${t}`);
    console.log(`${t}: ${(res.rows[0] as any).c}`);
  }
}
main();
