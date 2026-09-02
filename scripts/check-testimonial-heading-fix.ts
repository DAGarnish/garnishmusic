import { getPayload } from "payload";
import config from "../payload.config";
import { extractHomepageOfferings, extractTestimonialCategorySlugs, isStudentsSayHeading } from "../lib/modern-course-content";

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  for (const site of sites.docs as any[]) {
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: 5271 } }] },
      limit: 1,
      depth: 0,
    });
    const home = pages.docs[0] as any;
    if (!home?.wpRawContent) continue;
    const offerings = extractHomepageOfferings(home.wpRawContent);
    const matchingHeadings = offerings.filter((g) => isStudentsSayHeading(g.groupHeading)).map((g) => g.groupHeading);
    const slugs = extractTestimonialCategorySlugs(home.wpRawContent);
    if (matchingHeadings.length > 0 || slugs.length > 0) {
      console.log(`site ${site.id} (${site.slug}): matching headings=${JSON.stringify(matchingHeadings)} slugs=${JSON.stringify(slugs)}`);
    }
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
