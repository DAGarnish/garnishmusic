import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  // Find all pages
  const collections = ["pages"];
  let totalFound = 0;
  
  for (const collection of collections) {
    let hasMore = true;
    let page = 1;
    while (hasMore) {
      const result = await payload.find({
        collection: collection as any,
        limit: 100,
        page: 1, // always query page 1 since we're modifying and docs might drop out of match if we only queried where it contains it, but wait, we are NOT querying by 'contains' here, we're iterating all.
        // Actually, let's query for documents that contain the text so we don't update everything
        where: {
          wpRawContent: {
            contains: "BA (Hons) Pathways"
          }
        }
      });
      
      if (result.docs.length === 0) {
        hasMore = false;
        break;
      }
      
      totalFound += result.docs.length;
      console.log(`Processing ${result.docs.length} docs in ${collection}`);
      
      for (const doc of result.docs) {
        let content = doc.wpRawContent;
        if (!content) continue;
        
        // Regex to match the vc_row containing "BA (Hons) Pathways"
        // We use [\s\S]*? to match across newlines lazily.
        const regex = /\[vc_row[^\]]*\](?:(?!\[\/?vc_row\])[\s\S])*?BA \(Hons\) Pathways(?:(?!\[\/?vc_row\])[\s\S])*?\[\/vc_row\]/gi;
        
        // Before replacing, let's just make sure we match it.
        const matches = content.match(regex);
        if (matches) {
           content = content.replace(regex, "");
           
           console.log(`Updating ${collection} ID: ${doc.id}`);
           await payload.update({
             collection: collection as any,
             id: doc.id,
             data: {
               wpRawContent: content
             }
           });
        } else {
           console.log(`Failed to match exact regex on ${collection} ID: ${doc.id}, it might be nested differently.`);
           // Let's try a fallback: just finding the [vc_row to [/vc_row] block
           const fallbackRegex = /\[vc_row[\s\S]*?BA \(Hons\) Pathways[\s\S]*?\[\/vc_row\]/gi;
           const fallbackMatches = content.match(fallbackRegex);
           if (fallbackMatches && fallbackMatches.length === 1) { // Only do fallback if there's exactly one match, to avoid swallowing the whole page
             content = content.replace(fallbackRegex, "");
             console.log(`Used fallback regex to update ${collection} ID: ${doc.id}`);
             await payload.update({
               collection: collection as any,
               id: doc.id,
               data: {
                 wpRawContent: content
               }
             });
           }
        }
      }
    }
  }

  console.log(`Total documents processed and updated: ${totalFound}`);
  process.exit(0);
}

main().catch(console.error);
