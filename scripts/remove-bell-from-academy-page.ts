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

const PAGE_ID = 1357; // la site "la-music-production-academy"

// Removes the large red BELL.jpg [vc_single_image] that sits orphaned in
// its own [vc_row] right after the hero section, linking out to a
// "los-angeles-la-contact-map" page with no visible relation to the
// surrounding "360 Music Production Academy" / "Enroll Now: Spring..."
// content around it - almost certainly a leftover from the WordPress
// migration rather than intentional content. vc_single_image is a
// self-closing shortcode (no matching [/vc_single_image]), so removing
// just this one tag leaves the row/column structure and the sibling
// [vc_column_text] that follows it untouched.
const OLD_SHORTCODE =
  `[vc_single_image image="18609" img_size="Large" alignment="center" onclick="custom_link" img_link_target="_blank" css="" link="https://la.garnishmusicproduction.com/los-angeles-la-contact-map/"]`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const occurrences = raw.split(OLD_SHORTCODE).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 anchor match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(OLD_SHORTCODE, "");

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
