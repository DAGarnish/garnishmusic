import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 10,
    where: {
      wpRawContent: { like: "%World-class Music Production Courses in London%" }
    }
  });
  
  for (const page of pages.docs) {
    console.log(`Found page: ${page.slug} (ID: ${page.id})`);
    if (page.wpRawContent && typeof page.wpRawContent === 'string') {
        const start = page.wpRawContent.indexOf("World-class Music Production Courses in London");
        const snippet = page.wpRawContent.substring(Math.max(0, start - 200), start + 400);
        console.log(snippet);
    }
  }

  process.exit(0);
}

main().catch(console.error);
