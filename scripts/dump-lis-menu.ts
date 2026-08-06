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
    const site = siteRes.docs[0];
    console.log(JSON.stringify(site.mainMenu, null, 2));
  }
  process.exit(0);
}

main().catch(console.error);
