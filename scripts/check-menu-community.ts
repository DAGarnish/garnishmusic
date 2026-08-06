import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });

  let found = false;
  for (const site of sites.docs) {
    if (site.mainMenu && Array.isArray(site.mainMenu)) {
      // Very basic stringification check
      const menuStr = JSON.stringify(site.mainMenu);
      if (menuStr.includes("Online Community")) {
        console.log(`Found in site ${site.title} (ID: ${site.id})`);
        found = true;
      }
    }
  }

  if (!found) {
    console.log("Not found in db.");
  }
  process.exit(0);
}

main().catch(console.error);
