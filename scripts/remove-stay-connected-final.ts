import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const collections = ["pages", "products", "posts"] as const;
  
  let totalUpdated = 0;

  for (const collection of collections) {
    let hasMore = true;

    while (hasMore) {
      let result;
      try {
        result = await payload.find({
          collection,
          where: { wpRawContent: { contains: "Stay Connected" } },
          limit: 100,
          page: 1, // ALWAYS fetch page 1 because we are removing the match
          depth: 0
        });
      } catch (e) {
        console.log(`Error querying ${collection}:`, e.message);
        break;
      }

      if (result.docs.length === 0) {
          hasMore = false;
          break;
      }

      let updatedInBatch = 0;

      for (const doc of result.docs) {
        if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
          // 1. Try vc_row_inner
          const regex1 = /\[vc_row_inner[^\]]*\](?:(?!\[\/?vc_row_inner)[^])*?Stay Connected(?:(?!\[\/?vc_row_inner)[^])*?\[\/vc_row_inner\]/ig;
          let newContent = doc.wpRawContent.replace(regex1, "");
          
          // 2. Try vc_row
          if (newContent === doc.wpRawContent) {
             const regex2 = /\[vc_row(?:\]|\s[^\]]*\])(?:(?!\[\/?vc_row(?:\]|\s))[^])*?Stay Connected(?:(?!\[\/?vc_row(?:\]|\s))[^])*?\[\/vc_row\]/ig;
             newContent = newContent.replace(regex2, "");
          }

          // 3. Try vc_column
          if (newContent === doc.wpRawContent) {
             const regex3 = /\[vc_column(?:\]|\s[^\]]*\])(?:(?!\[\/?vc_column(?:\]|\s))[^])*?Stay Connected(?:(?!\[\/?vc_column(?:\]|\s))[^])*?\[\/vc_column\]/ig;
             newContent = newContent.replace(regex3, "");
          }

          if (newContent !== doc.wpRawContent) {
            await payload.update({
              collection,
              id: doc.id,
              data: {
                wpRawContent: newContent
              }
            });
            console.log(`Updated ${collection} ID: ${doc.id} (slug: ${doc.slug})`);
            totalUpdated++;
            updatedInBatch++;
          } else {
            console.log(`Failed to replace in ${collection} ID: ${doc.id} (slug: ${doc.slug})`);
          }
        }
      }

      if (updatedInBatch === 0) {
          // If we didn't update any in this batch, we will loop infinitely unless we break
          console.log(`Failed to update any documents in batch for ${collection}. Breaking to avoid infinite loop.`);
          break;
      }
    }
  }

  console.log(`Total documents updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch(console.error);
