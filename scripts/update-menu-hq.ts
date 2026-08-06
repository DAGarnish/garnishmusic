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

    const filterMenu = (items: any[]) => {
      if (!items) return [];
      
      const newItems = items.filter(item => {
        // Remove 'mrb'
        const labelLower = (item.label || "").toLowerCase();
        if (labelLower === "mrb" || labelLower.includes("marbella")) {
          changed = true;
          console.log(`Removing MRB item from ${site.name}: ${item.label}`);
          return false;
        }
        return true;
      });

      for (const item of newItems) {
        // Remove HQ after NY
        if (item.label && item.label.includes("NY")) {
          const original = item.label;
          item.label = item.label.replace(/\s*\(?HQ\)?/gi, "").trim();
          if (original !== item.label) {
            changed = true;
            console.log(`Changed label from "${original}" to "${item.label}" on ${site.name}`);
          }
        }
        
        if (item.children && item.children.length > 0) {
          const oldLen = item.children.length;
          item.children = filterMenu(item.children);
          if (item.children.length !== oldLen) {
             // already set changed = true in filter
          }
        }
      }
      return newItems;
    };

    const newMenu = filterMenu(site.mainMenu);
    
    if (changed) {
      console.log(`Updating site: ${site.name}`);
      await payload.update({
        collection: "sites",
        id: site.id,
        data: {
          mainMenu: newMenu
        }
      });
      totalUpdated++;
    }
  }

  console.log(`Total sites updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch(console.error);
