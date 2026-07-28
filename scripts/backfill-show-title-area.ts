import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });
  let totalUpdated = 0;
  let totalHidden = 0;

  for (const site of sites.docs as any[]) {
    const blogId = site.wpBlogId as number;
    if (!blogId) continue;
    const prefix = tablePrefixForBlog(blogId);

    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { wpPostId: { exists: true } }] },
      limit: 5000,
      depth: 0,
    });
    if (pages.docs.length === 0) continue;

    const wpIds = pages.docs.map((p: any) => p.wpPostId).filter(Boolean);
    if (wpIds.length === 0) continue;

    let metaRows: any[] = [];
    try {
      const [rows] = await conn.query(
        `SELECT post_id, meta_value FROM ${prefix}postmeta WHERE post_id IN (${wpIds.join(",")}) AND meta_key = 'mkd_show_title_area_meta'`
      );
      metaRows = rows as any[];
    } catch (e) {
      console.log(`  ${site.domain}: skipping (table missing?) ${(e as Error).message}`);
      continue;
    }

    const metaByPostId = new Map<number, string>(metaRows.map((r) => [r.post_id, r.meta_value]));

    for (const page of pages.docs as any[]) {
      const metaValue = metaByPostId.get(page.wpPostId);
      const showTitleArea = metaValue !== "no";
      if (!showTitleArea) totalHidden++;
      await payload.update({
        collection: "pages",
        id: page.id,
        data: { showTitleArea },
      });
      totalUpdated++;
    }
    console.log(`${site.domain}: updated ${pages.docs.length} pages (${wpIds.length} had wpPostId)`);
  }

  console.log(`Done. Updated ${totalUpdated} pages total, ${totalHidden} with title area hidden.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
