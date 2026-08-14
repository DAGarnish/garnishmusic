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
  const payload = await getPayload({ config });
  
  const productsQuery = await payload.find({
      collection: "products",
      limit: 1000,
  });
  
  for (const product of productsQuery.docs) {
      if (product.wpRawContent && product.wpRawContent.includes("9 Classes in Manhattan")) {
          console.log(`FOUND in Product: ${product.slug}`);
          console.log(product.wpRawContent);
          process.exit(0);
      }
  }

  const pagesQuery = await payload.find({
      collection: "pages",
      limit: 1000,
  });

  for (const page of pagesQuery.docs) {
      if (page.wpRawContent && page.wpRawContent.includes("9 Classes in Manhattan")) {
          console.log(`FOUND in Page: ${page.slug}`);
          console.log(page.wpRawContent);
          process.exit(0);
      }
  }

  console.log("Not found anywhere in products or pages wpRawContent");
  process.exit(0);
}

main().catch(console.error);
