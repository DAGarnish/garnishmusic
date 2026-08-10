import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 1000,
    where: {
      wpRawContent: {
        contains: "BA (Hons) Pathway"
      }
    }
  });
  
  console.log(`Found ${pages.docs.length} pages with 'BA (Hons) Pathway'`);
  for (const p of pages.docs) {
    const site = typeof p.site === 'object' ? p.site?.slug : p.site;
    console.log(` - ID: ${p.id}, Title: ${p.title}, Site: ${site}, Slug: ${p.slug}`);
  }
  process.exit(0);
}
run();
