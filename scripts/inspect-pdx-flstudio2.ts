import { getPayload } from "payload";
import configPromise from "../payload.config";
import { extractCourseSections } from "../lib/modern-course-content";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");
  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: "courses/fl-studio" } }] },
    limit: 1,
  });
  const doc: any = pages.docs[0];
  const raw: string = doc?.wpRawContent || "";
  const sections = extractCourseSections(raw, 20);
  for (const s of sections) {
    console.log(`\n--- ${s.heading} ---`);
    console.log(s.bodyHtml.slice(0, 200));
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
