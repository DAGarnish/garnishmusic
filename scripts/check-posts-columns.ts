import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./garnishmusic.db" });

async function main() {
  const res = await db.execute("PRAGMA table_info(posts)");
  console.log(res.rows.map((r: any) => r.name));

  const idx = await db.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='posts'");
  console.log("Indexes:", idx.rows.map((r: any) => r.name));
}
main();
