import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "pages",
    where: { id: { equals: 327 } },
  });
  if (result.docs.length > 0) {
    const page = result.docs[0];
    if (page.wpRawContent && typeof page.wpRawContent === 'string') {
        const match = page.wpRawContent.toLowerCase().indexOf("stay connected");
        if (match !== -1) {
            console.log(page.wpRawContent.substring(match - 150, match + 400));
        }
    }
  }
  process.exit(0);
}
main().catch(console.error);
