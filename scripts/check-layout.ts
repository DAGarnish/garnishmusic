import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 10,
    where: { slug: { equals: "programs/ableton-producer-program" } }
  });
  
  for (const page of pages.docs) {
    console.log(`Page: ${page.id}, slug: ${page.slug}, layout length: ${page.layout ? page.layout.length : 0}`);
  }
  
  process.exit(0);
}

main().catch(console.error);
