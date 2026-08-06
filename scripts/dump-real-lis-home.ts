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
  const site = siteRes.docs[0];
  
  let pages;
  if (site.homepageWpId) {
    pages = await payload.find({
      collection: "pages",
      where: {
        and: [{ site: { equals: site.id } }, { wpPostId: { equals: site.homepageWpId } }]
      },
      limit: 1
    });
  } else {
    pages = await payload.find({
      collection: "pages",
      where: {
        and: [{ site: { equals: site.id } }, { slug: { equals: "home" } }]
      },
      limit: 1
    });
  }
  
  if (pages.docs.length > 0) {
    console.log(pages.docs[0].wpRawContent);
  } else {
    console.log("No homepage found");
  }

  process.exit(0);
}

main().catch(console.error);
