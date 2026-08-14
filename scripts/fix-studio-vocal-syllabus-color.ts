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

const PAGE_ID = 314; // la site "courses/studio-vocal-production"

// Same globals.css override problem as the enrollment blocks (see
// move-dj-text-up.ts): this page's "Studio Vocal Production Syllabus"
// section - the accordion (Recording/Vocal Arrangement/Mixing, Song Labs +
// gear list, Feedback and Music Business) plus the closing "constantly
// evolving" paragraph - uses inline `color: #ffffff` spans with no
// !important, so globals.css's blanket ".wpb_text_column ... { color: #000
// !important }" rule wins. Scope a global replace to just this segment
// (anchor-to-anchor) rather than one giant literal block, since the segment
// contains dozens of near-identical `color: #ffffff` spans that would be
// impractical (and error-prone) to reproduce as a single literal string.
const START_ANCHOR =
  `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">Studio Vocal Production Syllabus</span></h2>`;
const END_ANCHOR =
  `<p style="text-align: center"><span style="color: #ffffff">Music Technology &amp; Business are constantly evolving. Our curriculums are routinely updated to give you the best experience.</span></p>`;

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

  const colorSpanCount = (segment.match(/color: #ffffff"/g) || []).length;
  console.log(`Found ${colorSpanCount} 'color: #ffffff"' occurrences in segment.`);
  if (colorSpanCount !== 28) {
    console.error("Unexpected color span count - aborting for manual review.");
    process.exit(1);
  }

  const updatedSegment = segment.replace(/color: #ffffff"/g, `color: #ffffff !important"`);
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
