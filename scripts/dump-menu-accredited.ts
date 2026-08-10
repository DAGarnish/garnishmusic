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
  
  console.log(`Found ${sites.docs.length} sites`);
  
  for (const site of sites.docs) {
    if (site.mainMenu) {
      const str = JSON.stringify(site.mainMenu, null, 2);
      if (str.toLowerCase().includes("accredited")) {
        console.log(`Found 'accredited' in menu for site ${site.name} (${site.slug}) - ID: ${site.id}`);
        fs.writeFileSync(`menu-${site.slug}.json`, str);
        console.log(`Saved to menu-${site.slug}.json`);
      }
    }
  }

  process.exit(0);
}

main().catch(console.error);
