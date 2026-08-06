import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const siteRes = await payload.find({
    collection: "sites",
    where: { slug: { equals: "lis" } },
    limit: 1
  });
  
  if (siteRes.docs.length === 0) {
    process.exit(0);
  }
  const siteId = siteRes.docs[0].id;
  
  const pages = await payload.find({
    collection: "pages",
    where: {
      and: [
        { site: { equals: siteId } },
        { title: { like: "Home" } }
      ]
    },
    limit: 1
  });
  
  if (pages.docs.length > 0) {
    console.log(pages.docs[0].wpRawContent);
  }

  process.exit(0);
}

main().catch(console.error);
