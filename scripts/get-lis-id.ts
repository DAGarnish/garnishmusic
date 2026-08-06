import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const siteRes = await payload.find({
    collection: "sites",
    where: { slug: { equals: "lis" } },
    limit: 1
  });
  
  if (siteRes.docs.length > 0) {
    console.log(`lis site ID is: ${siteRes.docs[0].id}`);
  }
  
  process.exit(0);
}

main().catch(console.error);
