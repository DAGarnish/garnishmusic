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

const PAGE_ID = 1351; // la site "music-production-instructors-los-angeles"

// Intro paragraph below the "Los Angeles Instructors" title (whose
// text_color attr was separately fixed at the renderer level in
// wp-shortcode-render.ts's mkd_section_title case): plain inline
// color: #ffffff loses to globals.css's .wpb_text_column ... { color:
// #000 !important }, same recurring bug fixed across this site. Also
// strip the stray space WordPress left before both "?" characters.
const OLD_TEXT = `<p style="text-align: left"><span style="color: #ffffff"><strong>Looking to write your next Pop Hit ? Finish a Mix or deep dive into Film Scoring ? We have the best Music Production Instructors Los Angeles has to offer!</strong></span></p>`;
const NEW_TEXT = `<p style="text-align: left"><span style="color: #ffffff !important"><strong>Looking to write your next Pop Hit? Finish a Mix or deep dive into Film Scoring? We have the best Music Production Instructors Los Angeles has to offer!</strong></span></p>`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const occurrences = raw.split(OLD_TEXT).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(OLD_TEXT, NEW_TEXT);

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
