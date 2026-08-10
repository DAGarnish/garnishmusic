import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 1000,
  });
  
  let paddingMatches: Record<string, number> = {};
  
  for (const page of pages.docs) {
    if (page.wpRawContent && typeof page.wpRawContent === 'string') {
      const matches = page.wpRawContent.match(/padding(?:-(?:top|bottom|left|right))?:\s*\d+px/g);
      if (matches) {
        for (const match of matches) {
          paddingMatches[match] = (paddingMatches[match] || 0) + 1;
        }
      }
    }
  }

  console.log("Padding occurrences:", Object.entries(paddingMatches).sort((a, b) => b[1] - a[1]).slice(0, 20));
  process.exit(0);
}

main().catch(console.error);
