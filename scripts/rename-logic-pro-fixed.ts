import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const collections = ["pages", "products", "posts"];
  
  let totalFound = 0;
  
  for (const collection of collections) {
    let hasMore = true;
    let page = 1;
    while (hasMore) {
      const result = await payload.find({
        collection: collection as any,
        limit: 100,
        page: page, // Fetching page by page because we filter in JS now
      });
      
      if (result.docs.length === 0 || page > result.totalPages) {
        hasMore = false;
        break;
      }
      
      console.log(`Processing page ${page} of ${result.totalPages} in ${collection}`);
      
      for (const doc of result.docs) {
        let title = (doc as any).title;
        let content = doc.wpRawContent;
        let changed = false;
        
        if (title && typeof title === 'string' && title.includes("Logic Pro X")) {
          title = title.replace(/Logic Pro X/g, "Logic Pro");
          changed = true;
        }
        
        if (content && typeof content === 'string' && content.includes("Logic Pro X")) {
          content = content.replace(/Logic Pro X/g, "Logic Pro");
          changed = true;
        }
        
        if (changed) {
           console.log(`Updating ${collection} ID: ${doc.id}`);
           const updateData: any = {};
           if (title !== undefined) updateData.title = title;
           if (content !== undefined) updateData.wpRawContent = content;
           
           await payload.update({
             collection: collection as any,
             id: doc.id,
             data: updateData
           });
           totalFound++;
        }
      }
      page++;
    }
  }

  // Also check sites mainMenu
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });

  for (const site of sites.docs) {
    if (site.mainMenu) {
      const menuStr = JSON.stringify(site.mainMenu);
      if (menuStr.includes("Logic Pro X")) {
        const newMenuStr = menuStr.replace(/Logic Pro X/g, "Logic Pro");
        console.log(`Updating menu for site: ${site.name}`);
        await payload.update({
          collection: "sites",
          id: site.id,
          data: {
            mainMenu: JSON.parse(newMenuStr)
          }
        });
        totalFound++;
      }
    }
  }

  console.log(`Total documents updated: ${totalFound}`);
  process.exit(0);
}

main().catch(console.error);
