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

const PAGE_ID = 1331; // la site "dj-production-program"

// The "Meet Our World-Class Instructors" section here pulls
// [mkd_portfolio_slider category="ableton, sound design, mixing,
// songwriting"] - no DJ instructors at all, and "sound design" (missing
// the hyphen "sound-design" real category pages actually use) doesn't
// match anything regardless. For a page literally called "DJ Production
// Program", add the real "dj" category (6 LA DJ instructor pages
// confirmed: Igor Krasnienko, Matthew Engst, DJ Flossy, DJ Jes Danz, Paola
// Gladys, Kindred - see check-dj-portfolio-items.ts) so DJ instructors
// actually show up here, alongside the existing (now also fixed by
// lib/wp-portfolio-resolver.ts's case-insensitivity fix) categories.
const OLD_SHORTCODE = `[mkd_portfolio_slider type="gallery" image_size="square" portfolios_shown="6" category="ableton, sound design, mixing, songwriting"]`;
const NEW_SHORTCODE = `[mkd_portfolio_slider type="gallery" image_size="square" portfolios_shown="6" category="dj, ableton, sound-design, mixing, songwriting"]`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const occurrences = raw.split(OLD_SHORTCODE).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 anchor match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(OLD_SHORTCODE, NEW_SHORTCODE);

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
