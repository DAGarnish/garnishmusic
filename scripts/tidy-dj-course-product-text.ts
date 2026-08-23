import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

const PRODUCT_ID = 70; // mia site product "product/electronic-music-dj-course"

// Formatting-only cleanup of the schedule list (A-T course sections):
//   - each entry gets its own <p> (previously several entries ran
//     together in one <p> separated only by a bare newline, which
//     collapses to a single space in HTML - no visible line break)
//   - stray data-start/data-end attributes (leftover from wherever this
//     was originally drafted) removed - they have no effect and are
//     just noise in the raw content
//   - inconsistent "(C)"/"(F)"/"(G)" parenthesized letters normalized to
//     the plain "C)" style every other entry already uses
// Wording, dates, and the existing order of entries are all preserved
// exactly - no content removed or reordered, only reformatted.
const NEW_CONTENT = `<p style="text-align: center">Please add the learner's name and email address in the 'Additional Information' box at check out if they are different from the payer's. If there are fewer than 48 hours before the start of your course, please contact us to ensure we still have availability before you book. 101 has to be completed before 201 can be booked.</p>
<p style="text-align: center"><span style="color: #000000">101: $899 | 201: $899 | Both: $1299 if booked, paid, and taken together</span></p>
<p style="text-align: center"><strong>2026</strong></p>
<p style="text-align: center"><strong>A) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jan 12 – Feb 11, → and your show</p>
<p style="text-align: center"><strong>B) Sunday Afternoons | 2–5p</strong> (5 weeks)<br />101 &amp; 201: Jan 18 – Mar 22, → and your show</p>
<p style="text-align: center"><strong>C) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: Jan 20 - Feb 19, → and your show</p>
<p style="text-align: center"><strong>D) Monday Nights | 7–10p</strong> (10 weeks)<br />101 &amp; 201: Feb 23 – Apr 27, → and your show</p>
<p style="text-align: center"><strong>E) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Mar 3 – Apr 7, (skipping St. Patricks Day) → and your show</p>
<p style="text-align: center"><strong>I) Sunday Afternoons | 2p – 5p</strong> (10 weeks)<br />101 &amp; 201: Apr 12 -Jun 14, → and your show</p>
<p style="text-align: center"><strong>J) Sunday Evenings | 5:30p – 8:30p</strong> (10 weeks)<br />101 &amp; 201: Apr 12 -Jun 14, → and your show</p>
<p style="text-align: center"><strong>F) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: Apr 14 - May 14, → and your show</p>
<p style="text-align: center"><strong>H) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: May 11 – Jun 15, (skipping Memorial Day) → and your show</p>
<p style="text-align: center"><strong>G) Tues &amp; Thurs Nights | 7p – 10p</strong> (5 weeks)<br />101 &amp; 201: May 26 - Jun 25, → and your show</p>
<p style="text-align: center"><strong>K) Sunday Afternoons | 2p – 5p</strong> (10 weeks)<br />101 &amp; 201: Jun 28 -Aug 30, → and your show</p>
<p style="text-align: center"><strong>L) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jul 6 – Aug 5, → and your show</p>
<p style="text-align: center"><strong>M) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Jul 7 – Aug 6, → and your show</p>
<p style="text-align: center"><span style="color: #ff0000"><b>NEXT COHORTS👇 NOW ENROLLING</b></span></p>
<p style="text-align: center"><strong>N) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Aug 24 – Sep 28 (skipping Labor Day), → and your show</p>
<p style="text-align: center"><strong>O) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Aug 25 – Sep 24, → and your show</p>
<p style="text-align: center"><strong>P) Sunday Afternoons | 2–5p</strong> (10 weeks)<br />101 &amp; 201: Sep 20 – Nov 22, → and your show</p>
<p style="text-align: center"><strong>R) Mon &amp; Wed Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Oct 12 – Nov 16 (skipping Veterans Day), → and your show</p>
<p style="text-align: center"><strong>S) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Oct 13 – Nov 12, → and your show</p>
<p style="text-align: center"><strong>T) Tues &amp; Thurs Nights | 7–10p</strong> (5 weeks)<br />101 &amp; 201: Nov 17 – Dec 22 (skipping Thanksgiving week Nov 25 &amp; 27), → and your show</p>
<p style="text-align: center">$100 off for each course previously taken with us. Contact us for more info.</p>`;

async function main() {
  const payload = await getPayload({ config });

  // sanity: verify the current content still matches what we expect before overwriting
  const before = await payload.findByID({ collection: "products", id: PRODUCT_ID, depth: 0 });
  const raw = (before as any).wpRawContent as string;
  const expectedMarkers = ["Jan 12 – Feb 11", "NEXT COHORTS", "Nov 17 – Dec 22", "$100 off for each course"];
  for (const marker of expectedMarkers) {
    if (!raw.includes(marker)) {
      console.error(`Expected marker "${marker}" not found in current content - aborting.`);
      process.exit(1);
    }
  }

  await payload.update({
    collection: "products",
    id: PRODUCT_ID,
    data: { wpRawContent: NEW_CONTENT },
  });

  console.log("Updated product", PRODUCT_ID, "- new length:", NEW_CONTENT.length, "(was", raw.length, ")");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
