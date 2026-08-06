import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 1000,
  });

  let totalHeadingLists = 0;
  
  for (const doc of pages.docs) {
    if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
      const matches = doc.wpRawContent.match(/<h[456]>.*?<\/h[456]>\s*(?:<br\s*\/?>\s*)*<ul>/gs);
      if (matches) {
        totalHeadingLists += matches.length;
        if (totalHeadingLists < 5) {
           console.log(`Found in ${doc.slug}: ${matches[0]}`);
        }
      }
    }
  }
  
  console.log(`Total heading+list patterns found: ${totalHeadingLists}`);
  process.exit(0);
}

main().catch(console.error);
