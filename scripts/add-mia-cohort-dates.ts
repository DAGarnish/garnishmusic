import { getPayload } from "payload";
import config from "../payload.config";

// Rolls the same data-cohort-start tagging done for Ableton
// (add-ableton-cohort-dates.ts) out to the rest of MIA's course-schedule
// products, so NextCohortBanner's "Next Cohorts 👇 Now Enrolling" banner
// finds the next upcoming cohort on these pages too.
const PRODUCTS: { id: number; label: string; replacements: [string, string][] }[] = [
  {
    id: 70, // product/electronic-music-dj-course
    label: "electronic-music-dj-course",
    replacements: [
      [
        `<p style="text-align: center"><strong>L) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jul 6 – Aug 5, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2026-07-06"><strong>L) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jul 6 – Aug 5, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>M) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jul 7 – Aug 6, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2026-07-07"><strong>M) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jul 7 – Aug 6, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>N) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Aug 24 – Sep 28 (skipping Labor Day), → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2026-08-24"><strong>N) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Aug 24 – Sep 28 (skipping Labor Day), → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>O) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Aug 25 – Sep 24, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2026-08-25"><strong>O) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Aug 25 – Sep 24, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>P) Sunday Afternoons | 2–5p</strong> (10 weeks)<br />101 &amp; 201: Sep 20 – Nov 22, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2026-09-20"><strong>P) Sunday Afternoons | 2–5p</strong> (10 weeks)<br />101 &amp; 201: Sep 20 – Nov 22, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>R) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Oct 12 – Nov 16 (skipping Veterans Day), → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2026-10-12"><strong>R) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Oct 12 – Nov 16 (skipping Veterans Day), → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>S) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Oct 13 – Nov 12, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2026-10-13"><strong>S) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Oct 13 – Nov 12, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>T) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Nov 17 – Dec 22 (skipping Thanksgiving week Nov 25 &amp; 27), → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2026-11-17"><strong>T) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Nov 17 – Dec 22 (skipping Thanksgiving week Nov 25 &amp; 27), → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>A) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jan 11 – Feb 10, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-01-11"><strong>A) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jan 11 – Feb 10, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>B) Sunday Afternoons | 2–5p</strong> (5 weeks)<br />101 &amp; 201: Jan 17 – Mar 21, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-01-17"><strong>B) Sunday Afternoons | 2–5p</strong> (5 weeks)<br />101 &amp; 201: Jan 17 – Mar 21, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>C) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: Jan 19 - Feb 18, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-01-19"><strong>C) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: Jan 19 - Feb 18, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>D) Monday Nights | 7–10p</strong> (10 weeks)<br />101 &amp; 201: Feb 22 – Apr 26, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-02-22"><strong>D) Monday Nights | 7–10p</strong> (10 weeks)<br />101 &amp; 201: Feb 22 – Apr 26, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>E) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Mar 2 – Apr 6, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-03-02"><strong>E) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Mar 2 – Apr 6, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>I) Sunday Afternoons | 2p – 5p</strong> (10 weeks)<br />101 &amp; 201: Apr 11 -Jun 13, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-04-11"><strong>I) Sunday Afternoons | 2p – 5p</strong> (10 weeks)<br />101 &amp; 201: Apr 11 -Jun 13, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>J) Sunday Evenings | 5:30p – 8:30p</strong> (10 weeks)<br />101 &amp; 201: Apr 11 -Jun 13, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-04-11"><strong>J) Sunday Evenings | 5:30p – 8:30p</strong> (10 weeks)<br />101 &amp; 201: Apr 11 -Jun 13, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>F) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: Apr 13 - May 13, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-04-13"><strong>F) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: Apr 13 - May 13, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>H) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: May 10 – Jun 14, (skipping Memorial Day) → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-05-10"><strong>H) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: May 10 – Jun 14, (skipping Memorial Day) → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>G) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: May 25 - Jun 24, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-05-25"><strong>G) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: May 25 - Jun 24, → and your show</p>`,
      ],
      [
        `<p style="text-align: center"><strong>K) Sunday Afternoons | 2p – 5p</strong> (10 weeks)<br />101 &amp; 201: Jun 27 -Aug 29, → and your show</p>`,
        `<p style="text-align: center" data-cohort-start="2027-06-27"><strong>K) Sunday Afternoons | 2p – 5p</strong> (10 weeks)<br />101 &amp; 201: Jun 27 -Aug 29, → and your show</p>`,
      ],
    ],
  },
  {
    id: 67, // product/logic-course
    label: "logic-course",
    replacements: [
      [
        `<p style="text-align: center"><strong>L) Sundays Afternoons | 2pm - 5pm</strong><br />101 &amp; 201: Oct 4 - December 20</p>`,
        `<p style="text-align: center" data-cohort-start="2026-10-04"><strong>L) Sundays Afternoons | 2pm - 5pm</strong><br />101 &amp; 201: Oct 4 - December 20</p>`,
      ],
      [
        `<p style="text-align: center"><strong>G) Wednesday Evenings | 6:30pm - 9:30pm</strong><br />101 &amp; 201: January 13 – March 17, 2027</p>`,
        `<p style="text-align: center" data-cohort-start="2027-01-13"><strong>G) Wednesday Evenings | 6:30pm - 9:30pm</strong><br />101 &amp; 201: January 13 – March 17, 2027</p>`,
      ],
      [
        `<p style="text-align: center"><strong>K) Sundays Afternoons | 1pm - 7pm (with a 1 hour break)</strong><br />101 &amp; 201: January 31 – March 7, 2027</p>`,
        `<p style="text-align: center" data-cohort-start="2027-01-31"><strong>K) Sundays Afternoons | 1pm - 7pm (with a 1 hour break)</strong><br />101 &amp; 201: January 31 – March 7, 2027</p>`,
      ],
      [
        `<p style="text-align: center"><strong>M) Tuesdays &amp; Thursdays | 1pm - 4pm</strong><br />101 &amp; 201: February 23 – March 25, 2027</p>`,
        `<p style="text-align: center" data-cohort-start="2027-02-23"><strong>M) Tuesdays &amp; Thursdays | 1pm - 4pm</strong><br />101 &amp; 201: February 23 – March 25, 2027</p>`,
      ],
      [
        `<p style="text-align: center"><strong>L) Sundays Afternoons | 1pm - 4pm</strong><br />101 &amp; 201: June 6 – August 1, 2027</p>`,
        `<p style="text-align: center" data-cohort-start="2027-06-06"><strong>L) Sundays Afternoons | 1pm - 4pm</strong><br />101 &amp; 201: June 6 – August 1, 2027</p>`,
      ],
      [
        `<p style="text-align: center"><strong>N) Tuesdays &amp; Thursdays | 11am - 2pm</strong><br />101 &amp; 201: April 6 – May 6, 2027</p>`,
        `<p style="text-align: center" data-cohort-start="2027-04-06"><strong>N) Tuesdays &amp; Thursdays | 11am - 2pm</strong><br />101 &amp; 201: April 6 – May 6, 2027</p>`,
      ],
    ],
  },
  {
    id: 65, // product/summer-camp
    label: "summer-camp",
    replacements: [
      [
        `<p style="text-align: center">A) Electronic Music Production Camp in Ableton: Monday to Friday | June 14 - June 25 | 10a - 2p</p>`,
        `<p style="text-align: center" data-cohort-start="2027-06-14">A) Electronic Music Production Camp in Ableton: Monday to Friday | June 14 - June 25 | 10a - 2p</p>`,
      ],
      [
        `<p style="text-align: center">B) Electronic Music Production Camp in Logic Pro: Monday to Friday | June 28 - July 9 | 10a - 2p</p>`,
        `<p style="text-align: center" data-cohort-start="2027-06-28">B) Electronic Music Production Camp in Logic Pro: Monday to Friday | June 28 - July 9 | 10a - 2p</p>`,
      ],
      [
        `<p style="text-align: center">C) Electronic Music Production Camp in Ableton: Monday to Friday | July 12 - July 23 | 10a - 2p</p>`,
        `<p style="text-align: center" data-cohort-start="2027-07-12">C) Electronic Music Production Camp in Ableton: Monday to Friday | July 12 - July 23 | 10a - 2p</p>`,
      ],
    ],
  },
  {
    id: 75, // product/ableton-producer-program
    label: "ableton-producer-program",
    replacements: [
      [
        `<p style="text-align: center">Schedule:  Monday, Wednesday, Friday Days | 6.5 weeks  | 10a - 5p (with one hour lunch break) |\nStart: <span class="s1">Jan 11 – End: Mar 1</span></p>`,
        `<p style="text-align: center" data-cohort-start="2027-01-11">Schedule:  Monday, Wednesday, Friday Days | 6.5 weeks  | 10a - 5p (with one hour lunch break) |\nStart: <span class="s1">Jan 11 – End: Mar 1</span></p>`,
      ],
    ],
  },
  {
    id: 76, // product/logic-producer-program
    label: "logic-producer-program",
    replacements: [
      [
        `<p style="text-align: center">Schedule:  Monday, Wednesday, Friday Days | 6.5 weeks  | 10a – 5p (with one hour lunch break) |\nStart: <span class="s1">Jan 11 – End: Mar 1</span></p>`,
        `<p style="text-align: center" data-cohort-start="2027-01-11">Schedule:  Monday, Wednesday, Friday Days | 6.5 weeks  | 10a – 5p (with one hour lunch break) |\nStart: <span class="s1">Jan 11 – End: Mar 1</span></p>`,
      ],
    ],
  },
  {
    id: 69, // product/curso-de-dj-pro-en-espanol
    label: "curso-de-dj-pro-en-espanol",
    replacements: [
      [
        `<p style="text-align: center"><strong>A) Martes Y Jueves en la noche | 7:00pm – 10:00 pm</strong></p>\n<p style="text-align: center">101 &amp; 201: Enero 19 –  Febrero 18\npresentación de graduación (según disponibilidad)</p>`,
        `<p style="text-align: center" data-cohort-start="2027-01-19"><strong>A) Martes Y Jueves en la noche | 7:00pm – 10:00 pm</strong></p>\n<p style="text-align: center">101 &amp; 201: Enero 19 –  Febrero 18\npresentación de graduación (según disponibilidad)</p>`,
      ],
      [
        `<p style="text-align: center"><strong>B) Martes Y Jueves en la noche | 7:00pm – 10:00 pm</strong></p>\n<p style="text-align: center">101 &amp; 201: Marzo 30 –  Abríl 29\npresentación de graduación (según disponibilidad)</p>`,
        `<p style="text-align: center" data-cohort-start="2027-03-30"><strong>B) Martes Y Jueves en la noche | 7:00pm – 10:00 pm</strong></p>\n<p style="text-align: center">101 &amp; 201: Marzo 30 –  Abríl 29\npresentación de graduación (según disponibilidad)</p>`,
      ],
      [
        `<p style="text-align: center"><strong>C)Miércoles en la noche | 7pm – 10:00pm</strong></p>`,
        `<p style="text-align: center" data-cohort-start="2027-03-31"><strong>C)Miércoles en la noche | 7pm – 10:00pm</strong></p>`,
      ],
    ],
  },
];

async function main() {
  const payload = await getPayload({ config });

  for (const product of PRODUCTS) {
    const doc = await payload.findByID({ collection: "products", id: product.id, depth: 0 });
    let raw = (doc as any).wpRawContent as string;
    let failed = false;

    for (const [oldStr, newStr] of product.replacements) {
      const occurrences = raw.split(oldStr).length - 1;
      if (occurrences !== 1) {
        console.error(`[${product.label} ${product.id}] Expected exactly 1 match, found ${occurrences}:\n${oldStr}`);
        failed = true;
        continue;
      }
      raw = raw.replace(oldStr, newStr);
    }

    if (failed) {
      console.error(`[${product.label} ${product.id}] Skipped update due to match failures above.`);
      continue;
    }

    await payload.update({ collection: "products", id: product.id, data: { wpRawContent: raw } });
    console.log(`[${product.label} ${product.id}] tagged ${product.replacements.length} cohort rows.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
