import { getPayload } from "payload";
import configPromise from "../payload.config";
import { extractCourseSections, extractCoursePricing, extractCurriculumModules, extractCourseIntro } from "../lib/modern-course-content";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  for (const slug of ["courses/ableton-live", "courses/logic-pro", "courses/electronic-dj-course"]) {
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: slug } }] },
      limit: 1,
    });
    const doc: any = pages.docs[0];
    console.log(`\n\n========== ${slug} ==========`);
    if (!doc) { console.log("NOT FOUND"); continue; }
    const sections = extractCourseSections(doc.wpRawContent || "");
    for (const s of sections) {
      console.log(`\n--- ${s.heading} ---`);
      console.log(s.bodyHtml.slice(0, 500));
    }
    console.log("\nPRICING:", extractCoursePricing(doc.wpRawContent || ""));
    console.log("\nINTRO:", extractCourseIntro(doc.wpRawContent || ""));
    console.log("\nCURRICULUM:", JSON.stringify(extractCurriculumModules(doc.wpRawContent || ""), null, 2));
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
