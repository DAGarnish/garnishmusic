import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const ids = [11755, 15273, 15289, 15329, 15312];
  const [rows] = await conn.query<any[]>(
    `SELECT ID, post_type, post_status, post_title FROM D0QbVivoEg_posts WHERE ID IN (${ids.join(",")});`
  );
  console.log(rows);

  // Also check where the _thumbnail_id meta pointing to these came from
  const [metaRows] = await conn.query<any[]>(
    `SELECT post_id, meta_key, meta_value FROM D0QbVivoEg_postmeta WHERE meta_key='_thumbnail_id' AND meta_value IN (${ids.join(",")}) LIMIT 5;`
  );
  console.log("thumbnail meta pointing to these:", metaRows);

  await conn.end();
}
main();
