import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

// The "F1 USA Visa Eligible (LA)" nav item (added network-wide by
// scripts/update-uk-accredited-menu.ts, under each site's "Accredited"
// entry) pointed at la's old "undergraduate-business-and-music" slug -
// wrong page (confirmed dead: 404s on la's real site now). Every site
// clones its own copy of this menu item into its own `mainMenu` doc (21 of
// them - see scripts/preview-f1-visa-nav-link.ts's output), so this walks
// every site's tree and rewrites any item whose url is exactly the old
// broken one. Matched by url, not label - la/la-old's own "USA F1 Visa
// Eligible" nav item is a *different*, already-correct thing (a "#"
// dropdown parent whose one real child already points at
// /certificate-music-production-songwriting on la's own domain); matching
// by label would have wrongly clobbered that parent's "#" with a direct
// link and orphaned its child.
const OLD_URL = "https://la.garnishmusicproduction.com/undergraduate-business-and-music/";
const NEW_URL = "https://la.garnishmusicproduction.com/certificate-music-production-songwriting/";

function traverseMenu(menu: any[]): boolean {
  let updated = false;
  for (const item of menu) {
    if (item.url === OLD_URL) {
      if (item.url !== NEW_URL || item.newTab !== true) {
        item.url = NEW_URL;
        item.newTab = true;
        updated = true;
      }
    }
    if (item.children && Array.isArray(item.children)) {
      if (traverseMenu(item.children)) updated = true;
    }
  }
  return updated;
}

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });

  let totalUpdated = 0;
  for (const site of sites.docs as any[]) {
    if (!site.mainMenu) continue;
    const menuCopy = JSON.parse(JSON.stringify(site.mainMenu));
    if (traverseMenu(menuCopy)) {
      console.log(`Updating menu for site: ${site.name} (${site.slug})`);
      await payload.update({ collection: "sites", id: site.id, data: { mainMenu: menuCopy } });
      totalUpdated++;
    }
  }
  console.log(`Total sites updated: ${totalUpdated}`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
