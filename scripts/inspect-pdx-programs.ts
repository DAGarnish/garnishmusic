import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  for (const slug of ["academy", "ableton-producer", "logic-producer", "instructors"]) {
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: slug } }] },
      limit: 1,
      depth: 0,
    });
    const doc: any = pages.docs[0];
    console.log(`\n=== ${slug} ===`);
    if (!doc) { console.log("NOT FOUND"); continue; }
    console.log("title:", doc.title, "| status:", doc.status, "| wpRawContent length:", doc.wpRawContent?.length, "| has content field:", !!doc.content);
    console.log((doc.wpRawContent || "").slice(0, 1500));
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
