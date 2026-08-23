import { getPayload } from "payload";
import config from "../payload.config";

// add-mia-next-class-banner.ts inserted data-cohort-banner-html="Next <span
// class="next-class-arrow">..." with a literal, unescaped " inside the
// attribute value - valid as a JS string but invalid HTML, since the
// browser's attribute parser treats that inner " as the value's closing
// quote and leaks the rest of the string as text (confirmed live on
// mia.localhost/courses/ableton-live-course, e.g. `Class">C) Tuesday...`
// appearing in the rendered schedule). The already-working ny
// product/electronic-dj-class instance of this same override stores the
// inner quotes HTML-entity-escaped (&quot;) instead - this fixes the 7 MIA
// products just tagged to match that working form.
const BROKEN = 'data-cohort-banner-html="Next <span class="next-class-arrow">👇🏽</span> Class"';
const FIXED = 'data-cohort-banner-html="Next <span class=&quot;next-class-arrow&quot;>👇🏽</span> Class"';

const PRODUCT_IDS = [77, 70, 67, 65, 75, 76, 69];

async function main() {
  const payload = await getPayload({ config });

  for (const id of PRODUCT_IDS) {
    const doc = await payload.findByID({ collection: "products", id, depth: 0 });
    let raw = (doc as any).wpRawContent as string;

    const occurrences = raw.split(BROKEN).length - 1;
    if (occurrences === 0) {
      console.log(`[${id}] No broken banner markup found - skipping.`);
      continue;
    }

    raw = raw.split(BROKEN).join(FIXED);
    await payload.update({ collection: "products", id, data: { wpRawContent: raw } });
    console.log(`[${id}] Fixed ${occurrences} occurrences.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
