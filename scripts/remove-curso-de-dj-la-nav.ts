import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const SITE_ID = 16; // la

type MenuItem = {
  url: string;
  label: string;
  newTab: boolean;
  children: MenuItem[];
};

// Removes the "Curso de DJ (Español en MIA)" link (Programs > Pro Skills &
// More), which points off-site to mia.garnishmusicproduction.com's Spanish
// DJ course, from the LA nav.
function removeCursoDeDj(items: MenuItem[]): { items: MenuItem[]; removed: number } {
  let removed = 0;
  const filtered = items
    .filter((item) => {
      if (item.label === "Curso de DJ (Español en MIA)") {
        removed++;
        return false;
      }
      return true;
    })
    .map((item) => {
      if (item.children && item.children.length > 0) {
        const result = removeCursoDeDj(item.children);
        removed += result.removed;
        return { ...item, children: result.items };
      }
      return item;
    });
  return { items: filtered, removed };
}

async function main() {
  const payload = await getPayload({ config });
  const site = await payload.findByID({ collection: "sites", id: SITE_ID, depth: 0 });
  const mainMenu = site.mainMenu as unknown as MenuItem[];

  const { items, removed } = removeCursoDeDj(mainMenu);
  if (removed !== 1) {
    console.error(`Expected to remove exactly 1 menu item, removed ${removed} - aborting.`);
    process.exit(1);
  }

  await payload.update({
    collection: "sites",
    id: SITE_ID,
    data: { mainMenu: items as any },
  });

  console.log("Removed 'Curso de DJ (Español en MIA)' from site", SITE_ID, "mainMenu");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
