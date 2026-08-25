import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: "contact-map" } }] },
    limit: 1,
    depth: 0,
  });
  const doc: any = pages.docs[0];
  console.log("=== FIELDS PRESENT ===");
  console.log(Object.keys(doc || {}));
  console.log("=== title/status/showTitleArea ===", doc?.title, doc?.status, doc?.showTitleArea);
  console.log("=== has content? ===", !!doc?.content);
  console.log("=== has wpRawContent? length ===", doc?.wpRawContent?.length);
  console.log("=== wpRawContent (first 4000 chars) ===");
  console.log((doc?.wpRawContent || "").slice(0, 4000));
  console.log("=== content field (if any, first 3000 chars) ===");
  console.log(JSON.stringify(doc?.content, null, 2)?.slice(0, 3000));

  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
