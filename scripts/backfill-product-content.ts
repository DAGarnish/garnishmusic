import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

// migrate-content.ts's PRODUCTS section converts WordPress's post_content
// into the description (Lexical richText) field, exactly like every other
// content-migration path in this project. But WooCommerce products on this
// network store their actual body content in post_excerpt instead -
// post_content is empty for every single product checked network-wide (20
// spot-checked on ny alone, all content_len: 0). The real content, when a
// product has any, sits unused in post_excerpt, which the migration only
// ever truncated to 300 chars of "plain text" for shortDescription -  a
// textarea field, never rendered on the page at all, and for products whose
// excerpt is itself raw untouched shortcode markup (e.g. ny's electronic-
// dj-class, 30KB of raw [vc_row]... syntax) it isn't even plain text.
// Backfills the same wpRawContent field pattern Pages already has, sourced
// from post_excerpt, so it can go through the identical wpContentToStyledHtml
// shortcode-rendering pipeline pages already use (see page.tsx).

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

    const products = await payload.find({
      collection: "products",
      where: { site: { equals: site.id } },
      limit: 1000,
    });

    for (const p of products.docs as any[]) {
      if (!p.wpProductId) continue;
      checked++;
      const [rows]: any = await conn.query(
        `SELECT post_excerpt FROM ${prefix}posts WHERE ID = ? LIMIT 1`,
        [p.wpProductId]
      );
      const excerpt = rows[0]?.post_excerpt;
      if (!excerpt || !excerpt.trim()) continue;
      await payload.update({ collection: "products", id: p.id, data: { wpRawContent: excerpt } });
      updated++;
    }
    console.log(`${site.domain}: checked ${checked} so far, updated ${updated} so far`);
  }

  console.log(`\nDone. Checked ${checked} products, updated ${updated}.`);
  await conn.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
