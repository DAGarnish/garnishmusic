import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "media",
    where: { filename: { equals: "compare-graphic-cream.png" } },
    limit: 5,
    depth: 0,
  });
  for (const doc of res.docs as any[]) {
    console.log(JSON.stringify({
      id: doc.id, filename: doc.filename, width: doc.width, height: doc.height,
      url: doc.url,
      sizes: Object.fromEntries(Object.entries(doc.sizes || {}).map(([k, v]: any) => [k, { url: v.url, width: v.width, height: v.height }])),
    }, null, 2));
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
