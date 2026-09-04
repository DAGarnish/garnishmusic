import { getPayload } from "payload";
import config from "../payload.config";

// User request (2026-09-04): merge Manhattan and Brooklyn's contact info
// onto one page (staging's /contact-map/, Manhattan first) and just link to
// that page from the nav's "Contact" button - so this collapses the
// top-level "Contact" item's two-item dropdown (Manhattan -> /contact-map,
// Brooklyn -> /brooklyn) into a single direct link to /contact-map.
// (/brooklyn now redirects to /contact-map server-side, see
// [[...slug]]/page.tsx.) staging-only DB write (site 29, ny's clone).
async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  const site = sites.docs[0] as any;
  if (!site) {
    console.error("no 'staging' site found - aborting");
    process.exit(1);
  }

  const menu = JSON.parse(JSON.stringify(site.mainMenu || []));
  const contactIdx = menu.findIndex((n: any) => n.label === "Contact");
  if (contactIdx === -1) {
    console.error("could not find top-level 'Contact' item - aborting", menu.map((n: any) => n.label));
    process.exit(1);
  }

  menu[contactIdx] = { ...menu[contactIdx], url: "/contact-map", children: [] };

  await payload.update({ collection: "sites", id: site.id, data: { mainMenu: menu } });
  console.log("updated staging's 'Contact' nav item:", JSON.stringify(menu[contactIdx]));
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
