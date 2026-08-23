import { getPayload } from "payload";
import config from "../payload.config";

// Rolls out the "Next 👇🏽 Class" cohort-banner override (already live on
// ny's product/electronic-dj-class - see add-dj-class-cohort-dates.ts /
// NextCohortBanner.tsx) to every MIA course-schedule product, replacing the
// site default "Next Cohorts 👇 Now Enrolling" banner with the same
// animated, tanned-finger label everywhere on MIA. Tags every cohort row
// (not just whichever is "next" today) with the same
// data-cohort-banner-html override, so whichever row ends up next still
// shows it as start dates pass - matching the DJ page's approach.
// The inner class="..." must be HTML-entity-escaped (&quot;) rather than a
// literal " - a literal nested quote is valid inside this JS string but
// invalid HTML: the browser's attribute parser treats it as the value's
// closing quote and leaks the remainder as visible text.
const BANNER_HTML = 'Next <span class=&quot;next-class-arrow&quot;>👇🏽</span> Class';

const PRODUCTS: { id: number; label: string }[] = [
  { id: 77, label: "product/ableton-production" },
  { id: 70, label: "product/electronic-music-dj-course" },
  { id: 67, label: "product/logic-course" },
  { id: 65, label: "product/summer-camp" },
  { id: 75, label: "product/ableton-producer-program" },
  { id: 76, label: "product/logic-producer-program" },
  { id: 69, label: "product/curso-de-dj-pro-en-espanol" },
];

async function main() {
  const payload = await getPayload({ config });

  for (const product of PRODUCTS) {
    const doc = await payload.findByID({ collection: "products", id: product.id, depth: 0 });
    let raw = (doc as any).wpRawContent as string;

    const before = (raw.match(/data-cohort-start="[^"]+"/g) || []).length;
    if (before === 0) {
      console.error(`[${product.label} ${product.id}] No data-cohort-start rows found - skipping.`);
      continue;
    }
    if (raw.includes("data-cohort-banner-html")) {
      console.log(`[${product.label} ${product.id}] Already has data-cohort-banner-html - skipping.`);
      continue;
    }

    raw = raw.replace(/data-cohort-start="([^"]+)"/g, `data-cohort-start="$1" data-cohort-banner-html="${BANNER_HTML}"`);

    await payload.update({ collection: "products", id: product.id, data: { wpRawContent: raw } });
    console.log(`[${product.label} ${product.id}] tagged ${before} cohort rows with the Next-Class banner override.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
