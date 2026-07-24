import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [rows] = await conn.query<any[]>(
    `SELECT option_name, option_value FROM D0QbVivoEg_options WHERE option_name IN ('page_on_front','show_on_front','page_for_posts');`
  );
  console.log(rows);

  const frontId = (rows as any[]).find((r) => r.option_name === "page_on_front")?.option_value;
  if (frontId) {
    const [page] = await conn.query<any[]>(
      `SELECT ID, post_title, post_name, post_type FROM D0QbVivoEg_posts WHERE ID = ${frontId};`
    );
    console.log("Front page:", page);
  }
  await conn.end();
}
main();
