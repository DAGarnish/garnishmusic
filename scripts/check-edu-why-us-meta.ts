import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: 15 } }, { slug: { equals: "why-us" } }] },
    limit: 1,
    depth: 1,
  });
  const doc = res.docs[0] as any;
  console.log("title:", doc.title);
  console.log("seo:", JSON.stringify(doc.seo));
  console.log("featuredImage:", typeof doc.featuredImage === "object" ? doc.featuredImage?.url : doc.featuredImage);
  console.log("titleBackgroundImage:", typeof doc.titleBackgroundImage === "object" ? doc.titleBackgroundImage?.url : doc.titleBackgroundImage);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
