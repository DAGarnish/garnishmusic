import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({ collection: "media", limit: 3, depth: 0 });
  for (const doc of res.docs as any[]) {
    console.log(`id=${doc.id} filename=${doc.filename}`);
    console.log(`  url: ${doc.url}`);
    for (const [name, size] of Object.entries(doc.sizes || {})) {
      console.log(`  sizes.${name}.url: ${(size as any).url}`);
    }
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
