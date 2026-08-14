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

// Same fix as fix-academy-modules-color.ts (360 Music Production Academy,
// id 1357, already done), rolled out to the other 4 Production Programs
// pages: the "{Program} Modules" heading + "Click Module name to show/hide
// info" subheading (right before the module accordion) and the closing
// "Music Technology & Business are constantly evolving..." paragraph
// (right after it) all use inline `color: #ffffff` spans with no
// !important, so globals.css's blanket ".wpb_text_column ... { color:
// #000 !important }" wins on the dark background either side of the
// accordion.
const PAGES = [
  { id: 1374, slug: "programs/ableton-production-program", headingTag: "h2", titleHtml: "Ableton Production Program Modules", hasEmptyTrailingHeading: true, emptyTag: "h4" },
  { id: 1373, slug: "programs/logic-production-program", headingTag: "h1", titleHtml: "Logic Production Program Modules", hasEmptyTrailingHeading: true, emptyTag: "h4" },
  { id: 1353, slug: "songcraft-production-program", headingTag: "h3", titleHtml: "SongCraft Production Program Modules", hasEmptyTrailingHeading: false, emptyTag: "" },
  { id: 1331, slug: "dj-production-program", headingTag: "h2", titleHtml: "DJ Production Program Modules", hasEmptyTrailingHeading: true, emptyTag: "h4" },
];

async function main() {
  const payload = await getPayload({ config });

  for (const { id, slug, headingTag, titleHtml, hasEmptyTrailingHeading, emptyTag } of PAGES) {
    const page = await payload.findByID({ collection: "pages", id, depth: 0 });
    const raw = page.wpRawContent as string;

    const START_ANCHOR = `<${headingTag} class="font_6" style="text-align: center"><span style="color: #ffffff">${titleHtml}</span></${headingTag}>`;
    const END_ANCHOR = `<p style="text-align: center"><span style="color: #ffffff">Music Technology &amp; Business are constantly evolving. Our curriculums are routinely updated to give you the best experience.</span></p>\r\n[/vc_column_text]`;

    const startOccurrences = raw.split(START_ANCHOR).length - 1;
    if (startOccurrences !== 1) {
      console.error(`[${id}] ${slug}: expected exactly 1 start anchor match, found ${startOccurrences} - skipping.`);
      continue;
    }
    const start = raw.indexOf(START_ANCHOR);

    const endOccurrencesAfterStart = raw.slice(start).split(END_ANCHOR).length - 1;
    if (endOccurrencesAfterStart !== 1) {
      console.error(`[${id}] ${slug}: expected exactly 1 end anchor match after start, found ${endOccurrencesAfterStart} - skipping.`);
      continue;
    }
    const end = raw.indexOf(END_ANCHOR, start) + END_ANCHOR.length;

    const segment = raw.slice(start, end);

    const expectedColorSpans = hasEmptyTrailingHeading ? 3 : 3; // title, subheading, closing paragraph - the empty trailing heading has no span
    const colorSpanCount = (segment.match(/color:\s*#ffffff(;)?"/g) || []).length;
    if (colorSpanCount !== expectedColorSpans) {
      console.error(`[${id}] ${slug}: expected ${expectedColorSpans} 'color: #ffffff' occurrences, found ${colorSpanCount} - skipping.`);
      continue;
    }

    const updatedSegment = segment.replace(/color:\s*#ffffff(;)?"/g, (_m, semi) => `color: #ffffff !important${semi || ""}"`);
    const updated = raw.slice(0, start) + updatedSegment + raw.slice(end);

    await payload.update({
      collection: "pages",
      id,
      data: { wpRawContent: updated },
    });

    console.log(`[${id}] ${slug}: updated`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
