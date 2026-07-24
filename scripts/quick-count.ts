import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./garnishmusic.db" });

async function main() {
  const cats = await db.execute("SELECT COUNT(*) as c FROM categories");
  const tags = await db.execute("SELECT COUNT(*) as c FROM tags");
  const media = await db.execute("SELECT COUNT(*) as c FROM media");
  console.log({ cats: cats.rows[0], tags: tags.rows[0], media: media.rows[0] });
}
main();
