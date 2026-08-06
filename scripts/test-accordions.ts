import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 100,
  });

  const products = await payload.find({
    collection: "products",
    limit: 100,
  });

  const docs = [...pages.docs, ...products.docs];

  let totalUpdated = 0;

  for (const doc of docs) {
    if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
      let content = doc.wpRawContent;
      
      // Look for sequences of <strong>Title</strong> (with optional <p> wrappers) followed by <ul>...</ul>
      // Actually, many pages might have this. Let's just do a dry run first to see what matches.
      const regex = /(?:<p>)?<strong>(.*?)<\/strong>(?:<\/p>)?\s*<ul>(.*?)<\/ul>/gs;
      
      let match;
      let hasMatches = false;
      
      // Let's print out what we find to see if it's safe.
      while ((match = regex.exec(content)) !== null) {
        if (!hasMatches) {
           console.log(`\n--- Matches in ${doc.slug} ---`);
           hasMatches = true;
        }
        console.log(`Title: ${match[1]}`);
      }
    }
  }

  process.exit(0);
}

main().catch(console.error);
