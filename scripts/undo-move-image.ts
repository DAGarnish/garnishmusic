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
  
  const imgRegex = new RegExp('<div style="text-align: center;"><img class="aligncenter size-large wp-image-26418"[\\\\s\\\\S]*?</div>\\\\r\\\\n&nbsp;\\\\r\\\\n');
  const match = content.match(imgRegex);
  
  if (!match) {
      console.log("Image not found");
      process.exit(1);
  }
  
  const imgStr = match[0];
  content = content.replace(imgStr, ""); // Remove from current position
  
  const originalTargetStr = "We teach using Pioneer DJ controllers and Rekordbox software.</p>\\r\\n&nbsp;\\r\\n";
  content = content.replace(originalTargetStr, originalTargetStr + imgStr);
  
  await payload.update({
      collection: "pages",
      id: page.id,
      data: {
          wpRawContent: content
      }
  });
  
  console.log("Successfully undid the image move (placed back before FAQ).");
  process.exit(0);
}

main().catch(console.error);
