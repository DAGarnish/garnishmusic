import { getWpConnection, BASE_PREFIX } from "./wp-db";

async function main() {
  const conn = await getWpConnection();

  const [tables] = await conn.query<any[]>(
    `SELECT TABLE_NAME FROM information_schema.tables
     WHERE TABLE_SCHEMA = 'garnishmusicprod_xzghkquntn'
       AND (TABLE_NAME LIKE '%redirect%' OR TABLE_NAME LIKE '%rank_math%');`
  );
  console.log("Redirect/RankMath related tables (all sites):");
  console.log(tables.map((t: any) => t.TABLE_NAME).join("\n"));

  // Check main site's rank_math redirections table specifically
  const [rows] = await conn.query<any[]>(
    `SELECT COUNT(*) c FROM D0QbVivoEg_rank_math_redirections;`
  ).catch((e) => [[{ c: `ERROR: ${e.message}` }]]);
  console.log("\nMain site rank_math_redirections count:", (rows as any[])[0]?.c);

  await conn.end();
}
main();
