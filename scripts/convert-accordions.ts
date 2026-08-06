import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const collections = ["pages", "products"];
  let totalUpdated = 0;

  for (const collection of collections) {
    const records = await payload.find({
      collection: collection as "pages" | "products",
      limit: 1000,
    });

    for (const doc of records.docs) {
      if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
        let content = doc.wpRawContent;
        
        // This regex looks for <strong>...</strong> followed by <ul>...</ul>
        // We want to replace each contiguous block.
        // First we replace each <strong>...</strong><ul>...</ul> with an accordion tab
        // But if they are contiguous, they should probably be wrapped in one [mkd_accordion]
        
        // Let's do a simpler approach:
        // We will just wrap every single <strong><ul> sequence in its own accordion?
        // Or wrap a block of them?
        // Actually, [mkd_accordion] can contain multiple tabs, but multiple [mkd_accordion] with one tab each also works and looks identical if they have no space between them, OR we can just wrap the whole thing.
        
        const blockRegex = /(?:(?:<p>)?<strong>(.*?)<\/strong>(?:<\/p>)?\s*<ul>(.*?)<\/ul>\s*)+/gs;
        
        let newContent = content.replace(blockRegex, (match) => {
          // Inside the block, parse each item
          const itemRegex = /(?:<p>)?<strong>(.*?)<\/strong>(?:<\/p>)?\s*<ul>(.*?)<\/ul>/gs;
          let result = '\n[mkd_accordion style="toggle"]';
          let itemMatch;
          while ((itemMatch = itemRegex.exec(match)) !== null) {
            // Check if title has colon and remove it if so
            let title = itemMatch[1].replace(/:(\s*(<\/span>)?\s*)$/, '$1').trim();
            result += `\n[mkd_accordion_tab title="${title}" title_tag="h5"]\n[vc_column_text]\n<ul>${itemMatch[2]}</ul>\n[/vc_column_text]\n[/mkd_accordion_tab]`;
          }
          result += '\n[/mkd_accordion]\n';
          return result;
        });

        if (newContent !== content) {
          console.log(`Updating ${collection}/${doc.slug}...`);
          await payload.update({
            collection: collection as "pages" | "products",
            id: doc.id,
            data: {
              wpRawContent: newContent,
            },
          });
          totalUpdated++;
        }
      }
    }
  }

  console.log(`Successfully updated ${totalUpdated} documents.`);
  process.exit(0);
}

main().catch(console.error);
