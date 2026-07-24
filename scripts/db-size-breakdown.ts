import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./garnishmusic.db" });

async function main() {
  try {
    const res = await db.execute(
      "SELECT name, SUM(pgsize) as bytes FROM dbstat GROUP BY name ORDER BY bytes DESC LIMIT 20"
    );
    for (const row of res.rows) {
      const bytes = Number(row.bytes);
      console.log(`${row.name}: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
    }
  } catch (err) {
    console.log("dbstat not available:", (err as Error).message);
  }
}
main();
