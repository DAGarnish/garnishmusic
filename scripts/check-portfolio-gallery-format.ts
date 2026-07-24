import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(1);
  const [rows] = await conn.query<any[]>(
    `SELECT pm.post_id, pm.meta_value as gallery, tm.meta_value as thumb
     FROM ${prefix}postmeta pm
     LEFT JOIN ${prefix}postmeta tm ON tm.post_id = pm.post_id AND tm.meta_key = '_thumbnail_id'
     WHERE pm.meta_key = 'mkd_portfolio-image-gallery' AND pm.meta_value != ''
     LIMIT 15;`
  );
  for (const row of rows as any[]) {
    console.log(`post_id=${row.post_id} gallery="${row.gallery}" thumbnail="${row.thumb}"`);
  }
  await conn.end();
}
main();
