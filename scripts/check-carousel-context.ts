import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(1);
  const [rows] = await conn.query<any[]>(
    `SELECT pm.post_id, pm.meta_value, p.post_type, p.post_title
     FROM ${prefix}postmeta pm
     JOIN ${prefix}posts p ON p.ID = pm.post_id
     WHERE pm.meta_key = 'mkd_carousel_image' AND pm.meta_value != '' LIMIT 10;`
  );
  console.log(rows);
  await conn.end();
}
main();
