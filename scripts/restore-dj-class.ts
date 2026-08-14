import { getPayload } from "payload";
import config from "../payload.config";

import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

async function main() {
  const logPath = "/Users/garnish/.gemini/antigravity-ide/brain/2594fbeb-40dd-4cf8-b0a2-5755610d6601/.system_generated/tasks/task-84.log";
  const logContent = fs.readFileSync(logPath, "utf8");
  
  const marker = "FOUND in Product: product/electronic-dj-class\n";
  const markerIndex = logContent.indexOf(marker);
  
  if (markerIndex === -1) {
      console.error("Marker not found in log file");
      process.exit(1);
  }
  
  let rawHtml = logContent.substring(markerIndex + marker.length);
  // Remove trailing newlines to match exact previous content (it had one newline at end in the string usually if logged by console.log, wait console.log adds a newline. We should trim the last newline).
  if (rawHtml.endsWith('\n')) {
      rawHtml = rawHtml.slice(0, -1);
  }
  
  const payload = await getPayload({ config });
  
  const productsQuery = await payload.find({
      collection: "products",
      where: {
          slug: { equals: "product/electronic-dj-class" }
      },
  });
  
  const product = productsQuery.docs[0];
  if (!product) {
      console.error("Product not found");
      process.exit(1);
  }
  
  await payload.update({
      collection: "products",
      id: product.id,
      data: {
          wpRawContent: rawHtml
      }
  });
  
  console.log("Restored product successfully!");
  process.exit(0);
}

main().catch(console.error);
