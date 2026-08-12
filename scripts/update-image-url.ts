import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "pages",
    where: { slug: { equals: "reality-dj-class" } },
  });
  
  if (result.docs.length === 0) {
      console.log("Not found in pages");
      process.exit(1);
  }
  
  const page = result.docs[0];
  let content = page.wpRawContent as string;
  
  const oldUrl = "https://edu.garnishmusicproduction.com/wp-content/uploads/sites/8/2026/03/Screenshot-2026-03-19-at-10.34.17-827x1024.png";
  const newUrl = "/paris-tweets.png";
  
  if (content.includes(oldUrl)) {
      content = content.replace(oldUrl, newUrl);
      
      await payload.update({
          collection: "pages",
          id: page.id,
          data: {
              wpRawContent: content
          }
      });
      console.log("Successfully updated image URL.");
  } else {
      console.log("Old URL not found in content.");
  }
  process.exit(0);
}

main().catch(console.error);
