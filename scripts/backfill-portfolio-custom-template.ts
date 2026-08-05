import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

// Buro theme's per-portfolio-item "Portfolio Single Type" setting
// (mkd_portfolio_single_template_meta postmeta: 'custom' vs absent/'default')
// was never captured - page.tsx approximated it by checking whether the
// page's own content used the mkd_elements_holder shortcode, which is only
// correlated with this setting, not it. Confirmed wrong on nsh's
// /courses/ableton-live/ (meta is 'custom', production renders it
// full-width, own-layout) vs /courses/vocal-production/ and
// /courses/mixing-mastering/ (meta absent, production renders both with the
// theme's default two-column image+bio template) - none of the three use
// mkd_elements_holder, so the old heuristic put all three in the same
// (wrong, for ableton-live) bucket.

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
      where: { and: [{ site: { equals: site.id } }, { portfolioCategories: { exists: true } }] },
      limit: 1000,
    });

    for (const p of pages.docs as any[]) {
      if (!p.wpPostId) continue;
      checked++;
      const [rows]: any = await conn.query(
        `SELECT meta_value FROM ${prefix}postmeta WHERE post_id = ? AND meta_key = 'mkd_portfolio_single_template_meta' LIMIT 1`,
        [p.wpPostId]
      );
      const isCustom = rows[0]?.meta_value === "custom";
      if (isCustom) {
        await payload.update({ collection: "pages", id: p.id, data: { portfolioCustomTemplate: true } });
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
