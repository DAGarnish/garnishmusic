import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");
  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: "private-instruction" } }] },
    limit: 1,
  });
  const doc: any = pages.docs[0];
  console.log(doc ? { title: doc.title, len: doc.wpRawContent?.length } : "NOT FOUND");
  console.log(doc?.wpRawContent || "");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
