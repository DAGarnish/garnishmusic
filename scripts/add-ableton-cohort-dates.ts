import { getPayload } from "payload";
import config from "../payload.config";

const PAGE_ID = 77; // mia site, product/ableton-production

// Tags each schedule row with a machine-readable start date so
// NextCohortBanner (components/NextCohortBanner.tsx) can find "the next
// cohort that hasn't started yet" at render time, instead of a hardcoded
// position that would need manual upkeep as each date passes.
const REPLACEMENTS: [string, string][] = [
  [
    `<p style="text-align: center"><strong>M) Monday &amp; Wednesday Evenings | 7:00pm - 10:00pm</strong><br />101 &amp; 201: Aug 10 - Sept 21 (Skipping Sept 7-Labor Day)</p>`,
    `<p style="text-align: center" data-cohort-start="2026-08-10"><strong>M) Monday &amp; Wednesday Evenings | 7:00pm - 10:00pm</strong><br />101 &amp; 201: Aug 10 - Sept 21 (Skipping Sept 7-Labor Day)</p>`,
  ],
  [
    `<p style="text-align: center"><strong>Q) Tuesday &amp; Thursday Evenings | 7:00pm - 10:00pm</strong><br />101 &amp; 201: Oct 6 - Nov 12</p>`,
    `<p style="text-align: center" data-cohort-start="2026-10-06"><strong>Q) Tuesday &amp; Thursday Evenings | 7:00pm - 10:00pm</strong><br />101 &amp; 201: Oct 6 - Nov 12</p>`,
  ],
  [
    `<p style="text-align: center"><strong>A) Fast-Track - Monday, Wednesday &amp; Fridays | 10am - 5pm (w/ hour lunch)</strong><br />101 &amp; 201: Jan 11 - Jan 22</p>`,
    `<p style="text-align: center" data-cohort-start="2027-01-11"><strong>A) Fast-Track - Monday, Wednesday &amp; Fridays | 10am - 5pm (w/ hour lunch)</strong><br />101 &amp; 201: Jan 11 - Jan 22</p>`,
  ],
  [
    `<p style="text-align: center"><strong>B) Saturday Evenings | 7:30pm - 10:30pm</strong><br />101 &amp; 201: Jan 30 - Apr 24</p>`,
    `<p style="text-align: center" data-cohort-start="2027-01-30"><strong>B) Saturday Evenings | 7:30pm - 10:30pm</strong><br />101 &amp; 201: Jan 30 - Apr 24</p>`,
  ],
  [
    `<p style="text-align: center"><strong>C) Tuesday &amp; Thursday Evenings | 7:00pm - 10:00pm</strong><br />101 &amp; 201: Feb 23 - Apr 1</p>`,
    `<p style="text-align: center" data-cohort-start="2027-02-23"><strong>C) Tuesday &amp; Thursday Evenings | 7:00pm - 10:00pm</strong><br />101 &amp; 201: Feb 23 - Apr 1</p>`,
  ],
  [
    `<p style="text-align: center"><strong>D) Monday &amp; Wednesday Evenings | 7:00pm - 10:00pm</strong><br />101 &amp; 201: Apr 12 - May 19</p>`,
    `<p style="text-align: center" data-cohort-start="2027-04-12"><strong>D) Monday &amp; Wednesday Evenings | 7:00pm - 10:00pm</strong><br />101 &amp; 201: Apr 12 - May 19</p>`,
  ],
  [
    `<p style="text-align: center"><strong>J) Tuesday &amp; Thursday Evenings | 7 - 10 pm</strong><br />101 &amp; 201: Apr 13 - May 20</p>`,
    `<p style="text-align: center" data-cohort-start="2027-04-13"><strong>J) Tuesday &amp; Thursday Evenings | 7 - 10 pm</strong><br />101 &amp; 201: Apr 13 - May 20</p>`,
  ],
  [
    `<p style="text-align: center"><strong>E) Saturday Evenings | 7:30pm - 10:30pm</strong><br />101 &amp; 201: May 8 - Jul 31</p>`,
    `<p style="text-align: center" data-cohort-start="2027-05-08"><strong>E) Saturday Evenings | 7:30pm - 10:30pm</strong><br />101 &amp; 201: May 8 - Jul 31</p>`,
  ],
  [
    `<p style="text-align: center"><strong>L) Tuesday &amp; Thursday Evenings | 7 - 10 pm</strong><br />101 &amp; 201: May 25 - Jul 1</p>`,
    `<p style="text-align: center" data-cohort-start="2027-05-25"><strong>L) Tuesday &amp; Thursday Evenings | 7 - 10 pm</strong><br />101 &amp; 201: May 25 - Jul 1</p>`,
  ],
  [
    `<p style="text-align: center"><strong>A) Fast-Track - Monday, Wednesday &amp; Fridays | 10am - 5pm (w/ hour lunch)</strong><br />101 &amp; 201: Jul 19 - Jul 30</p>`,
    `<p style="text-align: center" data-cohort-start="2027-07-19"><strong>A) Fast-Track - Monday, Wednesday &amp; Fridays | 10am - 5pm (w/ hour lunch)</strong><br />101 &amp; 201: Jul 19 - Jul 30</p>`,
  ],
];

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "products", id: PAGE_ID, depth: 0 });
  let raw = (page as any).wpRawContent as string;

  for (const [oldStr, newStr] of REPLACEMENTS) {
    const occurrences = raw.split(oldStr).length - 1;
    if (occurrences !== 1) {
      console.error(`Expected exactly 1 match, found ${occurrences}:\n${oldStr}`);
      process.exit(1);
    }
    raw = raw.replace(oldStr, newStr);
  }

  await payload.update({
    collection: "products",
    id: PAGE_ID,
    data: { wpRawContent: raw },
  });

  console.log("Updated product", PAGE_ID, "with", REPLACEMENTS.length, "cohort-start dates");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
