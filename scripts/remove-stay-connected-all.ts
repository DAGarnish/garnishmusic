import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const collections = ["pages", "products", "posts"] as const;
  
  let totalUpdated = 0;

  for (const collection of collections) {
    let hasNextPage = true;
    let page = 1;

    while (hasNextPage) {
      let result;
      try {
        result = await payload.find({
          collection,
          where: { wpRawContent: { contains: "Stay Connected" } },
          limit: 100,
          page,
          depth: 0
        });
      } catch (e) {
        // Some collections like posts might not have wpRawContent or something, 
        // though our schema implies it should. If it fails, break this collection.
        console.log(`Skipping collection ${collection} due to error.`);
        break;
      }

      for (const doc of result.docs) {
        if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
          // The regex looks for [vc_row_inner...], followed by any character that does NOT start [vc_row_inner or [/vc_row_inner, 
          // containing "Stay Connected" (case-insensitive), and ending with [/vc_row_inner]
          const regex = /\[vc_row_inner[^\]]*\](?:(?!\[\/?vc_row_inner)[^])*?Stay Connected(?:(?!\[\/?vc_row_inner)[^])*?\[\/vc_row_inner\]/ig;
          
          let newContent = doc.wpRawContent.replace(regex, "");
          
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
          } else {
             // In case there's a "Stay connected" not wrapped in [vc_row_inner], we log it.
             console.log(`Failed to replace in ${collection} ID: ${doc.id} (slug: ${doc.slug}) - may not be in vc_row_inner`);
          }
        }
      }

      hasNextPage = result.hasNextPage;
      page++;
    }
  }

  console.log(`Total documents updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch(console.error);
