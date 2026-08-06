import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 1
  });

  if (sites.docs.length > 0) {
    console.log(JSON.stringify(sites.docs[0].mainMenu, null, 2));
  }
  
  process.exit(0);
}

main().catch(console.error);
