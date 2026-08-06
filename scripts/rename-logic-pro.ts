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
        page: 1, // keep requesting page 1 because we modify them
        where: {
          or: [
            { title: { contains: "Logic Pro X" } },
            { wpRawContent: { contains: "Logic Pro X" } }
          ]
        }
      });
      
      if (result.docs.length === 0) {
        hasMore = false;
        break;
      }
      
      totalFound += result.docs.length;
      console.log(`Processing ${result.docs.length} docs in ${collection}`);
      
      for (const doc of result.docs) {
        let title = doc.title;
        let content = doc.wpRawContent;
        let changed = false;
        
        if (title && title.includes("Logic Pro X")) {
          title = title.replace(/Logic Pro X/g, "Logic Pro");
          changed = true;
        }
        
        if (content && content.includes("Logic Pro X")) {
          content = content.replace(/Logic Pro X/g, "Logic Pro");
          changed = true;
        }
        
        if (changed) {
           console.log(`Updating ${collection} ID: ${doc.id}`);
           await payload.update({
             collection: collection as any,
             id: doc.id,
             data: {
               title,
               wpRawContent: content
             }
           });
        }
      }
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

  console.log(`Total documents processed and updated: ${totalFound}`);
  process.exit(0);
}

main().catch(console.error);
