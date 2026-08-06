import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "pages",
    where: { id: { equals: 769 } },
  });
  if (result.docs.length > 0) {
    const page = result.docs[0];
    if (page.wpRawContent && typeof page.wpRawContent === 'string') {
        const regex1 = /\[vc_row_inner[^\]]*\](?:(?!\[\/?vc_row_inner)[^])*?Stay Connected(?:(?!\[\/?vc_row_inner)[^])*?\[\/vc_row_inner\]/ig;
        const new1 = page.wpRawContent.replace(regex1, "");
        if (new1 !== page.wpRawContent) {
            console.log("Replaced successfully with regex1!");
        } else {
            console.log("regex1 did NOT replace anything!");
            
            // Try to figure out why
            const match = page.wpRawContent.match(regex1);
            console.log("Matches:", match);
        }
    }
  }
  process.exit(0);
}
main().catch(console.error);
