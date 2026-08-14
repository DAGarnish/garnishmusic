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

// Same globals.css override problem as every other white-on-dark section
// fixed this session (see move-dj-text-up.ts / fix-la-course-accordion-
// colors.ts): the "360 Garnish Music Production Academy Modules" heading,
// its "[mkd_accordion color_style="white"]" module list, and the closing
// "Music Technology & Business..." paragraph all use inline `color:
// #ffffff` spans with no !important, so globals.css's blanket
// ".wpb_text_column ... { color: #000 !important }" (and, inside the
// accordion, ".mkd-accordion-content *") wins. Scoped as one contiguous
// segment (heading through closing paragraph) since all three pieces need
// the same fix and sit back-to-back in the raw content.
const START_ANCHOR = `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">360 Garnish Music Production Academy Modules</span></h2>`;
const END_ANCHOR = `<p style="text-align: center"><span style="color: #ffffff">Music Technology &amp; Business are constantly evolving. Our curriculums are routinely updated to give you the best experience.</span></p>\r\n[/vc_column_text]`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const startOccurrences = raw.split(START_ANCHOR).length - 1;
  if (startOccurrences !== 1) {
    console.error(`Expected exactly 1 start anchor match, found ${startOccurrences} - aborting.`);
    process.exit(1);
  }
  const start = raw.indexOf(START_ANCHOR);

  const endOccurrencesAfterStart = raw.slice(start).split(END_ANCHOR).length - 1;
  if (endOccurrencesAfterStart !== 1) {
    console.error(`Expected exactly 1 end anchor match after start, found ${endOccurrencesAfterStart} - aborting.`);
    process.exit(1);
  }
  const end = raw.indexOf(END_ANCHOR, start) + END_ANCHOR.length;

  const segment = raw.slice(start, end);

  const colorSpanCount = (segment.match(/color:\s*#ffffff(;)?"/g) || []).length;
  console.log(`Found ${colorSpanCount} 'color: #ffffff' occurrences in segment.`);
  const bareStrongCount = (segment.match(/<strong>/g) || []).length;
  console.log(`Found ${bareStrongCount} bare <strong> tags in segment.`);

  let updatedSegment = segment.replace(/color:\s*#ffffff(;)?"/g, (_match, semi) => `color: #ffffff !important${semi || ""}"`);
  updatedSegment = updatedSegment.replace(/<strong>/g, `<strong style="color: #ffffff !important">`);

  if (updatedSegment === segment) {
    console.error("No changes made - aborting update.");
    process.exit(1);
  }

  const updated = raw.slice(0, start) + updatedSegment + raw.slice(end);

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
