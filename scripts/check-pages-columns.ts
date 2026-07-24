import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./garnishmusic.db" });

async function main() {
  const res = await db.execute("PRAGMA table_info(pages)");
  console.log(res.rows.map((r: any) => r.name));
}
main();
