import { getPayload } from "payload";
import config from "../payload.config";

// The migration copied WordPress's rank_math_title/_description postmeta
// verbatim into seo.metaTitle/metaDescription. On most pages that value is
// a plain string, but on some, the SEO Title/Description was authored in
// RankMath using its own merge-tag syntax (%title%, %sep%, %sitename%,
// %page%), which RankMath resolves dynamically at request time on
// WordPress rather than storing pre-resolved. This migration never
// resolved them, so those pages/posts render the literal, unresolved
// template string (found via edu's /international-academy/, whose title
// tag was literally "%title% %sep% %sitename%").
//
// Confirmed against live production (edu, ny, la) that:
// - %title%    -> the post/page's own title
// - %sitename% -> the site's name (matches this network's Payload site.name
//   exactly, e.g. edu = "Garnish Music Production School, Worldwide")
// - %sep%      -> "-", RankMath's title_separator - identical across every
//   site's exported RankMath settings (network-wide, not per-site)
// - %page%     -> "" for singular pages/posts (RankMath only populates
//   this for paginated archives), confirmed on ny's /music-foundations/
//   and /international-students/, whose titles show no stray page marker
// After substitution, WordPress collapses repeated whitespace left behind
// by an empty %page% down to a single space (confirmed byte-exact against
// ny's /music-foundations/ title tag) and trims the ends.

const TITLE_SEPARATOR = "-";
const TAG_PATTERN = /%[a-z_()0-9]+%/i;

function resolveRankMathTags(template: string, vars: { title: string; sitename: string }): string {
  const replaced = template
    .replace(/%title%/g, vars.title)
    .replace(/%sitename%/g, vars.sitename)
    .replace(/%sep%/g, TITLE_SEPARATOR)
    .replace(/%page%/g, "");
  return replaced.replace(/\s+/g, " ").trim();
}

async function main() {
  const onlyDomain = process.argv[2];
  const payload = await getPayload({ config });

  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const sites = onlyDomain ? allSites.docs.filter((s) => s.domain === onlyDomain) : allSites.docs;

  let totalChecked = 0;
  let totalUpdated = 0;

  for (const site of sites) {
    console.log(`\n=== ${site.domain} ===`);

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
          totalChecked += 1;
          const rawTitle: string | undefined = doc.seo?.metaTitle;
          const rawDescription: string | undefined = doc.seo?.metaDescription;
          const titleHasTags = rawTitle && TAG_PATTERN.test(rawTitle);
          const descHasTags = rawDescription && TAG_PATTERN.test(rawDescription);
          if (!titleHasTags && !descHasTags) continue;

          const vars = { title: doc.title || "", sitename: site.name };
          const newTitle = titleHasTags ? resolveRankMathTags(rawTitle, vars) : rawTitle;
          const newDescription = descHasTags ? resolveRankMathTags(rawDescription, vars) : rawDescription;

          await payload.update({
            collection,
            id: doc.id,
            data: {
              seo: {
                ...doc.seo,
                metaTitle: newTitle,
                metaDescription: newDescription,
              },
            },
          });
          totalUpdated += 1;
          if (titleHasTags) console.log(`  updated ${collection} #${doc.id} title: "${rawTitle}" -> "${newTitle}"`);
          if (descHasTags) console.log(`  updated ${collection} #${doc.id} description: "${rawDescription}" -> "${newDescription}"`);
        }

        if (result.docs.length < 200) break;
        page += 1;
      }
    }
  }

  console.log(`\nChecked ${totalChecked} records, updated ${totalUpdated}.`);
  process.exit(0);
}

main();
