import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(1);
  const [product] = await conn.query<any[]>(
    `SELECT ID, post_title, post_name FROM ${prefix}posts WHERE post_type='product' AND post_status='publish' LIMIT 1;`
  );
  const [post] = await conn.query<any[]>(
    `SELECT ID, post_title, post_name FROM ${prefix}posts WHERE post_type='post' AND post_status='publish' LIMIT 1;`
  );
  console.log("product:", product);
  console.log("post:", post);
  await conn.end();
}
main();
