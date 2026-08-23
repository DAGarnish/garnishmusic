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

const PAGE_ID = 1311; // mia site "academy/emp-electronic-music-producer"

// Confirmed with the user: this is the "2026 Cohort Schedule" block
// (tuition, schedule, Cohort 1/Cohort 2 dates). Requested:
//   1. remove the red "(Now Enrolling)" tag next to Cohort 2
//   2. put every date/term line in its own centered paragraph so spacing
//      between lines is uniform (previously Term 1/Term 2 lines were
//      joined with <br> inside one <p>, while cohort headers were
//      separate <h4>s - tight spacing within a paragraph, wide between
//      paragraphs, nothing centered)
//   3. consolidate the whole block into one expandable accordion
const START_ANCHOR = `[vc_column_text css=""]</p>\n<p style="text-align: center;">$11499 + $500 registration fee | <a href="https://mia.garnishmusicproduction.com/product/academy-payments/" target="_blank" rel="noopener noreferrer">Payment Info</a></p>`;
const END_MARKER = `[/vc_column_text][vc_empty_space height="20"][mkd_separator position="center" color="#F7F7F7" thickness="50"][/vc_column_inner][/vc_row_inner][/vc_column][/vc_row][vc_row content_width="grid" css=".vc_custom_1735819130193`;

const REPLACEMENT_TAB_BODY = [
  `<p style="text-align: center;">$11499 + $500 registration fee | <a href="https://mia.garnishmusicproduction.com/product/academy-payments/" target="_blank" rel="noopener noreferrer">Payment Info</a></p>`,
  `<h3>Music Production Academy</h3>`,
  `<p><strong>Day Program (6 Months)</strong><br />$11,499 Tuition + $500 Registration Fee</p>`,
  `<p><strong>Schedule:</strong> Monday, Wednesday, Friday<br /><strong>Time:</strong> 10:00 AM – 5:00 PM (1-hour break)</p>`,
  `<p>Each cohort includes <strong>two 10-week terms (20 instructional weeks total).</strong></p>`,
  `<hr />`,
  `<h3 style="text-align: center;">2026 Cohort Schedule</h3>`,
  `<p style="text-align: center;"><strong>Cohort 1 — Winter/Spring (In Progress)</strong></p>`,
  `<p style="text-align: center;">January 12 – June 17, 2026</p>`,
  `<p style="text-align: center;"><strong>Term 1:</strong> January 12 – March 23 (No class MLK Day or Presidents’ Day)</p>`,
  `<p style="text-align: center;"><strong>Term 2:</strong> April 6 – June 17 (No class Memorial Day)</p>`,
  `<p style="text-align: center;"><strong>Cohort 2 — Summer/Fall</strong></p>`,
  `<p style="text-align: center;">July 20 – December 18</p>`,
  `<p style="text-align: center;"><strong>Term 1:</strong> July 20 – September 25 (No class Labor Day)</p>`,
  `<p style="text-align: center;"><strong>Term 2:</strong> October 5 – December 18 (No class Thanksgiving Week)</p>`,
  `<hr />`,
  `<h4><strong>Early Bird Tuition</strong></h4>`,
  `<p>🚀 <strong>Save $500</strong> when tuition is paid in full before <strong>June 15, 2026</strong> for the July 20 cohort.</p>`,
  `<p style="text-align: center;">Bespoke private tuition is also available for the whole program. Contact us for more information.</p>`,
  `<p style="text-align: center;"><strong>Free this year: </strong>optional Hit Songwriting classes and mentoring from our <a href="https://mia.garnishmusicproduction.com/academy/songwriting-music-producer/" target="_blank" rel="noopener noreferrer">Songwriting Music Academy.</a></p>`,
  `<p style="text-align: center;"><a href="https://garn.link/c" target="_blank" rel="noopener noreferrer"><img class="alignnone wp-image-10984 size-medium" src="/api/media/file/Academy-Application-300x74-3.png" alt="Academy Application Form" width="300" height="74" /></a></p>`,
  `<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don't send many, you can easily unsubscribe, and we never share our data with anyone.</p>`,
].join("\n");

const REPLACEMENT = `[vc_column_text css=""]\n<h2 style="text-align: center;">2026</h2>\n[/vc_column_text][mkd_accordion style="toggle"][mkd_accordion_tab title="Tuition &amp; 2026 Cohort Schedule" title_tag="h4"][vc_column_text css=""]\n${REPLACEMENT_TAB_BODY}\n[/vc_column_text][/mkd_accordion_tab][/mkd_accordion]`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  let raw = page.wpRawContent as string;

  const start = raw.indexOf(START_ANCHOR);
  if (start === -1) {
    console.error("Start anchor not found - aborting.");
    process.exit(1);
  }
  const endMarkerIdx = raw.indexOf(END_MARKER, start);
  if (endMarkerIdx === -1) {
    console.error("End marker not found - aborting.");
    process.exit(1);
  }

  // sanity: verify the old segment still contains the exact things we expect to replace
  const oldSegment = raw.slice(start, endMarkerIdx);
  if (!oldSegment.includes('(Now Enrolling)') || !oldSegment.includes('July 20 – December 18')) {
    console.error("Old segment doesn't match expected content - aborting.");
    process.exit(1);
  }

  // Need to also swallow the "[vc_column_text css=\"\"]</p>" opening tag that
  // precedes START_ANCHOR's own content (START_ANCHOR includes it).
  raw = raw.slice(0, start) + REPLACEMENT + raw.slice(endMarkerIdx + "[/vc_column_text]".length);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: raw },
  });

  console.log("Updated page", PAGE_ID, "- new length:", raw.length);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
