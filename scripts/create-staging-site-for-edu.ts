import { getPayload } from "payload";
import config from "../payload.config";

// Creates the "staging" site (network-hub homepage preview - see
// ModernEduHomePage) as a lightweight clone of edu's own site metadata.
// Unlike the previous three "staging" tenants (pdx/la/mia), this preview
// doesn't clone edu's ~100 pages - just its nav menu, so the header renders
// real links while only the homepage itself gets the new design.
async function main() {
  const payload = await getPayload({ config });

  const existing = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  if (existing.totalDocs > 0) {
    console.error("a 'staging' site already exists - aborting", existing.docs[0]);
    process.exit(1);
  }

  const edu = (await payload.findByID({ collection: "sites", id: 15, depth: 0 })) as any;

  const site = await payload.create({
    collection: "sites",
    data: {
      name: "Garnish Music Production School, Worldwide",
      domain: "staging.garnishmusicproduction.com",
      slug: "staging",
      isMainSite: false,
      mainMenu: edu.mainMenu,
      homepageWpId: edu.homepageWpId,
    },
  });
  console.log("created staging site", site.id);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
