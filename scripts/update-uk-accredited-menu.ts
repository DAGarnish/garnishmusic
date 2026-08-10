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

const laOfferings = [
  {
    "url": "https://la.garnishmusicproduction.com/undergraduate-business-and-music/",
    "label": "F1 USA Visa Eligible (LA)",
    "newTab": true,
    "children": []
  }
];

function traverseMenu(menu: any[]): boolean {
  let updated = false;
  for (const item of menu) {
    if (item.label && item.label.toLowerCase().includes("uk-accredited") || item.label.toLowerCase().includes("uk accredited")) {
      item.label = "Accredited";
      item.children = laOfferings;
      item.url = "#";
      updated = true;
    }
    if (item.children && Array.isArray(item.children)) {
      if (traverseMenu(item.children)) {
        updated = true;
      }
    }
  }
  return updated;
}

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });
  
  let totalUpdated = 0;
  
  for (const site of sites.docs) {
    if (site.mainMenu) {
      const menuCopy = JSON.parse(JSON.stringify(site.mainMenu));
      const updated = traverseMenu(menuCopy);
      
      if (updated) {
        console.log(`Updating menu for site: ${site.name} (${site.slug})`);
        await payload.update({
          collection: "sites",
          id: site.id,
          data: {
            mainMenu: menuCopy
          }
        });
        totalUpdated++;
      }
    }
  }

  console.log(`Total sites updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch(console.error);
