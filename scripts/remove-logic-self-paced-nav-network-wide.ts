import { getPayload } from "payload";
import config from "../payload.config";

// User request (2026-09-04): remove the "Logic Self-Paced" nav item
// network-wide, on every site's navigation. An earlier one-off script
// (remove-logic-self-paced-nav.ts) only handled site 24 (mia). A DB survey
// (scripts/find-self-paced-nav-items.ts) found the same course still linked
// under two label variants across the rest of the network - "Logic
// Self-Paced Online" and "Logic Pro Self Paced" - each nested one level
// under a Beginner/Express Classes group. This strips both variants, at any
// depth, from every site's mainMenu.
async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 500 });

  function stripItems(items: any[]): { items: any[]; removed: string[] } {
    const removed: string[] = [];
    const kept = items
      .filter((item) => {
        if (typeof item.label === "string" && /self.?paced/i.test(item.label)) {
          removed.push(item.label);
          return false;
        }
        return true;
      })
      .map((item) => {
        if (!item.children || item.children.length === 0) return item;
        const { items: children, removed: childRemoved } = stripItems(item.children);
        removed.push(...childRemoved);
        return { ...item, children };
      });
    return { items: kept, removed };
  }

  for (const site of sites.docs as any[]) {
    if (!site.mainMenu || site.mainMenu.length === 0) continue;
    const { items: newMenu, removed } = stripItems(site.mainMenu);
    if (removed.length === 0) continue;
    await payload.update({ collection: "sites", id: site.id, data: { mainMenu: newMenu } });
    console.log(`site ${site.id} (${site.slug}): removed ${removed.join(", ")}`);
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
