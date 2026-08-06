import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";

async function main() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "pages",
    where: { id: { equals: 327 } },
  });
  if (result.docs.length > 0) {
    const page = result.docs[0];
    if (page.wpRawContent && typeof page.wpRawContent === 'string') {
        fs.writeFileSync("page-327.txt", page.wpRawContent);
        console.log("Wrote page-327.txt");
    }
  }
  process.exit(0);
}
main().catch(console.error);
