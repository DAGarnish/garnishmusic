import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();

  const [pages] = await conn.query<any[]>(
    `SELECT ID, post_title, post_content FROM D0QbVivoEg_posts
     WHERE post_type='page' AND post_status='publish'
     ORDER BY LENGTH(post_content) DESC LIMIT 3;`
  );
  for (const p of pages as any[]) {
    console.log(`\n=== ${p.post_title} (ID ${p.ID}) content length: ${p.post_content.length} ===`);
    console.log(p.post_content.slice(0, 500));
  }

  const [metaKeys] = await conn.query<any[]>(
    `SELECT DISTINCT meta_key FROM D0QbVivoEg_postmeta pm
     JOIN D0QbVivoEg_posts p ON p.ID = pm.post_id
     WHERE p.post_type='page' LIMIT 100;`
  );
  console.log("\n\nDistinct meta_keys on pages:");
  console.log((metaKeys as any[]).map((r) => r.meta_key).join(", "));

  await conn.end();
}
main();
