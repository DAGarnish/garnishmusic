import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [rows] = await conn.query<any[]>(
    `SELECT post_content FROM D0QbVivoEg_posts WHERE post_content LIKE '%mkd_section_title%' LIMIT 3;`
  );
  for (const row of rows as any[]) {
    const m = (row.post_content as string).match(/\[mkd_section_title[^\]]*\]/);
    if (m) console.log(m[0]);
  }
  await conn.end();
}
main();
