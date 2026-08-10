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
    limit: 10,
    where: {
      slug: {
        equals: "courses/mastering"
      }
    }
  });
  
  if (result.docs.length === 0) {
      // maybe just "mastering"?
      const altResult = await payload.find({
          collection: "pages",
          limit: 10,
          where: {
              slug: { equals: "mastering" }
          }
      });
      for (const doc of altResult.docs) {
          fs.writeFileSync(`mastering-${doc.id}.txt`, doc.wpRawContent as string);
          console.log(`Saved mastering-${doc.id}.txt`);
      }
  } else {
      for (const doc of result.docs) {
          fs.writeFileSync(`mastering-${doc.id}.txt`, doc.wpRawContent as string);
          console.log(`Saved courses-mastering-${doc.id}.txt`);
      }
  }

  process.exit(0);
}

main().catch(console.error);
