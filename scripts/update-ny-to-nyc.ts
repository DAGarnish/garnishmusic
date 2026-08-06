import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });

  let totalUpdated = 0;

  for (const site of sites.docs) {
    if (!site.mainMenu) continue;
    let changed = false;

    const mapMenu = (items: any[]) => {
      if (!items) return [];
      
      for (const item of items) {
        if (item.label && typeof item.label === 'string') {
          // Check for exact 'NY' or 'NY '
          if (item.label.trim() === "NY") {
            item.label = "NYC";
            changed = true;
            console.log(`Changed "NY" to "NYC" on ${site.name}`);
          }
        }
        
        if (item.children && item.children.length > 0) {
          mapMenu(item.children);
        }
      }
      return items;
    };

    mapMenu(site.mainMenu);
    
    if (changed) {
      console.log(`Updating site: ${site.name}`);
      await payload.update({
        collection: "sites",
        id: site.id,
        data: {
          mainMenu: site.mainMenu
        }
      });
      totalUpdated++;
    }
  }

  console.log(`Total sites updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch(console.error);
