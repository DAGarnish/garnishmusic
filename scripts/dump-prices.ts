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
  
  const pages = await payload.find({
    collection: "pages",
    limit: 10,
    where: {
      wpRawContent: {
        contains: "Registration if booked"
      }
    }
  });
  
  for (const page of pages.docs) {
    const content = page.wpRawContent as string;
    const startIndex = content.indexOf("USA:");
    if (startIndex !== -1) {
      console.log(`${page.slug} -> \n${content.substring(startIndex, startIndex + 300)}\n`);
    } else {
        const altIndex = content.indexOf("UK:");
        if (altIndex !== -1) {
            console.log(`${page.slug} -> \n${content.substring(altIndex, altIndex + 300)}\n`);
        }
    }
  }

  process.exit(0);
}

main().catch(console.error);
