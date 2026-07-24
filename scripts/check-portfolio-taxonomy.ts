import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(8); // edu site

  console.log("=== taxonomies registered (distinct) ===");
  const [taxes] = await conn.query<any[]>(
    `SELECT DISTINCT taxonomy FROM ${prefix}term_taxonomy WHERE taxonomy LIKE '%portfolio%';`
  );
  console.log(taxes);

  console.log("\n=== portfolio-category terms ===");
  const [terms] = await conn.query<any[]>(
    `SELECT t.term_id, t.name, t.slug, tt.count
     FROM ${prefix}terms t
     JOIN ${prefix}term_taxonomy tt ON tt.term_id = t.term_id
     WHERE tt.taxonomy = 'portfolio-category' ORDER BY tt.count DESC LIMIT 20;`
  );
  console.log(terms);

  console.log("\n=== dave-garnish (ID 1964) portfolio-category ===");
  const [daveCat] = await conn.query<any[]>(
    `SELECT t.name, t.slug
     FROM ${prefix}term_relationships tr
     JOIN ${prefix}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
     JOIN ${prefix}terms t ON t.term_id = tt.term_id
     WHERE tr.object_id = 1964 AND tt.taxonomy = 'portfolio-category';`
  );
  console.log(daveCat);

  // Check a known "courses" item's category
  const [courseItem] = await conn.query<any[]>(
    `SELECT ID, post_title, post_name FROM ${prefix}posts WHERE post_name = 'ableton-live' AND post_type='portfolio-item' LIMIT 1;`
  );
  console.log("\n=== ableton-live post ===", courseItem);
  if ((courseItem as any[])[0]) {
    const [cat] = await conn.query<any[]>(
      `SELECT t.name, t.slug
       FROM ${prefix}term_relationships tr
       JOIN ${prefix}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
       JOIN ${prefix}terms t ON t.term_id = tt.term_id
       WHERE tr.object_id = ${(courseItem as any[])[0].ID} AND tt.taxonomy = 'portfolio-category';`
    );
    console.log("ableton-live category:", cat);
  }

  await conn.end();
}
main();
