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
  
  const siteQuery = await payload.find({
      collection: "sites",
      where: {
          slug: {
              equals: "sf"
          }
      }
  });
  
  const doc = siteQuery.docs[0];
  console.log("Keys:", Object.keys(doc));
  if (doc.footerPrograms) console.log('footerPrograms:', JSON.stringify(doc.footerPrograms, null, 2));
  if (doc.footerLinks) console.log('footerLinks:', JSON.stringify(doc.footerLinks, null, 2));
  if (doc.footerAbout) console.log('footerAbout:', JSON.stringify(doc.footerAbout, null, 2));
  
  process.exit(0);
}

main().catch(console.error);
