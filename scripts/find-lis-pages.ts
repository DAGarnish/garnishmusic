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
    console.log("lis site not found");
    process.exit(0);
  }
  
  const siteId = siteRes.docs[0].id;
  
  const pages = await payload.find({
    collection: "pages",
    where: { 
      and: [
        { site: { equals: siteId } },
        { title: { like: "Ableton" } }
      ]
    }
  });
  
  const pagesRP = await payload.find({
    collection: "pages",
    where: { 
      and: [
        { site: { equals: siteId } },
        { title: { like: "Release Party" } }
      ]
    }
  });

  console.log("Ableton pages:");
  pages.docs.forEach(p => console.log(` - ID: ${p.id}, Slug: ${p.slug}, Title: ${p.title}`));
  
  console.log("Release Party pages:");
  pagesRP.docs.forEach(p => console.log(` - ID: ${p.id}, Slug: ${p.slug}, Title: ${p.title}`));

  process.exit(0);
}

main().catch(console.error);
