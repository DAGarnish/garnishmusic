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

// Same fix as fix-logic-production-price-block-color.ts (see that script's
// comment for the full explanation - globals.css's
//   .wpb_text_column, .wpb_text_column p, .wpb_text_column span,
//   .wpb_text_column li { color: #000 !important; }
// beats a plain, non-important inline `color: #ffffff`, and matches <li>
// directly, so the <ol>/<ul> markers need their own override too, not just
// the child span), applied to the other 4 "Production Programs" pages,
// which all share the exact same price/enrollment block template as Logic
// Production Program - just a different title/price/hours.
// programs/ableton-production-program's block ends right after the
// "Upcoming Classes" list - it has no closing "Let's discuss Private
// Instruction..." paragraph, unlike the other three pages.
const PAGES = [
  { id: 1357, slug: "la-music-production-academy", titleHtml: "Los Angeles 360° Music Academy (360 hours, 1 year)", hasPrivateInstructionParagraph: true },
  { id: 1374, slug: "programs/ableton-production-program", titleHtml: "Ableton Production Program (120 hours)", hasPrivateInstructionParagraph: false },
  { id: 1353, slug: "songcraft-production-program", titleHtml: "SongCraft Production Program (120 hours)", hasPrivateInstructionParagraph: true },
  { id: 1331, slug: "dj-production-program", titleHtml: "DJ Production Program (144 Hours)", hasPrivateInstructionParagraph: true },
];

async function main() {
  const payload = await getPayload({ config });

  for (const { id, slug, titleHtml, hasPrivateInstructionParagraph } of PAGES) {
    const page = await payload.findByID({ collection: "pages", id, depth: 0 });
    const raw = page.wpRawContent as string;

    const START_ANCHOR = `<h1 dir="auto" style="text-align: center"><span style="color: #ffffff">${titleHtml}</span></h1>`;
    const END_ANCHOR = hasPrivateInstructionParagraph
      ? `if above options don't work</span></p>\r\n[/vc_column_text]`
      : `Early Bird ends Sept 7, 2026</span></li>\r\n</ul>\r\n[/vc_column_text]`;
    const expectedColorSpans = hasPrivateInstructionParagraph ? 13 : 11;

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

    if (!segment.includes("Enrollment Steps") || !segment.includes("Upcoming Classes")) {
      console.error(`[${id}] ${slug}: segment doesn't look like the expected price/enrollment block - skipping.`);
      continue;
    }
    const colorSpanCount = (segment.match(/color: #ffffff"/g) || []).length;
    if (colorSpanCount !== expectedColorSpans) {
      console.error(`[${id}] ${slug}: expected ${expectedColorSpans} 'color: #ffffff"' occurrences, found ${colorSpanCount} - skipping.`);
      continue;
    }
    const liCount = (segment.match(/<li(?![^>]*color)/g) || []).length;
    if (liCount !== 4) {
      console.error(`[${id}] ${slug}: expected 4 <li> tags without their own color, found ${liCount} - skipping.`);
      continue;
    }

    let updatedSegment = segment.replace(/color: #ffffff"/g, `color: #ffffff !important"`);
    updatedSegment = updatedSegment.replace(
      /<li dir="auto" style="text-align: left">/g,
      `<li dir="auto" style="text-align: left; color: #ffffff !important">`
    );
    updatedSegment = updatedSegment.replace(/<li>/g, `<li style="color: #ffffff !important">`);

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
