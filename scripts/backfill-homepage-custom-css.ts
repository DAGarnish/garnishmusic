import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection } from "./wp-db";
import { decodeHTML } from "entities";

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const [rows] = await conn.execute<any[]>(
    "SELECT meta_value FROM D0QbVivoEg_postmeta WHERE post_id = 5271 AND meta_key = '_wpb_post_custom_css' LIMIT 1"
  );
  const customCss = (rows as any[])[0]?.meta_value ? decodeHTML((rows as any[])[0].meta_value) : undefined;
  console.log("customCss length:", customCss?.length);

  if (customCss) {
    await payload.update({ collection: "pages", id: 2199, data: { customCss } });
    console.log("Updated page 2199");
  }

  await conn.end();
  process.exit(0);
}

main();
