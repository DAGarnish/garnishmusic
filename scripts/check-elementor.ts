import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [countRows] = await conn.query<any[]>(
    `SELECT COUNT(*) c FROM D0QbVivoEg_postmeta WHERE meta_key = '_elementor_data';`
  );
  console.log("Total _elementor_data rows:", (countRows as any[])[0].c);

  const [rows] = await conn.query<any[]>(
    `SELECT p.ID, p.post_title, p.post_type, p.post_status, pm.meta_value
     FROM D0QbVivoEg_postmeta pm
     JOIN D0QbVivoEg_posts p ON p.ID = pm.post_id
     WHERE pm.meta_key = '_elementor_data' AND LENGTH(pm.meta_value) > 100
     ORDER BY LENGTH(pm.meta_value) ASC
     LIMIT 1;`
  );
  const row = (rows as any[])[0];
  console.log("Page:", row.post_title, "ID:", row.ID);
  const data = JSON.parse(row.meta_value);
  console.log(JSON.stringify(data, null, 2).slice(0, 6000));
  await conn.end();
}
main();
