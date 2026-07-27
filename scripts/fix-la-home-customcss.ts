import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(7);

  const [rows]: any = await conn.query(
    `SELECT meta_value FROM ${prefix}postmeta WHERE post_id = 5271 AND meta_key = '_wpb_post_custom_css' LIMIT 1;`
  );
  const customCss = rows[0]?.meta_value;
  if (!customCss) throw new Error("no customCss found on production");

  const sites = await payload.find({ collection: "sites", where: { domain: { equals: "la.garnishmusicproduction.com" } }, limit: 1 });
  const la = sites.docs[0] as any;
  const home = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: la.id } }, { wpPostId: { equals: la.homepageWpId } }] },
    limit: 1,
  });
  const doc = home.docs[0] as any;
  await payload.update({ collection: "pages", id: doc.id, data: { customCss } });
  console.log(`FIXED page id=${doc.id}, customCss length ${customCss.length}`);
  await conn.end();
  process.exit(0);
}
main().catch((err) => { console.error(err); process.exit(1); });
