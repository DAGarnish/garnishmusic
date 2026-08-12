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
  const result = await payload.find({
    collection: "pages",
    where: { slug: { equals: "reality-dj-class" } },
  });
  if (result.docs.length > 0) {
    const page = result.docs[0];
    fs.writeFileSync("reality-dj-class.json", JSON.stringify(page, null, 2));
    console.log("Wrote reality-dj-class.json");
  } else {
    console.log("Not found in pages, trying products");
    const result2 = await payload.find({
      collection: "products",
      where: { slug: { equals: "reality-dj-class" } },
    });
    if (result2.docs.length > 0) {
      const product = result2.docs[0];
      fs.writeFileSync("reality-dj-class.json", JSON.stringify(product, null, 2));
      console.log("Wrote reality-dj-class.json from products");
    }
  }
  process.exit(0);
}
main().catch(console.error);
