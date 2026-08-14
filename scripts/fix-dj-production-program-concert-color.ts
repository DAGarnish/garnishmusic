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

// Same "Garnish LA DJ Course Graduation Concert" section as
// courses/dj-course (id 322, see fix-dj-concert-names-color.ts) - this
// content was copy-pasted onto this page too (confirmed via
// scan-graduation-concert-usage.ts: identical 6 names, still plain
// non-important color here even though courses/dj-course's copy was
// already fixed), so it needs the same fix independently.
const START_ANCHOR = `<h2 style="text-align: center"><span style="color: #ffffff">Garnish LA DJ Course Graduation Concert</span></h2>`;
const END_ANCHOR = `<h3 style="text-align: center"><span style="color: #ffffff">Bok Choi Boi</span></h3>\r\n[/vc_column_text]`;

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
  console.log(`Found ${colorSpanCount} 'color: #ffffff' occurrences in segment (expect 7: heading + 6 names).`);
  if (colorSpanCount !== 7) {
    console.error("Unexpected color span count - aborting for manual review.");
    process.exit(1);
  }

  const updatedSegment = segment.replace(/color:\s*#ffffff(;)?"/g, (_m, semi) => `color: #ffffff !important${semi || ""}"`);
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
