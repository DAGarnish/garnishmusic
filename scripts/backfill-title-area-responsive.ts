import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

// mkd_title_area_background_image_responsive_meta was never captured by
// migrate-content.ts - only mkd_title_area_background_image_meta (the image
// itself) was. When this meta is "no", production renders the title area's
// background as a plain inline background-image on .mkd-title directly
// (classes mkd-title-image-not-responsive, no mkd-has-responsive-background),
// with height either from mkd_title_area_height_meta or computed by the
// theme's own parallax scroll JS (mkd-has-parallax-background) when that
// meta is absent. Our page.tsx previously always rendered the responsive
// <img>-in-.mkd-title-image markup regardless, which depends on theme CSS/JS
// that only activates for genuinely responsive pages - for "no" pages this
// left the title area's CSS height:auto!important (buro-modules.css
// .mkd-title.mkd-has-responsive-background) with no JS ever setting an
// explicit height, collapsing the whole hero image to 0px (confirmed against
// production, e.g. mia's /courses/curso-de-dj-espanol/, whose image never
// appeared locally despite the media file itself resolving fine).

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

  let updated = 0, checked = 0;

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
        `SELECT meta_key, meta_value FROM ${prefix}postmeta WHERE post_id = ? AND meta_key IN ('mkd_title_area_background_image_responsive_meta', 'mkd_title_area_height_meta')`,
        [p.wpPostId]
      );
      const responsiveMeta = rows.find((r: any) => r.meta_key === "mkd_title_area_background_image_responsive_meta")?.meta_value;
      const heightMeta = rows.find((r: any) => r.meta_key === "mkd_title_area_height_meta")?.meta_value;
      if (responsiveMeta === undefined && heightMeta === undefined) continue;

      const data: Record<string, unknown> = {};
      if (responsiveMeta !== undefined) data.titleBackgroundResponsive = responsiveMeta !== "no";
      if (heightMeta !== undefined) {
        const n = parseInt(heightMeta, 10);
        if (!Number.isNaN(n)) data.titleAreaHeight = n;
      }
      await payload.update({ collection: "pages", id: p.id, data });
      updated++;
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
