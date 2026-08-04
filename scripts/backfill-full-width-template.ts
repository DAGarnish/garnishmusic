import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

// WordPress's own per-page "Page Template" setting (_wp_page_template
// postmeta) was never captured - migrate-content.ts only ever hardcoded the
// homepage to get the edge-to-edge .mkd-full-width wrapper (see page.tsx's
// old `isHomepage` check). Any OTHER page built with the theme's Full Width
// template (meta_value "full-width.php") renders identically on production -
// no boxed .mkd-container, rows go edge-to-edge - but our old hardcoding
// squeezed its rows into the ~1300px boxed container instead (confirmed
// against production, ny's /music-production-academy/ and /programs/logic-
// pro-x-music-program/, both full-width.php pages whose background-image
// hero rows rendered at ~1330px wide locally vs production's edge-to-edge
// ~1869px).

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
  const onlyDomain = process.argv[2];
  const payload = await getPayload({ config });
  const conn = await getWpConnection();
  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const sites = onlyDomain ? allSites.docs.filter((s: any) => s.domain === onlyDomain) : allSites.docs;

  let checked = 0, updated = 0;

  for (const site of sites as any[]) {
    const blogId = BLOG_ID_BY_DOMAIN[site.domain];
    if (!blogId) continue;
    const prefix = tablePrefixForBlog(blogId);

    const pages = await payload.find({
      collection: "pages",
      where: { site: { equals: site.id } },
      limit: 1000,
    });

    for (const p of pages.docs as any[]) {
      if (!p.wpPostId) continue;
      checked++;
      const [rows]: any = await conn.query(
        `SELECT meta_value FROM ${prefix}postmeta WHERE post_id = ? AND meta_key = '_wp_page_template' LIMIT 1`,
        [p.wpPostId]
      );
      const isFullWidth = rows[0]?.meta_value === "full-width.php";
      if (isFullWidth) {
        await payload.update({ collection: "pages", id: p.id, data: { fullWidthTemplate: true } });
        updated++;
      }
    }
    console.log(`${site.domain}: checked ${checked} so far, updated ${updated} so far`);
  }

  console.log(`\nDone. Checked ${checked} pages, updated ${updated}.`);
  await conn.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
