import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 1000,
  });

  let totalStrong = 0;
  
  for (const doc of pages.docs) {
    if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
      const matches = doc.wpRawContent.match(/<strong>.*?<\/strong>/gs);
      if (matches) {
        totalStrong += matches.length;
        if (totalStrong < 10) {
           console.log(`Found in ${doc.slug}: ${matches.slice(0, 3).join(", ")}`);
        }
      }
    }
  }
  
  console.log(`Total <strong> tags found: ${totalStrong}`);
  process.exit(0);
}

main().catch(console.error);
