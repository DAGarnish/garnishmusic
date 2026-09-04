import { getPayload } from "payload";
import config from "../payload.config";

// Creates the new "staging" site (slug/domain freed up since edu's own
// promotion - see scripts/promote-staging-to-edu.ts) as NY's preview clone,
// same pattern as every previous "staging" tenant (pdx->hou, la, mia, edu
// each cycled through this slug in turn - see lib/modern-site-routes.ts's
// own history comments). Clones NY's real mainMenu verbatim (same nav a
// visitor sees today) so ModernHeader/ModernFooter render identically;
// content documents are NOT cloned - the homepage is hand-built fresh (see
// components/modern/ModernNYHomePage.tsx) with zero WPBakery/legacy markup,
// per explicit request (2026-09-04) to leave all of that behind on NY
// itself.
const NY_SITE_ID = 14;

async function main() {
  const payload = await getPayload({ config });

  const existing = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  if (existing.totalDocs > 0) {
    console.error("a site with slug 'staging' already exists - aborting", existing.docs[0]);
    process.exit(1);
  }

  const ny = await payload.findByID({ collection: "sites", id: NY_SITE_ID, depth: 0 });
  console.log("source site:", (ny as any).slug, (ny as any).name);

  const created = await payload.create({
    collection: "sites",
    data: {
      slug: "staging",
      domain: "staging.garnishmusicproduction.com",
      name: (ny as any).name,
      isMainSite: false,
      mainMenu: (ny as any).mainMenu,
      footerCopyright: (ny as any).footerCopyright,
      footerCopyrightBottom: (ny as any).footerCopyrightBottom,
    },
  });
  console.log("created staging site id:", created.id);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
