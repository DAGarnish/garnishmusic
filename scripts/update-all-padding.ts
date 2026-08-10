import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const collections = ["pages", "posts", "products"] as const;
  let totalUpdated = 0;
  
  for (const collection of collections) {
    const items = await payload.find({
      collection,
      limit: 1000,
    });
    
    for (const item of items.docs) {
      if (item.wpRawContent && typeof item.wpRawContent === 'string') {
        const originalContent = item.wpRawContent;
        
        // Regex to match padding properties and their values
        const updatedContent = originalContent.replace(
          /(padding(?:-(?:top|bottom|left|right))?):\s*([0-9]+)px/gi,
          (match, prop, value) => {
            const numValue = parseInt(value, 10);
            if (numValue > 32) {
              return `${prop}: 32px`;
            }
            return match;
          }
        );
        
        if (updatedContent !== originalContent) {
          console.log(`Updating ${collection} ID: ${item.id} (slug: ${item.slug})`);
          await payload.update({
            collection,
            id: item.id,
            data: { wpRawContent: updatedContent }
          });
          totalUpdated++;
        }
      }
    }
  }

  console.log(`Updated ${totalUpdated} items across all collections.`);
  process.exit(0);
}

main().catch(console.error);
