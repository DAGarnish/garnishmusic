import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });
  
  let found = 0;
  
  for (const site of sites.docs) {
    if (site.mainMenu && Array.isArray(site.mainMenu)) {
      let hasForum = false;
      
      const cleanMenu = (items: any[]) => {
        return items.filter(item => {
          if (item.label === "Future Music Forum") {
            hasForum = true;
            return false;
          }
          if (item.subMenu && Array.isArray(item.subMenu)) {
            item.subMenu = cleanMenu(item.subMenu);
          }
          return true;
        });
      };
      
      const updatedMenu = cleanMenu(site.mainMenu);
      
      if (hasForum) {
        console.log(`Removing from site: ${site.slug}`);
        await payload.update({
          collection: "sites",
          id: site.id,
          data: { mainMenu: updatedMenu }
        });
        found++;
      }
    }
  }

  console.log(`Removed Future Music Forum from ${found} sites.`);
  process.exit(0);
}

main().catch(console.error);
