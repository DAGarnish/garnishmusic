import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const slugs = ["private-instruction", "electronic-dj-course", "reality-dj-class"];
  for (const slug of slugs) {
    const res = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: 15 } }, { slug: { equals: slug } }] },
      limit: 1,
      depth: 0,
    });
    const doc = res.docs[0] as any;
    if (!doc) { console.log(slug, "-> NOT FOUND"); continue; }
    console.log(`\n=== ${slug} (id=${doc.id}, title="${doc.title}") ===`);
    console.log((doc.wpRawContent || "").slice(0, 1500));
    console.log("... [total length:", (doc.wpRawContent||"").length, "]");
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
