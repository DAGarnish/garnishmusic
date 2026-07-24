import { getWpConnection } from "./wp-db";

const tables = [
  "D0QbVivoEg_9_posts",
  "D0QbVivoEg_9_postmeta",
  "D0QbVivoEg_9_terms",
  "D0QbVivoEg_9_term_taxonomy",
  "D0QbVivoEg_9_term_relationships",
  "D0QbVivoEg_9_wc_orders",
  "D0QbVivoEg_9_wc_order_addresses",
  "D0QbVivoEg_9_woocommerce_order_items",
  "D0QbVivoEg_9_woocommerce_order_itemmeta",
  "D0QbVivoEg_9_fluentform_forms",
  "D0QbVivoEg_9_fluentform_submissions",
  "D0QbVivoEg_9_fluentform_entry_details",
  "D0QbVivoEg_users",
];

async function main() {
  const conn = await getWpConnection();
  for (const t of tables) {
    try {
      const [rows] = await conn.query<any[]>(`DESCRIBE ${t};`);
      console.log(`\n=== ${t} ===`);
      console.log((rows as any[]).map((r) => `${r.Field} (${r.Type})`).join(", "));
    } catch (err) {
      console.log(`\n=== ${t} === ERROR: ${(err as Error).message}`);
    }
  }
  await conn.end();
}

main();
