import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  for (const slug of ["courses/dave-garnish", "courses/loren-moore", "courses/appu-krishnan", "courses/zack-johnson"]) {
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: slug } }] },
      limit: 1,
    });
    const doc: any = pages.docs[0];
    console.log(`\n=== ${slug} (${doc.title}) ===`);
    console.log("excerpt:", doc.excerpt);
    console.log("wpRawContent:", doc.wpRawContent);
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
