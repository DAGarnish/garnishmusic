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

const PAGE_ID = 325; // la site "courses/pro-tools-course"

// Same treatment as the other course pages (see
// fix-remaining-la-course-enroll-blocks.ts), applied via short anchors +
// segment-scoped replacements instead of one giant literal block: this
// page's "for deeper skills." line ends in a real U+00A0 non-breaking
// space (not a plain space) before </span>, which a hand-typed literal
// block couldn't reliably reproduce byte-for-byte, so the exact-match
// approach used for the other 9 pages kept failing here with 0 matches.
const START_ANCHOR =
  `[vc_column_text css=""]\r\n<h1 style="text-align: center"><span style="color: #ffffff">Pro Tools Course (24 Hrs):`;
const END_ANCHOR = `[/vc_column_text][vc_empty_space][vc_column_text css="" el_class="bt"]`;

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
  const endIdx = raw.indexOf(END_ANCHOR, start);
  if (endIdx === -1) {
    console.error("Could not find end anchor after start anchor - aborting.");
    process.exit(1);
  }
  const end = endIdx + END_ANCHOR.length;

  const segment = raw.slice(start, end);

  // Sanity checks on the segment we're about to rewrite.
  if (!segment.includes("Enrollment Steps") || !segment.includes("LA 360 Music Academy")) {
    console.error("Segment doesn't look like the expected Pro Tools enroll block - aborting.");
    process.exit(1);
  }
  const colorSpanCount = (segment.match(/color: #ffffff"/g) || []).length;
  if (colorSpanCount !== 7) {
    console.error(`Expected 7 'color: #ffffff"' occurrences in segment, found ${colorSpanCount} - aborting.`);
    process.exit(1);
  }
  const vcColumnTextEmptyCount = (segment.match(/\[vc_column_text css=""\]/g) || []).length;
  if (vcColumnTextEmptyCount !== 2) {
    console.error(`Expected 2 '[vc_column_text css=""]' occurrences in segment, found ${vcColumnTextEmptyCount} - aborting.`);
    process.exit(1);
  }

  let updatedSegment = segment;
  // First [vc_column_text css=""] (the two h1s) - shift up 32px.
  updatedSegment = updatedSegment.replace(
    `[vc_column_text css=""]`,
    `[vc_column_text css=".vc_custom_1770325001111{margin-top: -32px !important;}"]`
  );
  // Second [vc_column_text css=""] (Enrollment Steps) - give the 32px back
  // before the JOIN NOW button.
  updatedSegment = updatedSegment.replace(
    `[vc_column_text css=""]`,
    `[vc_column_text css=".vc_custom_1770325002222{margin-bottom: 32px !important;}"]`
  );
  // Escalate every inline white color in this segment to !important so it
  // beats globals.css's blanket ".wpb_text_column ... { color: #000
  // !important }" rule.
  updatedSegment = updatedSegment.replace(/color: #ffffff"/g, `color: #ffffff !important"`);

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
