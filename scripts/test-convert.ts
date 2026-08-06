import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const collections = ["pages", "products"];
  let totalFound = 0;

  for (const collection of collections) {
    const records = await payload.find({
      collection: collection as "pages" | "products",
      limit: 1000,
    });

    for (const doc of records.docs) {
      if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
        let content = doc.wpRawContent;
        
        // This regex looks for <strong>...</strong> followed by <ul>...</ul>
        // allowing for spaces, newlines, <br>, and <p> tags in between.
        
        const blockRegex = /(?:(?:<p>)?<strong>(.*?)<\/strong>(?:<\/p>)?\s*(?:<br\s*\/?>\s*)*<ul>([\s\S]*?)<\/ul>\s*)+/gs;
        
        let found = false;
        
        let newContent = content.replace(blockRegex, (match) => {
          found = true;
          // Inside the block, parse each item
          const itemRegex = /(?:<p>)?<strong>(.*?)<\/strong>(?:<\/p>)?\s*(?:<br\s*\/?>\s*)*<ul>([\s\S]*?)<\/ul>/gs;
          let result = '\n[mkd_accordion style="toggle"]';
          let itemMatch;
          while ((itemMatch = itemRegex.exec(match)) !== null) {
            let title = itemMatch[1].replace(/:(\s*(<\/span>)?\s*)$/, '$1').replace(/<[^>]*>?/gm, '').trim();
            result += `\n[mkd_accordion_tab title="${title}" title_tag="h5"]\n[vc_column_text]\n<ul>${itemMatch[2]}</ul>\n[/vc_column_text]\n[/mkd_accordion_tab]`;
          }
          result += '\n[/mkd_accordion]\n';
          
          if (totalFound < 3) {
            console.log("---- MATCH ----\n", match);
            console.log("---- REPLACEMENT ----\n", result);
          }
          
          return result;
        });

        if (found) {
          totalFound++;
        }
      }
    }
  }

  console.log(`Found ${totalFound} documents with lists to convert.`);
  process.exit(0);
}

main().catch(console.error);
