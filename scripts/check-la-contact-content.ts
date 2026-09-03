import { getPayload } from "payload";
import config from "../payload.config";
import { extractContactDetails } from "../lib/modern-contact-content";

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: 22 } }, { slug: { equals: "music-production-school-los-angeles-contact" } }] },
    limit: 1,
    depth: 0,
  });
  const doc = res.docs[0] as any;
  console.log("found page:", !!doc, doc?.title);
  const details = extractContactDetails(doc?.wpRawContent || "");
  console.log(JSON.stringify(details, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
