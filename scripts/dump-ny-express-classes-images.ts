import { getPayload } from "payload";
import config from "../payload.config";

const NY_SITE_ID = 14;
const slugs = [
  "courses/ableton",
  "courses/ableton-live-djs",
  "courses/logic-pro",
  "courses/pro-tools",
  "courses/fl-studio",
  "courses/mixing-mastering",
  "courses/mastering",
  "courses/sound-design-synthesis",
  "courses/songwriting-course",
  "courses/maschine",
  "courses/composition",
  "courses/electronic-sound-art",
  "courses/hip-hop-production-course",
  "courses/rhythm-section-programming",
  "courses/vocal-production",
  "private-instruction",
  "courses/summer-camp-school",
  "courses/rekordbox",
  "courses/mixing-sound-design-film-tv",
  "courses/k-pop-hit-songwriting-class",
  "contact-map",
  "brooklyn",
];

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: NY_SITE_ID } }, { slug: { in: slugs } }] },
    limit: 30,
    depth: 1,
  });
  for (const p of res.docs as any[]) {
    const img = typeof p.featuredImage === "object" ? p.featuredImage?.url : p.featuredImage;
    const titleBg = typeof p.titleBackgroundImage === "object" ? p.titleBackgroundImage?.url : undefined;
    console.log(`- slug=${p.slug} title="${p.title}" featuredImage=${img} titleBg=${titleBg}`);
  }
  const found = new Set((res.docs as any[]).map((p) => p.slug));
  console.log("missing:", slugs.filter((s) => !found.has(s)));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
