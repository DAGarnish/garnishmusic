import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const slug = process.argv[2];
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: 15 } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 0,
  });
  const doc = res.docs[0] as any;
  if (!doc) { console.log("NOT FOUND"); process.exit(0); }
  console.log(doc.wpRawContent);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
