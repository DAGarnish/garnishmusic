import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const collections = ["pages", "products", "posts"] as const;
  
  let totalFound = 0;

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
      totalFound += result.docs.length;
      hasNextPage = result.hasNextPage;
      page++;
    }
  }

  console.log(`Total documents STILL containing "Stay Connected": ${totalFound}`);
  process.exit(0);
}
main().catch(console.error);
