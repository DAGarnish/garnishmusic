import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./garnishmusic.db" });

async function main() {
  await db.execute("ALTER TABLE pages RENAME COLUMN wp_elementor_raw TO wp_raw_content");
  console.log("Renamed column successfully.");
  const res = await db.execute("PRAGMA table_info(pages)");
  console.log(res.rows.map((r: any) => r.name));
}
main().catch((err) => console.error(err));
