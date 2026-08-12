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
  
  const targetStr = "We teach using Pioneer DJ controllers and Rekordbox software.</p>\\r\\n&nbsp;\\r\\n";
  
  const imgStr = `<div style="text-align: center;"><img class="aligncenter size-large wp-image-26418" src="https://edu.garnishmusicproduction.com/wp-content/uploads/sites/8/2026/03/Screenshot-2026-03-19-at-10.34.17-827x1024.png" alt="Online DJ course with Dave Garnish" width="827" height="1024" /></div>\\r\\n&nbsp;\\r\\n`;
  
  content = content.replace(targetStr, targetStr + imgStr);
  
  await payload.update({
      collection: "pages",
      id: page.id,
      data: {
          wpRawContent: content
      }
  });
  
  console.log("Successfully restored the image.");
  process.exit(0);
}

main().catch(console.error);
