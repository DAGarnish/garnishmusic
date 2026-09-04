import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "redirects",
    where: { and: [{ site: { equals: 22 } }, { source: { equals: "/music-production-school-los-angeles-contact" } }] },
    limit: 5,
    depth: 0,
  });
  console.log("matches:", res.totalDocs);
  for (const d of res.docs as any[]) {
    console.log(JSON.stringify(d, null, 2));
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
