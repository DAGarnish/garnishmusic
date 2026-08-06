import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });

  for (const site of sites.docs) {
    if (site.mainMenu && Array.isArray(site.mainMenu)) {
      for (const item of site.mainMenu) {
        if (JSON.stringify(item).includes("Online Community")) {
          console.log(JSON.stringify(item, null, 2));
          break; // just need to see the shape once
        }
      }
      break;
    }
  }

  process.exit(0);
}

main().catch(console.error);
