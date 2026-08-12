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
  
  const imgStr = `<div style="text-align: center;"><img class="aligncenter size-large wp-image-26418" src="https://edu.garnishmusicproduction.com/wp-content/uploads/sites/8/2026/03/Screenshot-2026-03-19-at-10.34.17-827x1024.png" alt="Online DJ course with Dave Garnish" width="827" height="1024" /></div>\r\n&nbsp;\r\n`;
  content = content.replace(imgStr, "");  
  // Use actual newline characters, not literal backslashes
  const targetStr = "We teach using Pioneer DJ controllers and Rekordbox software.</p>\r\n&nbsp;\r\n";
  const targetStr2 = "If you want a course built around confidence, performance and real-world DJing rather than endless gear talk, this is for you.</p>\r\n&nbsp;\r\n";
  
  
  // Check if we want to move it to the new location or old location based on command line arg
  const dest = process.argv[2] === "new" ? targetStr2 : targetStr;
  
  if (content.includes(dest)) {
      content = content.replace(dest, dest + imgStr);
      await payload.update({
          collection: "pages",
          id: page.id,
          data: {
              wpRawContent: content
          }
      });
      console.log("Successfully placed the image.");
  } else {
      console.log("Could not find the target string.");
  }
  process.exit(0);
}

main().catch(console.error);
