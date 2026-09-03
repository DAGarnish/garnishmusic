import { getPayload } from "payload";
import config from "../payload.config";

// User request: add "Why Us" (-> /why-us, the new ModernWhyUsPage) to
// staging's own nav, under About > Other (alongside Private/Bespoke,
// Online Community, Merch). staging-only - this is its own site doc's
// mainMenu, not a network-wide item like the F1 visa link was.
async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  const site = sites.docs[0] as any;
  if (!site) {
    console.error("no 'staging' site found - aborting");
    process.exit(1);
  }

  const menu = JSON.parse(JSON.stringify(site.mainMenu || []));
  const about = menu.find((n: any) => n.label === "About");
  const other = about?.children?.find((n: any) => n.label === "Other");
  if (!other) {
    console.error("could not find About > Other in staging's mainMenu - aborting", JSON.stringify(menu, null, 2));
    process.exit(1);
  }
  if (other.children.some((n: any) => n.label === "Why Us")) {
    console.error("'Why Us' already exists under About > Other - aborting");
    process.exit(1);
  }

  other.children.push({ label: "Why Us", url: "/why-us", newTab: false, children: [] });

  await payload.update({ collection: "sites", id: site.id, data: { mainMenu: menu } });
  console.log("added 'Why Us' under About > Other on site", site.id);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
