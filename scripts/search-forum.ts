import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });
  
  for (const site of sites.docs) {
    if (site.mainMenu && Array.isArray(site.mainMenu)) {
      const searchMenu = (items: any[]) => {
        for (const item of items) {
          if (item.label && item.label.toLowerCase().includes("future")) {
            console.log(`Found "${item.label}" in menu of site: ${site.slug}`);
          }
          if (item.subMenu && Array.isArray(item.subMenu)) {
            searchMenu(item.subMenu);
          }
        }
      };
      searchMenu(site.mainMenu);
    }
  }

  process.exit(0);
}

main().catch(console.error);
