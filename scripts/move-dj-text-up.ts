import { getPayload } from "payload";
import config from "../payload.config";

const PAGE_ID = 322; // la site "courses/dj-course"

// This page's inline `color: #ffffff` spans are being overridden by
// globals.css's blanket ".wpb_text_column ... { color: #000 !important }"
// rule (added to fix faded/low-contrast text elsewhere on the site, but too
// broad - it clobbers every intentionally-white span sitewide). Rather than
// touch that global rule (unknown blast radius across every other page/
// subdomain relying on it), make just this block's inline color win the
// cascade the normal way: an inline `!important` beats an external
// stylesheet `!important` of equal origin because inline style has higher
// specificity within the same importance tier.
const OLD_BLOCK =
  `<h1 style="text-align: center"><span style="color: #ffffff">DJ Course (24 Hrs): </span></h1>\r\n` +
  `<h1 style="text-align: center"><span style="color: #ffffff">$2250 Tuition + $300 Registration Fee</span></h1>\r\n` +
  `<h3 class="p1" style="text-align: center"><span style="color: #ffffff">**Enroll Now—max 8 spots!**</span></h3>\r\n` +
  `[/vc_column_text][vc_empty_space][vc_column_text css=""]\r\n` +
  `<h3 style="text-align: left"><span style="color: #ffffff">Enrollment Steps</span></h3>\r\n` +
  `<p style="text-align: left"><span style="color: #ffffff">1. Pay $300 Registration Fee to reserve. Typically Tue/Thu or Thu/Sat—Ask for schedule options.</span></p>\r\n` +
  `<p style="text-align: left"><span style="color: #ffffff">2. Pay tuition $2250 to enroll, get welcome packet. All major credit cards accepted.</span></p>`;

const NEW_BLOCK =
  `<h1 style="text-align: center"><span style="color: #ffffff !important">DJ Course (24 Hrs): </span></h1>\r\n` +
  `<h1 style="text-align: center"><span style="color: #ffffff !important">$2250 Tuition + $300 Registration Fee</span></h1>\r\n` +
  `<h3 class="p1" style="text-align: center"><span style="color: #ffffff !important">**Enroll Now—max 8 spots!**</span></h3>\r\n` +
  `[/vc_column_text][vc_empty_space][vc_column_text css=""]\r\n` +
  `<h3 style="text-align: left"><span style="color: #ffffff !important">Enrollment Steps</span></h3>\r\n` +
  `<p style="text-align: left"><span style="color: #ffffff !important">1. Pay $300 Registration Fee to reserve. Typically Tue/Thu or Thu/Sat—Ask for schedule options.</span></p>\r\n` +
  `<p style="text-align: left"><span style="color: #ffffff !important">2. Pay tuition $2250 to enroll, get welcome packet. All major credit cards accepted.</span></p>`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const occurrences = raw.split(OLD_BLOCK).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 anchor match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(OLD_BLOCK, NEW_BLOCK);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: updated },
  });

  console.log("Updated page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
