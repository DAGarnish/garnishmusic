import { getPayload } from "payload";
import configPromise from "../payload.config";

// Every course/program page across the network links to a "Private
// Instruction" page for one-to-one lessons, but that link was migrated as a
// hardcoded absolute URL to whichever site (ny or mrb) the original content
// was authored on, instead of the visitor's own site - see
// scripts/scan-private-instruction-links.ts (222 matches across ~19 sites)
// and scripts/check-private-tuition-variants.ts (confirming each affected
// site does have its own real, localized private-instruction/tuition page,
// just under a site-specific slug). This rewrites every one of those wrong
// absolute links to a same-site relative link to that real page.
const SITE_TARGET_SLUG: Record<string, string> = {
  pdx: "private-instruction",
  nsh: "private-instruction",
  ber: "private-instruction",
  edu: "private-instruction",
  hou: "private-instruction",
  syd: "private-instruction",
  hk: "private-tuition",
  mia: "private-tuition",
  tyo: "private-tuition",
  sea: "private-tuition",
  bcn: "private-tuition",
  lis: "private-tuition",
  la: "music-production-private-instruction",
  sf: "courses/private-instruction",
  // Only site with more than one real, non-generic candidate page found -
  // picked as the closest match to the "Music Production ... Private
  // Tuition | <City>" naming/content pattern every other site's real page
  // uses (the other two candidates were either a near-duplicate stub shared
  // verbatim across multiple sites, or an older/differently-structured page).
  www: "bespoke-private-tuition",
};

const WRONG_LINK_RE = /https?:\/\/(?:ny|mrb)\.garnishmusicproduction\.com\/private-instruction\/?/gi;

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const siteBySlug = new Map(sites.docs.map((s: any) => [s.slug, s]));

  let updated = 0;
  let linksFixed = 0;

  for (const [siteSlug, targetSlug] of Object.entries(SITE_TARGET_SLUG)) {
    const site = siteBySlug.get(siteSlug);
    if (!site) {
      console.log(`SKIP: site "${siteSlug}" not found`);
      continue;
    }

    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { wpRawContent: { like: "private-instruction" } }] },
      limit: 200,
      depth: 0,
    });

    for (const doc of pages.docs as any[]) {
      const raw: string = doc.wpRawContent || "";
      const matches = raw.match(WRONG_LINK_RE);
      if (!matches) continue;

      const fixed = raw.replace(WRONG_LINK_RE, `/${targetSlug}/`);
      await payload.update({ collection: "pages", id: doc.id, data: { wpRawContent: fixed } });
      updated++;
      linksFixed += matches.length;
      console.log(`${siteSlug}/${doc.slug}: fixed ${matches.length} link(s) -> /${targetSlug}/`);
    }
  }

  console.log(`\nDone. ${updated} pages updated, ${linksFixed} links fixed.`);
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
