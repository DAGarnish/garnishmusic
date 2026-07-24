import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(8);
  const [rows] = await conn.query<any[]>(
    `SELECT post_content FROM ${prefix}posts WHERE ID = 1964;`
  );
  const content = (rows as any[])[0].post_content as string;
  console.log("Length:", content.length);
  console.log(content);
  await conn.end();
}
main();
