import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

async function main() {
  const payload = await getPayload({ config });
  
  const collections = ["pages"];
  let totalUpdated = 0;
  
  for (const collection of collections) {
    let hasMore = true;
    let pageNum = 1;
    
    while (hasMore) {
      const result = await payload.find({
        collection: collection as any,
        limit: 100,
        page: pageNum,
        where: {
          and: [
            { slug: { not_equals: "grades" } },
            {
              or: [
                { wpRawContent: { contains: "Graded in London" } },
                { wpRawContent: { contains: "music production grades" } },
                { wpRawContent: { contains: "Music Production Grades" } }
              ]
            }
          ]
        }
      });
      
      if (result.docs.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const doc of result.docs) {
        let content = doc.wpRawContent as string;
        if (!content) continue;
        
        let newContent = content;

        // 1. Remove " - Graded in London"
        newContent = newContent.replace(/\s*-\s*Graded in London/gi, "");

        // 2. Remove sentences like "More on music production grades on our London website <a ...>here</a>."
        newContent = newContent.replace(/More on music production grades[^<]*(?:<a[^>]*>[^<]*<\/a>[^.]*)?\.?/gi, "");

        // 3. Remove "Students worldwide take a Grade 6, 7 or 8 examination."
        newContent = newContent.replace(/Students worldwide take a Grade 6, 7,? or 8 examination\.?\s*/gi, "");
        
        // 4. Remove "All Diploma students can opt in to take a Grade 6, 7 or 8 examination."
        newContent = newContent.replace(/All Diploma students can opt in to take a Grade 6, 7,? or 8 examination\.?\s*/gi, "");

        // 5. Remove "You can find out more about music production grades by clicking <a ...>here</a>."
        newContent = newContent.replace(/You can find out more about music production grades by clicking\s*(?:<a[^>]*>[^<]*<\/a>[^.]*)?\.?/gi, "");

        // 6. Remove "Students have the option to take a Grade 6, 7, or 8 examination at the end of their program."
        newContent = newContent.replace(/Students have the option to take a Grade 6, 7,? or 8 examination at the end of their program\.?\s*/gi, "");

        // 7. Remove any trailing " ." or " ," left behind
        newContent = newContent.replace(/\s+\./g, ".");
        newContent = newContent.replace(/\s+,/g, ",");
        
        if (newContent !== content) {
          console.log(`Updating ${doc.title} (${doc.slug}) - ID: ${doc.id}`);
          await payload.update({
            collection: collection as any,
            id: doc.id,
            data: {
              wpRawContent: newContent
            }
          });
          totalUpdated++;
        }
      }
      
      // Since we are updating and our query condition might not be met anymore (if we replaced all occurrences),
      // we might skip pages if we increment pageNum. But we have limit 100 and there are < 100 docs total,
      // so it will just finish on page 1.
      hasMore = false;
    }
  }

  console.log(`Total documents updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch(console.error);
