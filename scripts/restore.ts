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
  let rawHtml = fs.readFileSync(path.resolve("original_content.txt"), "utf8");
  // Remove the trailing newline if any, to be exact
  if (rawHtml.endsWith("\n\n")) {
      rawHtml = rawHtml.slice(0, -2);
  } else if (rawHtml.endsWith('\n')) {
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
