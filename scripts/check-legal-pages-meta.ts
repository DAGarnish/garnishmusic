import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  for (const slug of ["tc", "privacy-policy"]) {
    const res = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: 15 } }, { slug: { equals: slug } }] },
      limit: 1,
      depth: 0,
    });
    const doc = res.docs[0] as any;
    console.log(slug, "-> title:", doc?.title, "| id:", doc?.id);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
