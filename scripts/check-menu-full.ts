import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(9);

  const [items] = await conn.query<any[]>(
    `SELECT p.ID, p.post_title, p.menu_order, p.post_parent,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_url') as url,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_type') as type,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_object_id') as object_id,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_menu_item_parent') as menu_parent
     FROM ${prefix}posts p
     JOIN ${prefix}term_relationships tr ON tr.object_id = p.ID
     WHERE tr.term_taxonomy_id = (
       SELECT term_taxonomy_id FROM ${prefix}term_taxonomy WHERE term_id = 126
     ) AND p.post_type = 'nav_menu_item'
     ORDER BY p.menu_order;`
  );
  console.log("Total items:", (items as any[]).length);
  for (const item of items as any[]) {
    console.log(`ID=${item.ID} order=${item.menu_order} parent=${item.menu_parent} title="${item.post_title}" type=${item.type} objId=${item.object_id} url=${item.url}`);
  }

  await conn.end();
}
main();
