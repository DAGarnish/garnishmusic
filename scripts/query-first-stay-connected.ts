import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";

async function main() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "pages",
    where: { wpRawContent: { contains: "Stay Connected" } },
    limit: 1
  });
  if (result.docs.length > 0) {
    const page = result.docs[0];
    if (page.wpRawContent && typeof page.wpRawContent === 'string') {
        const match = page.wpRawContent.toLowerCase().indexOf("stay connected");
        if (match !== -1) {
            console.log(`Found in page ID: ${page.id}`);
            console.log(page.wpRawContent.substring(match - 300, match + 500));
        }
    }
  }
  process.exit(0);
}
main().catch(console.error);
