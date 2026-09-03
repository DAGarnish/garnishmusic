import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "edu" } }, limit: 1 });
  const site = sites.docs[0] as any;
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: site.homepageWpId } }] },
    limit: 1,
    depth: 1,
  });
  const doc = res.docs[0] as any;
  console.log("title:", doc?.title);
  console.log("featuredImage:", typeof doc?.featuredImage === "object" ? doc?.featuredImage?.url : doc?.featuredImage);
  console.log("titleBackgroundImage:", typeof doc?.titleBackgroundImage === "object" ? doc?.titleBackgroundImage?.url : doc?.titleBackgroundImage);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
