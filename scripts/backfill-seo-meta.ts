import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";
import { decodeHTML } from "entities";

// Corrects seo.metaTitle/seo.metaDescription for pages and posts whose
// value was migrated from the now-dead _yoast_wpseo_title/_metadesc meta
// (a leftover from a since-replaced plugin) instead of reproducing what
// RankMath - this network's actual active SEO plugin - renders live by
// default when a page/post has no rank_math_title/_description override:
// "{title} - {sitename}" for the title, the excerpt for the description.
// See migrate-content.ts for the full explanation (found via Sydney's
// homepage, whose leftover Yoast title still said "Berlin").
//
// Only touches records that have no rank_math_title/_description meta in
// WordPress - i.e. exactly the ones the old migration logic mis-sourced
// from Yoast. Anything with a real RankMath override is left untouched.

async function main() {
  const onlyDomain = process.argv[2];
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const sites = onlyDomain ? allSites.docs.filter((s) => s.domain === onlyDomain) : allSites.docs;

  let totalChecked = 0;
  let totalUpdated = 0;

  for (const site of sites) {
    const blogId = site.wpBlogId as number | undefined;
    if (!blogId) {
      console.log(`\n=== ${site.domain} - skipped (no wpBlogId) ===`);
      continue;
    }
    const prefix = tablePrefixForBlog(blogId);
    console.log(`\n=== ${site.domain} (blog ${blogId}) ===`);

    let rankMathTitleIds: Set<number>;
    let rankMathDescIds: Set<number>;
    try {
      const [titleRows] = await conn.query<any[]>(
        `SELECT post_id FROM ${prefix}postmeta WHERE meta_key='rank_math_title';`
      );
      const [descRows] = await conn.query<any[]>(
        `SELECT post_id FROM ${prefix}postmeta WHERE meta_key='rank_math_description';`
      );
      rankMathTitleIds = new Set((titleRows as any[]).map((r) => r.post_id));
      rankMathDescIds = new Set((descRows as any[]).map((r) => r.post_id));
    } catch (err) {
      console.log(`  SKIP (no WP tables for this blog): ${(err as Error).message.slice(0, 150)}`);
      continue;
    }

    for (const collection of ["pages", "posts"] as const) {
      let page = 1;
      while (true) {
        const result = await payload.find({
          collection,
          where: { site: { equals: site.id } },
          limit: 200,
          page,
        });
        for (const doc of result.docs as any[]) {
          if (!doc.wpPostId) continue;
          totalChecked += 1;
          const hasRankMathTitle = rankMathTitleIds.has(doc.wpPostId);
          const hasRankMathDesc = rankMathDescIds.has(doc.wpPostId);
          if (hasRankMathTitle && hasRankMathDesc) continue; // real overrides, leave alone

          const correctTitle = hasRankMathTitle
            ? doc.seo?.metaTitle
            : `${decodeHTML(doc.title || "")} - ${site.name}`;
          const correctDescription = hasRankMathDesc ? doc.seo?.metaDescription : doc.excerpt;

          const titleChanged = !hasRankMathTitle && doc.seo?.metaTitle !== correctTitle;
          const descChanged = !hasRankMathDesc && doc.seo?.metaDescription !== correctDescription;

          if (titleChanged || descChanged) {
            await payload.update({
              collection,
              id: doc.id,
              data: {
                seo: {
                  ...doc.seo,
                  metaTitle: correctTitle,
                  metaDescription: correctDescription,
                },
              },
            });
            totalUpdated += 1;
            console.log(`  updated ${collection} #${doc.id} (wpPostId ${doc.wpPostId}): "${doc.seo?.metaTitle}" -> "${correctTitle}"`);
          }
        }
        if (result.docs.length < 200) break;
        page += 1;
      }
    }
  }

  console.log(`\nChecked ${totalChecked} records, updated ${totalUpdated}.`);
  await conn.end();
  process.exit(0);
}

main();
