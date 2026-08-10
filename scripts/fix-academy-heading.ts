import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 100,
    where: { slug: { equals: "academy/electronic-music-production" } }
  });
  
  for (const page of pages.docs) {
    if (!page.layout) continue;
    let updated = false;

    const processBlocks = (blocks: any[]) => {
      for (const block of blocks) {
        for (const key in block) {
          if (typeof block[key] === 'string' && block[key].toLowerCase().includes("choose garnish")) {
            block[key] = block[key]
              .replace(/<h4><h4><strong style="[^"]*">Why choose Garnish\?<\/strong><\/h4><\/h4>/gi, '<h3>Why choose Garnish?</h3>')
              .replace(/<h4><strong style="[^"]*">Why choose Garnish\?<\/strong><\/h4>/gi, '<h3>Why choose Garnish?</h3>')
              .replace(/<strong style="[^"]*">Why choose Garnish\?<\/strong>/gi, '<h3>Why choose Garnish?</h3>')
              .replace(/<strong><strong>Why choose Garnish\?<\/strong><\/strong>/gi, '<h3>Why choose Garnish?</h3>')
              .replace(/<strong>Why choose Garnish\?<\/strong>/gi, '<h3>Why choose Garnish?</h3>');
            console.log(`Fixed heading in page ${page.id}, block ${block.blockType}`);
            updated = true;
          }
        }
        if (block.columns) processBlocks(block.columns);
        if (block.blocks) processBlocks(block.blocks);
      }
    };

    processBlocks(page.layout);
    if (updated) {
      await payload.update({ collection: "pages", id: page.id, data: { layout: page.layout } });
    }
  }
  
  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
