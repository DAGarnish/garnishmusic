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
    where: { site: { equals: siteId } },
    limit: 100
  });
  
  for (const p of pages.docs) {
    console.log(`Page: ${p.slug} - ${p.title}`);
  }

  process.exit(0);
}

main().catch(console.error);
