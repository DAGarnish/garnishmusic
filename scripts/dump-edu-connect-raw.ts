import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: 15 } }, { slug: { equals: "connect" } }] },
    limit: 1,
    depth: 0,
  });
  const doc = res.docs[0] as any;
  if (!doc) { console.log("NOT FOUND"); process.exit(0); }
  console.log("title:", doc.title);
  console.log("slug:", doc.slug);
  console.log("wpRawContent length:", (doc.wpRawContent || "").length);
  console.log("--- raw content ---");
  console.log(doc.wpRawContent);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
