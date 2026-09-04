import { getPayload } from "payload";
import config from "../payload.config";

const NY_SITE_ID = 14;

async function main() {
  const payload = await getPayload({ config });

  console.log("=== hero-sliders ===");
  const sliders = await payload.find({
    collection: "hero-sliders" as any,
    where: { and: [{ site: { equals: NY_SITE_ID } }, { alias: { equals: "main-home" } }] },
    limit: 1,
    depth: 1,
  }).catch((e) => ({ docs: [], error: String(e) }));
  console.log(JSON.stringify(sliders, null, 2).slice(0, 3000));

  console.log("\n=== testimonials ===");
  const testimonials = await payload.find({
    collection: "testimonials",
    where: { site: { equals: NY_SITE_ID } },
    limit: 50,
    depth: 1,
  });
  for (const t of testimonials.docs as any[]) {
    console.log(`- author=${t.author} categories=${JSON.stringify((t.categories||[]).map((c:any)=>typeof c==='object'?c.slug:c))}`);
    console.log(`  text=${t.text}`);
  }

  console.log("\n=== course pages (slugs from nav) ===");
  const slugs = [
    "courses/singing-lessons-vocal-coaching",
    "courses/rhythm-section-programming",
    "courses/vocal-production",
    "courses/sound-design-synthesis-ableton",
    "courses/hip-hop-production-course",
    "courses/summer-camp-school",
    "courses/songwriting-course",
    "courses/underground-dj-course",
    "courses/electronic-dj-course",
    "courses/mixing-mastering",
    "courses/logic-pro",
    "courses/ableton",
  ];
  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: NY_SITE_ID } }, { slug: { in: slugs } }] },
    limit: 20,
    depth: 1,
  });
  for (const p of pages.docs as any[]) {
    const img = typeof p.featuredImage === "object" ? p.featuredImage?.url : p.featuredImage;
    console.log(`- slug=${p.slug} title="${p.title}" featuredImage=${img}`);
  }

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
