import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(1);

  // 1. Survey all postmeta keys containing "image" or "gallery" or "bg" or "photo" or "logo"
  const [metaKeys] = await conn.query<any[]>(
    `SELECT meta_key, COUNT(*) as cnt FROM ${prefix}postmeta
     WHERE (meta_key LIKE '%image%' OR meta_key LIKE '%gallery%' OR meta_key LIKE '%photo%' OR meta_key LIKE '%logo%' OR meta_key LIKE '%_bg%')
       AND meta_key NOT LIKE '\\_%'
     GROUP BY meta_key ORDER BY cnt DESC LIMIT 40;`
  );
  console.log("=== Non-underscore-prefixed image-related meta keys (main site) ===");
  for (const row of metaKeys as any[]) {
    console.log(`${row.meta_key}: ${row.cnt}`);
  }

  const [metaKeysUnderscore] = await conn.query<any[]>(
    `SELECT meta_key, COUNT(*) as cnt FROM ${prefix}postmeta
     WHERE (meta_key LIKE '%image%' OR meta_key LIKE '%gallery%')
       AND meta_key LIKE '\\_%' AND meta_key NOT IN ('_thumbnail_id','_product_image_gallery')
     GROUP BY meta_key ORDER BY cnt DESC LIMIT 20;`
  );
  console.log("\n=== Underscore-prefixed image-related meta keys not yet handled ===");
  for (const row of metaKeysUnderscore as any[]) {
    console.log(`${row.meta_key}: ${row.cnt}`);
  }

  // 2. Survey shortcode tags with any image-ish attribute across ALL sites (sampling main + a couple others)
  await conn.end();
}
main();
