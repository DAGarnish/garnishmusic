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

// Follow-up to fix-studio-vocal-syllabus-color.ts: globals.css also has
//   .mkd-accordion-content, .mkd-accordion-content * { color: #000 !important; }
// which - via the universal selector - matches every descendant element
// *directly*, not just by inheritance. So the nested nameless
// <span class="css-1jxf684 ..."> wrappers (leftover from a copy/pasted rich
// text editor, used around the bolded leading term of most list items, e.g.
// "Studio Life" in "Studio Life: Mastering studio etiquette...") and the
// bare <strong>GEAR LIST</strong> tag each get their own direct #000
// !important, regardless of the outer <span style="color: #ffffff
// !important"> they sit inside - a directly-matched rule always wins over
// an inherited value, important or not. Confirmed via getComputedStyle in
// the live page after the first fix: the outer span computed white, but
// its nested css-1jxf684 span still computed black.
const START_ANCHOR =
  `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff !important">Studio Vocal Production Syllabus</span></h2>`;
const END_ANCHOR =
  `<p style="text-align: center"><span style="color: #ffffff !important">Music Technology &amp; Business are constantly evolving. Our curriculums are routinely updated to give you the best experience.</span></p>`;

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

  const nestedSpanCount = (segment.match(/<span class="css-1jxf684[^"]*">/g) || []).length;
  const strongCount = (segment.match(/<strong>/g) || []).length;
  console.log(`Found ${nestedSpanCount} bare nested css-1jxf684 spans, ${strongCount} bare <strong> tags.`);
  if (nestedSpanCount === 0 && strongCount === 0) {
    console.error("Nothing to fix - aborting.");
    process.exit(1);
  }

  let updatedSegment = segment.replace(
    /<span class="(css-1jxf684[^"]*)">/g,
    `<span class="$1" style="color: #ffffff !important">`
  );
  updatedSegment = updatedSegment.replace(/<strong>/g, `<strong style="color: #ffffff !important">`);

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
