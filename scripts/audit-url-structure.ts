import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(1);

  console.log("=== permalink_structure option ===");
  const [[perm]] = await conn.query<any[]>(
    `SELECT option_value FROM ${prefix}options WHERE option_name = 'permalink_structure';`
  );
  console.log(perm.option_value);

  console.log("\n=== pages with non-zero post_parent (hierarchical) ===");
  const [[hierCount]] = await conn.query<any[]>(
    `SELECT COUNT(*) c FROM ${prefix}posts WHERE post_type='page' AND post_status='publish' AND post_parent != 0;`
  );
  console.log("Count:", hierCount.c);
  const [hierSample] = await conn.query<any[]>(
    `SELECT p.ID, p.post_title, p.post_name, p.post_parent, parent.post_name as parent_name
     FROM ${prefix}posts p
     JOIN ${prefix}posts parent ON parent.ID = p.post_parent
     WHERE p.post_type='page' AND p.post_status='publish' AND p.post_parent != 0 LIMIT 10;`
  );
  console.log(hierSample);

  console.log("\n=== portfolio-item rewrite slug options ===");
  const [rewriteOpts] = await conn.query<any[]>(
    `SELECT option_name, option_value FROM ${prefix}options
     WHERE option_name LIKE '%portfolio%rewrite%' OR option_name LIKE '%mkd_portfolio%';`
  );
  console.log(rewriteOpts);

  console.log("\n=== category base / post permalink check ===");
  const [catBase] = await conn.query<any[]>(
    `SELECT option_name, option_value FROM ${prefix}options WHERE option_name IN ('category_base','tag_base');`
  );
  console.log(catBase);

  await conn.end();
}
main();
