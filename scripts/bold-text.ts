import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 100,
    where: {
      slug: { equals: "programs/ableton-producer-program" }
    }
  });
  
  for (const page of pages.docs) {
    if (page.layout) {
      const processBlocks = (blocks: any[]) => {
         for (const block of blocks) {
            for (const key in block) {
               if (typeof block[key] === 'string' && block[key].toLowerCase().includes("choose garnish")) {
                  block[key] = block[key].replace(/<h4><h4><strong>Why choose Garnish\?<\/strong><\/h4><\/h4>/g, "<strong style=\"font-weight: 900 !important; font-size: 1.2em;\">Why choose Garnish?</strong>");
                  block[key] = block[key].replace(/<h4><strong>Why choose Garnish\?<\/strong><\/h4>/g, "<strong style=\"font-weight: 900 !important; font-size: 1.2em;\">Why choose Garnish?</strong>");
                  block[key] = block[key].replace(/<strong><strong>Why choose Garnish\?<\/strong><\/strong>/g, "<strong style=\"font-weight: 900 !important; font-size: 1.2em;\">Why choose Garnish?</strong>");
                  block[key] = block[key].replace(/<strong>Why choose Garnish\?<\/strong>/g, "<strong style=\"font-weight: 900 !important; font-size: 1.2em;\">Why choose Garnish?</strong>");
               }
            }
            if (block.columns) processBlocks(block.columns);
            if (block.blocks) processBlocks(block.blocks);
         }
      };
      
      processBlocks(page.layout);
      await payload.update({
         collection: "pages",
         id: page.id,
         data: { layout: page.layout }
      });
    }
  }

  process.exit(0);
}

main().catch(console.error);
