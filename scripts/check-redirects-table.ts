import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./garnishmusic.db" });
const res = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='redirects'");
console.log("redirects table exists:", res.rows.length > 0);
