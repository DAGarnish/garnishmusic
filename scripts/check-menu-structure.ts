import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(9); // ny site

  // Find nav_menu taxonomy terms (the menus themselves)
  const [menus] = await conn.query<any[]>(
    `SELECT t.term_id, t.name FROM ${prefix}terms t
     JOIN ${prefix}term_taxonomy tt ON tt.term_id = t.term_id
     WHERE tt.taxonomy = 'nav_menu';`
  );
  console.log("Menus:", menus);

  // Find theme_mod / option that assigns menu to "main-menu" location
  const [themeMods] = await conn.query<any[]>(
    `SELECT option_value FROM ${prefix}options WHERE option_name LIKE '%theme_mods%' LIMIT 5;`
  );
  for (const row of themeMods as any[]) {
    if (row.option_value.includes("nav_menu")) {
      console.log("theme_mod with nav_menu_locations found, length:", row.option_value.length);
    }
  }

  // Sample menu items for the first menu found
  if ((menus as any[])[0]) {
    const menuTermId = (menus as any[])[0].term_id;
    const [items] = await conn.query<any[]>(
      `SELECT p.ID, p.post_title, p.menu_order, p.post_parent
       FROM ${prefix}posts p
       JOIN ${prefix}term_relationships tr ON tr.object_id = p.ID
       WHERE tr.term_taxonomy_id = (
         SELECT term_taxonomy_id FROM ${prefix}term_taxonomy WHERE term_id = ${menuTermId}
       ) AND p.post_type = 'nav_menu_item'
       ORDER BY p.menu_order LIMIT 10;`
    );
    console.log("Sample menu items:", items);

    if ((items as any[])[0]) {
      const [meta] = await conn.query<any[]>(
        `SELECT meta_key, meta_value FROM ${prefix}postmeta WHERE post_id = ${(items as any[])[0].ID};`
      );
      console.log("Meta for first item:", meta);
    }
  }

  await conn.end();
}
main();
