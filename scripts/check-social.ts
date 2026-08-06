import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100,
  });

  console.log("Checking sites for social links...");
  for (const site of sites.docs) {
    // Just dump keys to see if there's anything related
    const keys = Object.keys(site).filter(k => k.toLowerCase().includes("social") || k.toLowerCase().includes("facebook") || k.toLowerCase().includes("instagram"));
    if (keys.length > 0) {
      console.log(`Site ${site.slug} has keys: ${keys.join(", ")}`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
