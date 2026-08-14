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

const PAGE_ID = 1373; // la site "programs/logic-production-program"

// Same globals.css override problem as the course enrollment blocks (see
// move-dj-text-up.ts): this page's price/enrollment section - "Logic
// Production Program (120 hours)" through "Let's discuss Private
// Instruction..." - uses inline `color: #ffffff` spans with no
// !important, so globals.css's
//   .wpb_text_column, .wpb_text_column p, .wpb_text_column span,
//   .wpb_text_column li { color: #000 !important; }
// wins. That rule also directly matches <li> (not just inherited from its
// child span), which matters here because - unlike the other course pages'
// enrollment steps, which are plain <p> text - this page's "Enrollment
// Steps" and "Upcoming Classes" use real <ol>/<ul> lists, so the
// browser-drawn "1./2./3." markers and bullet take their color from the
// <li> itself, not from the inner span; leaving the <li> unfixed would
// have left the numbers/bullet black even with white list-item text.
//
// Anchor-to-anchor + regex substitution instead of one giant literal
// block, since retyping this segment's em dashes/smart quotes by hand
// kept producing silent byte mismatches against the DB's actual content
// (same lesson as fix-pro-tools-enroll-block.ts's non-breaking space).
const START_ANCHOR =
  `<h1 dir="auto" style="text-align: center"><span style="color: #ffffff">Logic Production Program (120 hours)</span></h1>`;
const END_ANCHOR = `if above options don't work</span></p>\r\n[/vc_column_text]`;

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

  // Sanity checks.
  if (!segment.includes("Enrollment Steps") || !segment.includes("Upcoming Classes")) {
    console.error("Segment doesn't look like the expected price/enrollment block - aborting.");
    process.exit(1);
  }
  const colorSpanCount = (segment.match(/color: #ffffff"/g) || []).length;
  if (colorSpanCount !== 13) {
    console.error(`Expected 13 'color: #ffffff"' occurrences in segment, found ${colorSpanCount} - aborting.`);
    process.exit(1);
  }
  const liCount = (segment.match(/<li(?![^>]*color)/g) || []).length;
  if (liCount !== 4) {
    console.error(`Expected 4 <li> tags without their own color in segment, found ${liCount} - aborting.`);
    process.exit(1);
  }

  let updatedSegment = segment.replace(/color: #ffffff"/g, `color: #ffffff !important"`);
  // <li dir="auto" style="text-align: left"> -> add color to style
  updatedSegment = updatedSegment.replace(
    /<li dir="auto" style="text-align: left">/g,
    `<li dir="auto" style="text-align: left; color: #ffffff !important">`
  );
  // <li> (bare, the "Upcoming Classes" list item)
  updatedSegment = updatedSegment.replace(/<li>/g, `<li style="color: #ffffff !important">`);

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
