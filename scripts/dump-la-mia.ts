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
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });
  
  for (const site of sites.docs) {
    if (site.slug === "la" || site.slug === "mia") {
      if (site.mainMenu) {
        fs.writeFileSync(`menu-${site.slug}-full.json`, JSON.stringify(site.mainMenu, null, 2));
      }
    }
  }

  process.exit(0);
}

main().catch(console.error);
