import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 100,
  });

  for (const page of pages.docs) {
    if (page.wpRawContent && typeof page.wpRawContent === 'string' && page.wpRawContent.includes("Getting Started")) {
      console.log(`Found in page: ${page.slug}`);
      const content = page.wpRawContent;
      const index = content.indexOf("Getting Started");
      console.log(content.substring(Math.max(0, index - 200), index + 500));
    }
  }

  process.exit(0);
}

main().catch(console.error);
