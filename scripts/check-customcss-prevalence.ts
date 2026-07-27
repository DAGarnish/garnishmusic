import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

const BLOG_ID_BY_DOMAIN: Record<string, number> = {
  "www.garnishmusicproduction.com": 1, "nsh.garnishmusicproduction.com": 2, "ber.garnishmusicproduction.com": 3,
  "hk.garnishmusicproduction.com": 4, "mia.garnishmusicproduction.com": 5, "la.garnishmusicproduction.com": 7,
  "edu.garnishmusicproduction.com": 8, "ny.garnishmusicproduction.com": 9, "tyo.garnishmusicproduction.com": 18,
  "sea.garnishmusicproduction.com": 21, "bcn.garnishmusicproduction.com": 30, "hou.garnishmusicproduction.com": 33,
  "syd.garnishmusicproduction.com": 35, "av.garnishmusicproduction.com": 46, "lis.garnishmusicproduction.com": 48,
  "bh.garnishmusicproduction.com": 50, "sf.garnishmusicproduction.com": 51, "sg.garnishmusicproduction.com": 54,
  "pdx.garnishmusicproduction.com": 55,
};

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();
  const sites = await payload.find({ collection: "sites", limit: 100 });

  let checked = 0, missingButShouldHave = 0, correctlyEmpty = 0, correctlyHas = 0;

  for (const site of sites.docs as any[]) {
    const blogId = BLOG_ID_BY_DOMAIN[site.domain];
    if (!blogId) continue;
    const prefix = tablePrefixForBlog(blogId);

    const pages = await payload.find({ collection: "pages", where: { site: { equals: site.id } }, limit: 1000 });
    for (const p of pages.docs as any[]) {
      if (!p.wpPostId) continue;
      checked++;
      const [rows]: any = await conn.query(
        `SELECT meta_value FROM ${prefix}postmeta WHERE post_id = ? AND meta_key = '_wpb_post_custom_css' LIMIT 1`,
        [p.wpPostId]
      );
      const wpHas = rows[0]?.meta_value && rows[0].meta_value.length > 0;
      const ourHas = p.customCss && p.customCss.length > 0;
      if (wpHas && !ourHas) missingButShouldHave++;
      else if (!wpHas && !ourHas) correctlyEmpty++;
      else if (wpHas && ourHas) correctlyHas++;
    }
    console.log(`${site.domain}: checked so far ${checked}`);
  }

  console.log(`\nChecked: ${checked}`);
  console.log(`Missing but production has it: ${missingButShouldHave}`);
  console.log(`Correctly empty: ${correctlyEmpty}`);
  console.log(`Correctly present: ${correctlyHas}`);
  await conn.end();
  process.exit(0);
}
main().catch((err) => { console.error(err); process.exit(1); });
