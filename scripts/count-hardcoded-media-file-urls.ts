import { getPayload } from "payload";
import config from "../payload.config";

const RE = /\/api\/media\/file\/[^\s"'\)]+/g;

async function countCollection(payload: any, collection: string, field: string) {
  let page = 1;
  let docs = 0;
  let urls = 0;
  for (;;) {
    const res = await payload.find({ collection, limit: 500, page, depth: 0 });
    for (const doc of res.docs as any[]) {
      const raw = doc[field] as string | undefined;
      if (!raw) continue;
      const matches = raw.match(RE);
      if (matches && matches.length > 0) {
        docs++;
        urls += matches.length;
      }
    }
    if (!res.hasNextPage) break;
    page++;
  }
  return { docs, urls };
}

async function main() {
  const payload = await getPayload({ config });
  const pages = await countCollection(payload, "pages", "wpRawContent");
  console.log("pages:", pages);
  const products = await countCollection(payload, "products", "wpRawContent");
  console.log("products:", products);
  const posts = await countCollection(payload, "posts", "wpRawContent" as any).catch(() => null);
  console.log("posts:", posts);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
