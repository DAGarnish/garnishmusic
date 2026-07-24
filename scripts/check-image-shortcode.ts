import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [rows] = await conn.query<any[]>(`SELECT post_content FROM D0QbVivoEg_posts WHERE ID = 5271;`);
  const content = (rows as any[])[0].post_content as string;
  const match = content.match(/\[[a-zA-Z_]+[^\]]*\bimage="20590"[^\]]*\]/);
  console.log(match);
  await conn.end();
}
main();
