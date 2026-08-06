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
        break;
      }

      for (const doc of result.docs) {
        if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
          // The regex looks for [vc_row...], followed by any character that does NOT start [vc_row or [/vc_row, 
          // containing "Stay Connected" (case-insensitive), and ending with [/vc_row]
          const regex = /\[vc_row(?:\]|\s[^\]]*\])(?:(?!\[\/?vc_row(?:\]|\s))[^])*?Stay Connected(?:(?!\[\/?vc_row(?:\]|\s))[^])*?\[\/vc_row\]/ig;
          
          let newContent = doc.wpRawContent.replace(regex, "");
          
          // Also try a raw vc_column in case it's not wrapped in a row nicely or something
          if (newContent === doc.wpRawContent) {
             const fallbackRegex = /\[vc_column(?:\]|\s[^\]]*\])(?:(?!\[\/?vc_column(?:\]|\s))[^])*?Stay Connected(?:(?!\[\/?vc_column(?:\]|\s))[^])*?\[\/vc_column\]/ig;
             newContent = newContent.replace(fallbackRegex, "");
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
          } else {
             console.log(`Failed AGAIN to replace in ${collection} ID: ${doc.id} (slug: ${doc.slug})`);
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
