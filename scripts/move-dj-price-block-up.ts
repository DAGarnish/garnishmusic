import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const PAGE_ID = 322; // la site "courses/dj-course"

// Shift the "DJ Course (24 Hrs): $2250..." / "Enrollment Steps" price block
// 16px higher, without moving the "JOIN NOW" button below it or the
// section's background container. The two [vc_column_text] blocks that hold
// this copy render straight to <div class="wpb_text_column" style="...">
// with their css="" attribute's declarations applied inline (see
// vcCustomStyle in wp-shortcode-render.ts), so a WPBakery-style
// css=".vc_custom_ID{...}" attribute is the normal way to add an inline
// style here. margin-top: -16px on the first block pulls it (and everything
// below, in normal flow) up 16px; margin-bottom: 16px on the second block
// gives that 16px back before the JOIN NOW button, so only this block moves.
const OLD_BLOCK =
  `[vc_column_text css=""]\r\n` +
  `<h1 style="text-align: center"><span style="color: #ffffff !important">DJ Course (24 Hrs): </span></h1>\r\n` +
  `<h1 style="text-align: center"><span style="color: #ffffff !important">$2250 Tuition + $300 Registration Fee</span></h1>\r\n` +
  `<h3 class="p1" style="text-align: center"><span style="color: #ffffff !important">**Enroll Now—max 8 spots!**</span></h3>\r\n` +
  `[/vc_column_text][vc_empty_space][vc_column_text css=""]\r\n` +
  `<h3 style="text-align: left"><span style="color: #ffffff !important">Enrollment Steps</span></h3>\r\n` +
  `<p style="text-align: left"><span style="color: #ffffff !important">1. Pay $300 Registration Fee to reserve. Typically Tue/Thu or Thu/Sat—Ask for schedule options.</span></p>\r\n` +
  `<p style="text-align: left"><span style="color: #ffffff !important">2. Pay tuition $2250 to enroll, get welcome packet. All major credit cards accepted.</span></p>\r\n` +
  `[/vc_column_text][vc_empty_space][vc_column_text css="" el_class="bt"]`;

const NEW_BLOCK =
  `[vc_column_text css=".vc_custom_1770000001111{margin-top: -16px !important;}"]\r\n` +
  `<h1 style="text-align: center"><span style="color: #ffffff !important">DJ Course (24 Hrs): </span></h1>\r\n` +
  `<h1 style="text-align: center"><span style="color: #ffffff !important">$2250 Tuition + $300 Registration Fee</span></h1>\r\n` +
  `<h3 class="p1" style="text-align: center"><span style="color: #ffffff !important">**Enroll Now—max 8 spots!**</span></h3>\r\n` +
  `[/vc_column_text][vc_empty_space][vc_column_text css=".vc_custom_1770000002222{margin-bottom: 16px !important;}"]\r\n` +
  `<h3 style="text-align: left"><span style="color: #ffffff !important">Enrollment Steps</span></h3>\r\n` +
  `<p style="text-align: left"><span style="color: #ffffff !important">1. Pay $300 Registration Fee to reserve. Typically Tue/Thu or Thu/Sat—Ask for schedule options.</span></p>\r\n` +
  `<p style="text-align: left"><span style="color: #ffffff !important">2. Pay tuition $2250 to enroll, get welcome packet. All major credit cards accepted.</span></p>\r\n` +
  `[/vc_column_text][vc_empty_space][vc_column_text css="" el_class="bt"]`;

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
