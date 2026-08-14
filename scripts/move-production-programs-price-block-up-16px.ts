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

// Same 16px-up treatment already given to the course pages' price boxes
// (see move-dj-price-block-up.ts) - margin-top: -16px on the first
// [vc_column_text] of a box pulls its text (and everything after it, in
// normal flow) up 16px; margin-bottom: 16px on the box's last text block
// gives that 16px back, so the shift stays local to the box (the JOIN
// button in box 1 stays put, and box 2's shift doesn't ripple into the
// next section down the page).
//
// Each Production Programs page has two such boxes:
//   Box 1 (dark background): title/price/"Next Batch" -> "Apply by"/
//     "Registration Closes" -> JOIN button (untouched)
//   Box 2 (BOWL-BLUR-2 background): "Enrollment Steps" -> "Upcoming
//     Classes" (untouched, middle) -> "Let's discuss Private
//     Instruction..." (only present on 4 of the 5 pages)
const PAGES = [
  { id: 1357, slug: "la-music-production-academy", titleHtml: "Los Angeles 360° Music Academy (360 hours, 1 year)", hasPrivateInstructionParagraph: true },
  { id: 1374, slug: "programs/ableton-production-program", titleHtml: "Ableton Production Program (120 hours)", hasPrivateInstructionParagraph: false },
  { id: 1373, slug: "programs/logic-production-program", titleHtml: "Logic Production Program (120 hours)", hasPrivateInstructionParagraph: true },
  { id: 1353, slug: "songcraft-production-program", titleHtml: "SongCraft Production Program (120 hours)", hasPrivateInstructionParagraph: true },
  { id: 1331, slug: "dj-production-program", titleHtml: "DJ Production Program (144 Hours)", hasPrivateInstructionParagraph: true },
];

const EMPTY_TAG = `[vc_column_text css=""]`;

// Splits `segment` on the bare EMPTY_TAG and rebuilds it, replacing the
// occurrence at 1-based index `marginTopAt` with a margin-top: -16px tag
// and the occurrence at `marginBottomAt` with a margin-bottom: 16px tag.
// Every other occurrence (e.g. the JOIN button's, or "Upcoming Classes"
// sitting untouched in the middle) is left exactly as-is.
function shiftBlock(segment: string, marginTopAt: number, marginBottomAt: number, idTag: string): string {
  const parts = segment.split(EMPTY_TAG);
  const occurrences = parts.length - 1;
  if (occurrences < Math.max(marginTopAt, marginBottomAt)) {
    throw new Error(`Expected at least ${Math.max(marginTopAt, marginBottomAt)} '${EMPTY_TAG}' occurrences, found ${occurrences}`);
  }
  let result = parts[0];
  for (let i = 1; i <= occurrences; i++) {
    if (i === marginTopAt) {
      result += `[vc_column_text css=".vc_custom_${idTag}top{margin-top: -16px !important;}"]`;
    } else if (i === marginBottomAt) {
      result += `[vc_column_text css=".vc_custom_${idTag}bot{margin-bottom: 16px !important;}"]`;
    } else {
      result += EMPTY_TAG;
    }
    result += parts[i];
  }
  return result;
}

async function main() {
  const payload = await getPayload({ config });

  for (const { id, slug, titleHtml, hasPrivateInstructionParagraph } of PAGES) {
    const page = await payload.findByID({ collection: "pages", id, depth: 0 });
    const raw = page.wpRawContent as string;

    // Box 1
    const box1Start = `${EMPTY_TAG}\r\n<h1 dir="auto" style="text-align: center"><span style="color: #ffffff !important">${titleHtml}</span></h1>`;
    const box1End = `[/vc_column_text][vc_empty_space height="64px"][/vc_column_inner]`;

    const box1StartOccurrences = raw.split(box1Start).length - 1;
    if (box1StartOccurrences !== 1) {
      console.error(`[${id}] ${slug}: box1 start anchor found ${box1StartOccurrences} times - skipping.`);
      continue;
    }
    const box1StartIdx = raw.indexOf(box1Start);
    const box1EndIdx = raw.indexOf(box1End, box1StartIdx) + box1End.length;

    let box1Segment = raw.slice(box1StartIdx, box1EndIdx);
    try {
      box1Segment = shiftBlock(box1Segment, 1, 2, `179${id}b1`);
    } catch (e) {
      console.error(`[${id}] ${slug}: box1 - ${(e as Error).message} - skipping.`);
      continue;
    }

    // Box 2
    const box2Start = `${EMPTY_TAG}\r\n<h2 style="text-align: left"><span style="color: #ffffff !important">Enrollment Steps (1-2-3)</span></h2>`;
    const box2End = hasPrivateInstructionParagraph
      ? `if above options don't work</span></p>\r\n[/vc_column_text]`
      : `Early Bird ends Sept 7, 2026</span></li>\r\n</ul>\r\n[/vc_column_text]`;

    const box2StartOccurrences = raw.split(box2Start).length - 1;
    if (box2StartOccurrences !== 1) {
      console.error(`[${id}] ${slug}: box2 start anchor found ${box2StartOccurrences} times - skipping.`);
      continue;
    }
    const box2StartIdx = raw.indexOf(box2Start);
    const box2EndIdx = raw.indexOf(box2End, box2StartIdx) + box2End.length;

    let box2Segment = raw.slice(box2StartIdx, box2EndIdx);
    const box2LastOccurrence = hasPrivateInstructionParagraph ? 3 : 2;
    try {
      box2Segment = shiftBlock(box2Segment, 1, box2LastOccurrence, `179${id}b2`);
    } catch (e) {
      console.error(`[${id}] ${slug}: box2 - ${(e as Error).message} - skipping.`);
      continue;
    }

    const updated =
      raw.slice(0, box1StartIdx) +
      box1Segment +
      raw.slice(box1EndIdx, box2StartIdx) +
      box2Segment +
      raw.slice(box2EndIdx);

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
