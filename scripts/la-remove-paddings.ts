import { getPayload } from "payload";
import config from "../payload.config";

const PAGE_ID = 1385; // la site "locations" page = LA homepage
const NBSP = " "; // DB stores a non-breaking space before "Enroll Now", not a regular space

// Padding above "Enroll Now: LA Academy Oct 5" - the vc_column_text wrapper
// around that heading has a 20px padding-top baked into its vc_custom css.
const ANCHOR_1 =
  `css=".vc_custom_1784587729345{border-top-width: 20px !important;border-right-width: 20px !important;border-bottom-width: 20px !important;border-left-width: 20px !important;padding-top: 20px !important;padding-right: 20px !important;padding-bottom: 20px !important;padding-left: 20px !important;}"]\r\n` +
  `<div class="wpb_text_column wpb_content_element">\r\n<div class="wpb_wrapper">\r\n<h1 style="text-align: center"><span style="color: #993300">${NBSP}Enroll Now: LA Academy Oct 5</span></h1>`;

const REPLACEMENT_1 =
  `css=".vc_custom_1784587729345{border-right-width: 20px !important;border-bottom-width: 20px !important;border-left-width: 20px !important;padding-top: 0px !important;padding-right: 20px !important;padding-bottom: 20px !important;padding-left: 20px !important;}"]\r\n` +
  `<div class="wpb_text_column wpb_content_element">\r\n<div class="wpb_wrapper">\r\n<h1 style="text-align: center"><span style="color: #993300">${NBSP}Enroll Now: LA Academy Oct 5</span></h1>`;

// Two stacked 64px empty-space rows sit directly below the "Why Choose
// Garnish?" accordion, before the next (disabled, non-rendering) row.
const ANCHOR_2 =
  `[/vc_column_text][/mkd_accordion_tab][/mkd_accordion][/vc_column][/vc_row]` +
  `[vc_row][vc_column][vc_empty_space height="64px"][/vc_column][/vc_row]` +
  `[vc_row][vc_column][vc_empty_space height="64px"][/vc_column][/vc_row]` +
  `[vc_row disable_element="yes"`;

const REPLACEMENT_2 =
  `[/vc_column_text][/mkd_accordion_tab][/mkd_accordion][/vc_column][/vc_row]` +
  `[vc_row disable_element="yes"`;

function applyAnchor(raw: string, anchor: string, replacement: string, label: string): string {
  const occurrences = raw.split(anchor).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${occurrences}`);
  }
  return raw.replace(anchor, replacement);
}

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  let raw = page.wpRawContent as string;

  raw = applyAnchor(raw, ANCHOR_1, REPLACEMENT_1, "ANCHOR_1 (Enroll Now padding-top)");
  raw = applyAnchor(raw, ANCHOR_2, REPLACEMENT_2, "ANCHOR_2 (empty space below accordion)");

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: raw },
  });

  console.log("Updated page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
