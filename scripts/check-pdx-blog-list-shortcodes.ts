import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  const slugs = [
    "courses/ableton-live", "courses/fl-studio", "courses/logic-pro", "courses/pro-tools",
    "courses/mixing-mastering", "courses/mastering", "courses/songwriting-course",
    "courses/vocal-production", "courses/composition", "courses/rhythm-section-programming",
    "courses/electronic-sound-art", "courses/rekordbox", "courses/electronic-dj-course",
    "courses/ableton-live-djs", "courses/summer-camp-school",
    "academy", "ableton-producer", "logic-producer", "private-instruction",
  ];

  for (const slug of slugs) {
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: slug } }] },
      limit: 1,
    });
    const doc: any = pages.docs[0];
    const raw: string = doc?.wpRawContent || "";
    const matches = [...raw.matchAll(/\[mkd_blog_list[^\]]*\]/gi)];
    console.log(slug, "->", matches.map((m) => m[0]));
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
