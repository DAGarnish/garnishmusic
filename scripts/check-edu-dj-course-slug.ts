import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const slugs = ["electronic-dj-course", "courses/electronic-dj-course", "courses/dj-course", "courses/rekordbox"];
  for (const slug of slugs) {
    const res = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: 15 } }, { slug: { equals: slug } }] },
      limit: 1,
      depth: 0,
    });
    console.log(slug, "->", res.docs[0] ? `FOUND "${(res.docs[0] as any).title}"` : "NOT FOUND");
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
