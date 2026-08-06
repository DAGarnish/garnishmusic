import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 10,
    where: {
      wpRawContent: {
        contains: "BA (Hons) Pathways"
      }
    }
  });

  console.log(`Found ${pages.totalDocs} pages with 'BA (Hons) Pathways' in raw content`);
  
  if (pages.docs.length > 0) {
    const doc = pages.docs[0];
    console.log(`Looking at page ID: ${doc.id}, Title: ${doc.title}, Slug: ${doc.slug}`);
    
    // Find the block in wpRawContent
    const raw = doc.wpRawContent;
    const regex = /\[vc_row.*?BA \(Hons\) Pathways.*?\[\/vc_row\]/gs;
    const matches = raw.match(regex);
    if (matches) {
      console.log("MATCHED ROW BLOCK:");
      console.log(matches[0]);
    } else {
      console.log("Could not match full vc_row. Here is a snippet of raw content:");
      const index = raw.indexOf("BA (Hons) Pathways");
      console.log(raw.substring(Math.max(0, index - 200), index + 500));
    }
  }

  process.exit(0);
}

main().catch(console.error);
