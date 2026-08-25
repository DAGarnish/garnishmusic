import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");
  if (!pdx) {
    console.log("No pdx site found. Slugs:", sites.docs.map((s: any) => s.slug));
    return;
  }
  console.log("=== SITE ===");
  console.log(JSON.stringify({ ...pdx, mainMenu: undefined }, null, 2));
  console.log("=== MAIN MENU ===");
  console.log(JSON.stringify(pdx.mainMenu, null, 2));

  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx.id } }] },
    limit: 200,
    depth: 0,
  });
  console.log("=== PAGES (slug/title/wpPostId) ===");
  console.log(pages.docs.map((p: any) => ({ slug: p.slug, title: p.title, wpPostId: p.wpPostId, homepageWpId: pdx.homepageWpId })));

  const home = pages.docs.find((p: any) => p.wpPostId === pdx.homepageWpId);
  console.log("=== HOMEPAGE DOC ===");
  console.log(JSON.stringify(home, null, 2)?.slice(0, 6000));

  const sliders = await payload.find({
    collection: "hero-sliders",
    where: { site: { equals: pdx.id } },
    limit: 20,
    depth: 1,
  });
  console.log("=== HERO SLIDERS ===");
  console.log(JSON.stringify(sliders.docs, null, 2)?.slice(0, 6000));

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
