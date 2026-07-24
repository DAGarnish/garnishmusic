import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [rows] = await conn.query<any[]>(
    `SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = 'garnishmusicprod_xzghkquntn' ORDER BY TABLE_NAME;`
  );
  const names = (rows as any[]).map((r) => r.TABLE_NAME);
  console.log(`Total tables: ${names.length}`);

  const interesting = names.filter((n) =>
    /fluentform|wc_|woocommerce|shop_order|shop_subscription/i.test(n)
  );
  console.log("\n--- WooCommerce / Fluent Forms related tables ---");
  console.log(interesting.join("\n"));

  console.log("\n--- All tables for blog_id=1 (base prefix, no numeric suffix) ---");
  console.log(
    names
      .filter((n) => n.startsWith("D0QbVivoEg_") && !/^D0QbVivoEg_\d+_/.test(n))
      .join("\n")
  );

  await conn.end();
}

main();
