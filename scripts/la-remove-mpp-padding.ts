import { getPayload } from "payload";
import config from "../payload.config";

const PAGE_ID = 1385; // la site "locations" page = LA homepage

// A trailing 64px empty-space (inside the previous row's column) plus a
// separate standalone 64px empty-space row sit directly above the
// "Music Production Programs" section - 128px of padding total.
const CSS_BLOCK =
  `.vc_custom_1729129018281{border-top-width: 2px !important;border-right-width: 2px !important;border-bottom-width: 2px !important;border-left-width: 2px !important;background: #F7F7F7 url(/api/media/file/Asset-1%402x.png) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: contain !important;border-left-style: none !important;border-right-style: none !important;border-top-style: none !important;border-bottom-style: none !important;border-radius: 2px !important;border-color: #e9003f !important;}`;

const ANCHOR =
  `[/mkd_elements_holder_item][/mkd_elements_holder][vc_empty_space height="64px"][/vc_column][/vc_row]` +
  `[vc_row][vc_column][vc_empty_space height="64px"][/vc_column][/vc_row]` +
  `[vc_row content_width="grid" content_aligment="center"][vc_column css="${CSS_BLOCK}" el_class="bg-1"][vc_empty_space][mkd_section_title title_text="Music Production Programs"`;

const REPLACEMENT =
  `[/mkd_elements_holder_item][/mkd_elements_holder][/vc_column][/vc_row]` +
  `[vc_row content_width="grid" content_aligment="center"][vc_column css="${CSS_BLOCK}" el_class="bg-1"][vc_empty_space][mkd_section_title title_text="Music Production Programs"`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const occurrences = raw.split(ANCHOR).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 anchor match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(ANCHOR, REPLACEMENT);

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
