import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [rows] = await conn.query<any[]>(
    `SELECT p.ID, p.post_title, p.guid, p.post_mime_type, pm.meta_value AS attached_file
     FROM D0QbVivoEg_posts p
     LEFT JOIN D0QbVivoEg_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_wp_attached_file'
     WHERE p.post_type = 'attachment' LIMIT 5;`
  );
  console.log(rows);
  await conn.end();
}
main();
