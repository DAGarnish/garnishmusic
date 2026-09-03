import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const slugs = ["academy", "programs/ableton-producer", "programs/logic-producer", "ableton-producer", "logic-producer"];
  for (const slug of slugs) {
    const res = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: 15 } }, { slug: { equals: slug } }] },
      limit: 1,
      depth: 0,
    });
    const doc = res.docs[0] as any;
    console.log(slug, "->", doc ? `FOUND id=${doc.id} title="${doc.title}" wpRawContentLen=${(doc.wpRawContent||"").length}` : "NOT FOUND");
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
