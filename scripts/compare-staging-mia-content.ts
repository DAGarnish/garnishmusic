import { getPayload } from "payload";
import config from "../payload.config";

const collections = ["pages", "posts", "media", "hero-sliders", "testimonials", "categories", "tags", "products", "redirects"] as const;

async function main() {
  const payload = await getPayload({ config });
  for (const collection of collections) {
    const [mia, staging] = await Promise.all([
      payload.find({ collection: collection as any, where: { site: { equals: 17 } }, limit: 0, depth: 0 }),
      payload.find({ collection: collection as any, where: { site: { equals: 24 } }, limit: 0, depth: 0 }),
    ]);
    console.log(`${collection}: mia(17)=${mia.totalDocs} staging(24)=${staging.totalDocs}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
