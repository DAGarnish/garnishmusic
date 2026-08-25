import { getPayload } from "payload";
import configPromise from "../payload.config";

// pdx's "About" nav is missing the per-site group every other live site has
// (e.g. ny's "New York" group: Home/Discord/Instructors/founder bio) - it
// only has the "Other Locations" city-switcher, mislabeled "Locations".
// Adds the missing "Portland" group using pdx's own real pages (confirmed
// to exist: /locations is pdx's homepage content doc, /instructors is its
// instructor gallery), and renames "Locations" -> "Other Locations" to
// match ny's labeling. Discord and the Dave Garnish bio link are the same
// network-wide URLs ny's menu uses (not site-specific).
async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");
  if (!pdx) throw new Error("pdx site not found");

  const menu = JSON.parse(JSON.stringify(pdx.mainMenu)) as any[];
  const about = menu.find((item: any) => item.label === "About");
  if (!about) throw new Error('pdx mainMenu has no "About" item');

  const locations = about.children.find((c: any) => c.label === "Locations");
  if (!locations) throw new Error('pdx "About" has no "Locations" child to rename');
  locations.label = "Other Locations";

  const portlandGroup = {
    url: "#",
    label: "Portland",
    newTab: false,
    children: [
      { url: "/locations", label: "Home", newTab: false, children: [] },
      { url: "https://garn.link/discord", label: "Discord", newTab: true, children: [] },
      { url: "/instructors", label: "Instructors", newTab: false, children: [] },
      {
        url: "https://edu.garnishmusicproduction.com/courses/dave-garnish/",
        label: "Dave Garnish",
        newTab: true,
        children: [],
      },
    ],
  };
  about.children.unshift(portlandGroup);

  await payload.update({ collection: "sites", id: pdx.id, data: { mainMenu: menu } });
  console.log("pdx About menu updated:", JSON.stringify(about, null, 2));
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
