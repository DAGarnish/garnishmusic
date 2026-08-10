import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 10,
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
                  console.log(`Page: ${page.id}, Block Type: ${block.blockType}, Key: ${key}`);
                  console.log(`--- START VALUE ---`);
                  console.log(block[key]);
                  console.log(`--- END VALUE ---`);
               }
            }
            if (block.columns) processBlocks(block.columns);
            if (block.blocks) processBlocks(block.blocks);
         }
      };
      
      processBlocks(page.layout);
    }
  }

  process.exit(0);
}

main().catch(console.error);
