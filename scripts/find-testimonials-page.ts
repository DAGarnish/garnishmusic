import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 100,
    where: { wpRawContent: { like: "Featured Audio Engineering School Testimonials" } }
  });
  
  if (pages.docs.length > 0) {
    const page = pages.docs[0];
    console.log(`Found on page: ${page.slug} (site: ${page.site})`);
    console.log("---- CONTENT ----");
    console.log(page.wpRawContent);
  } else {
    console.log("Not found in pages");
  }

  process.exit(0);
}

main().catch(console.error);
