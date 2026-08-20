import { getPayload } from "payload";
import config from "../payload.config";

// ny site's product/electronic-dj-class (id 160): tags every schedule row
// with data-cohort-start="YYYY-MM-DD" (same convention as
// add-ableton-cohort-dates.ts / add-mia-cohort-dates.ts) and a
// data-cohort-banner-html override, so NextCohortBanner
// (components/NextCohortBanner.tsx) picks up whichever row is next and
// shows this page's own "Next 👇🏽 Class" label instead of the site
// default "Next Cohorts 👇 Now Enrolling" - and keeps moving it forward on
// its own as each start date passes, instead of needing another manual
// edit. The static <p>Next 👇🏽 Class</p> marker inserted by
// add-next-class-marker.ts is removed, since the banner now renders itself.
const PRODUCT_ID = 160;

const BANNER_HTML = 'Next <span class="next-class-arrow">👇🏽</span> Class';

const COHORT_STARTS: [string, string][] = [
  ["A) 7/12", "2026-07-12"],
  ["B) 7/13", "2026-07-13"],
  ["C) 7/14", "2026-07-14"],
  ["D) 7/18", "2026-07-18"],
  ["E) 8/3", "2026-08-03"],
  ["F) 8/18", "2026-08-18"],
  ["G) 9/7", "2026-09-07"],
  ["H) 9/19", "2026-09-19"],
  ["I) 9/20", "2026-09-20"],
  ["J) 9/22", "2026-09-22"],
  ["K) 10/19", "2026-10-19"],
  ["L) 11/3", "2026-11-03"],
  ["M) 11/10", "2026-11-10"],
  ["N) 1/2", "2027-01-02"],
  ["O) 1/3", "2027-01-03"],
  ["P) 1/12", "2027-01-12"],
  ["Q) 2/23", "2027-02-23"],
  ["R) 3/1", "2027-03-01"],
  ["S) 3/17", "2027-03-17"],
  ["T) 4/6", "2027-04-06"],
  ["U) 5/3", "2027-05-03"],
  ["V) 5/8", "2027-05-08"],
  ["W) 5/16", "2027-05-16"],
  ["X) 5/29", "2027-05-29"],
  ["Y) 6/21", "2027-06-21"],
  ["Z) 6/22", "2027-06-22"],
];

async function main() {
  const payload = await getPayload({ config });
  const before = await payload.findByID({ collection: "products", id: PRODUCT_ID, depth: 0 });
  let raw = (before as any).wpRawContent as string;

  for (const [needle, isoDate] of COHORT_STARTS) {
    const oldTag = `<p style="text-align: left;">${needle}`;
    const newTag = `<p style="text-align: left;" data-cohort-start="${isoDate}" data-cohort-banner-html="${BANNER_HTML}">${needle}`;
    const occurrences = raw.split(oldTag).length - 1;
    if (occurrences !== 1) {
      console.error(`Expected exactly 1 match for "${needle}", found ${occurrences} - aborting.`);
      process.exit(1);
    }
    raw = raw.replace(oldTag, newTag);
  }

  const markerRe = /<p style="text-align: left;"><strong>Next <span class="next-class-arrow">👇🏽<\/span> Class<\/strong><\/p>\n?/;
  if (!markerRe.test(raw)) {
    console.error("Could not find the static Next-Class marker to remove - aborting.");
    process.exit(1);
  }
  raw = raw.replace(markerRe, "");

  await payload.update({
    collection: "products",
    id: PRODUCT_ID,
    data: { wpRawContent: raw },
  });

  console.log("Updated product", PRODUCT_ID, "with", COHORT_STARTS.length, "cohort-start dates; removed static marker.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
