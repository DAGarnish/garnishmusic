import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  // Find the page
  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: {
        equals: "ba-pathway-courses"
      }
    }
  });

  console.log(`Found ${pages.totalDocs} pages with slug "ba-pathway-courses"`);
  
  for (const doc of pages.docs) {
    console.log(`Deleting page ID: ${doc.id}`);
    await payload.delete({
      collection: "pages",
      id: doc.id
    });
  }

  // Find all sites
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });

  for (const site of sites.docs) {
    let changed = false;
    
    // Recursive function to filter out the menu item
    const filterMenu = (items: any[]) => {
      if (!items) return [];
      const newItems = items.filter(item => {
        if (item.label === "BA (Hons) Pathways (BCN)" || item.url?.includes("ba-pathway-courses")) {
          changed = true;
          return false;
        }
        return true;
      });
      
      for (const item of newItems) {
        if (item.children && item.children.length > 0) {
          const oldLen = item.children.length;
          item.children = filterMenu(item.children);
          if (item.children.length !== oldLen) changed = true;
        }
      }
      return newItems;
    };

    if (site.mainMenu) {
      const newMenu = filterMenu(site.mainMenu);
      if (changed) {
        console.log(`Updating menu for site: ${site.name} (${site.domain})`);
        await payload.update({
          collection: "sites",
          id: site.id,
          data: {
            mainMenu: newMenu
          }
        });
      }
    }
  }
  
  console.log("Done");
  process.exit(0);
}

main().catch(console.error);
