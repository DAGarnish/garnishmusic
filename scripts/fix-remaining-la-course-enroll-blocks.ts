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

// Rolls out the same treatment already applied one-by-one to the DJ,
// Ableton Live, Logic Pro, and Synthesis & Sound Design course pages (ids
// 322, 329, 328, 327 - see move-dj-text-up.ts, fix-ableton-enroll-block.ts,
// fix-logic-pro-enroll-block.ts, fix-synthesis-enroll-block.ts) to every
// other LA "courses/*" page with the same price/enrollment block:
// 1. Inline `color: #ffffff` spans are overridden by globals.css's blanket
//    ".wpb_text_column ... { color: #000 !important }" rule, so make the
//    inline color win with an inline `!important`.
// 2. Shift the block 32px higher (matching the total applied to the other
//    course pages) without moving the JOIN NOW button below it:
//    margin-top: -32px on the first [vc_column_text] pulls it (and
//    everything below, in normal flow) up 32px; margin-bottom: 32px on the
//    second gives that 32px back before the button, so only this block
//    moves.

type StandardFix = {
  pageId: number;
  slug: string;
  title: string; // course name as it appears before " (NN Hrs): "
  hours: number;
  tuition: number;
};

// The 8 pages sharing the exact DJ-course template: two h1s + "Enroll
// Now" h3, then a second block with "Enrollment Steps" h3 + two <p> lines.
const STANDARD_FIXES: StandardFix[] = [
  { pageId: 326, slug: "courses/fl-studio-production", title: "FL Studio Production", hours: 24, tuition: 2250 },
  { pageId: 323, slug: "courses/mixing-and-mastering-course", title: "Mixing and Mastering Course", hours: 24, tuition: 2250 },
  { pageId: 319, slug: "courses/songcraft-hit-songwriting", title: "SongCraft Hit Songwriting", hours: 48, tuition: 3550 },
  { pageId: 314, slug: "courses/studio-vocal-production", title: "Studio Vocal Production", hours: 24, tuition: 2250 },
  { pageId: 310, slug: "courses/composing-and-media-scoring", title: "Composing and Media Scoring", hours: 24, tuition: 2250 },
  { pageId: 306, slug: "courses/advanced-mastering", title: "Advanced Mastering", hours: 24, tuition: 2250 },
  { pageId: 298, slug: "courses/k-pop-hitmaker", title: "K-Pop Hitmaker", hours: 24, tuition: 2250 },
  { pageId: 297, slug: "courses/hip-hop-production", title: "Hip Hop Production", hours: 24, tuition: 2250 },
  { pageId: 292, slug: "courses/art-of-remix", title: "Art of Remix", hours: 24, tuition: 2250 },
];

function buildStandardBlocks(fix: StandardFix) {
  const marginTopClass = `.vc_custom_1770${fix.pageId}001111`;
  const marginBottomClass = `.vc_custom_1770${fix.pageId}002222`;

  const OLD_BLOCK =
    `[vc_column_text css=""]\r\n` +
    `<h1 style="text-align: center"><span style="color: #ffffff">${fix.title} (${fix.hours} Hrs): </span></h1>\r\n` +
    `<h1 style="text-align: center"><span style="color: #ffffff">$${fix.tuition} Tuition + $300 Registration Fee</span></h1>\r\n` +
    `<h3 class="p1" style="text-align: center"><span style="color: #ffffff">**Enroll Now—max 8 spots!**</span></h3>\r\n` +
    `[/vc_column_text][vc_empty_space][vc_column_text css=""]\r\n` +
    `<h3 style="text-align: left"><span style="color: #ffffff">Enrollment Steps</span></h3>\r\n` +
    `<p style="text-align: left"><span style="color: #ffffff">1. Pay $300 Registration Fee to reserve. Typically Tue/Thu or Thu/Sat—Ask for schedule options.</span></p>\r\n` +
    `<p style="text-align: left"><span style="color: #ffffff">2. Pay tuition $${fix.tuition} to enroll, get welcome packet. All major credit cards accepted.</span></p>\r\n` +
    `[/vc_column_text][vc_empty_space][vc_column_text css="" el_class="bt"]`;

  const NEW_BLOCK =
    `[vc_column_text css="${marginTopClass}{margin-top: -32px !important;}"]\r\n` +
    `<h1 style="text-align: center"><span style="color: #ffffff !important">${fix.title} (${fix.hours} Hrs): </span></h1>\r\n` +
    `<h1 style="text-align: center"><span style="color: #ffffff !important">$${fix.tuition} Tuition + $300 Registration Fee</span></h1>\r\n` +
    `<h3 class="p1" style="text-align: center"><span style="color: #ffffff !important">**Enroll Now—max 8 spots!**</span></h3>\r\n` +
    `[/vc_column_text][vc_empty_space][vc_column_text css="${marginBottomClass}{margin-bottom: 32px !important;}"]\r\n` +
    `<h3 style="text-align: left"><span style="color: #ffffff !important">Enrollment Steps</span></h3>\r\n` +
    `<p style="text-align: left"><span style="color: #ffffff !important">1. Pay $300 Registration Fee to reserve. Typically Tue/Thu or Thu/Sat—Ask for schedule options.</span></p>\r\n` +
    `<p style="text-align: left"><span style="color: #ffffff !important">2. Pay tuition $${fix.tuition} to enroll, get welcome packet. All major credit cards accepted.</span></p>\r\n` +
    `[/vc_column_text][vc_empty_space][vc_column_text css="" el_class="bt"]`;

  return { OLD_BLOCK, NEW_BLOCK };
}

// courses/pro-tools-course (id 325) doesn't follow the standard template
// above (different h1/p structure, and a real U+00A0 non-breaking space in
// its copy that a hand-typed literal block can't reliably reproduce) -
// handled separately in fix-pro-tools-enroll-block.ts via anchor + segment
// replacement instead of a single literal block.

async function applyFix(payload: Awaited<ReturnType<typeof getPayload>>, pageId: number, oldBlock: string, newBlock: string) {
  const page = await payload.findByID({ collection: "pages", id: pageId, depth: 0 });
  const raw = page.wpRawContent as string;

  const occurrences = raw.split(oldBlock).length - 1;
  if (occurrences !== 1) {
    console.error(`[${pageId}] Expected exactly 1 anchor match, found ${occurrences} - skipping.`);
    return false;
  }

  const updated = raw.replace(oldBlock, newBlock);

  await payload.update({
    collection: "pages",
    id: pageId,
    data: { wpRawContent: updated },
  });

  console.log(`[${pageId}] Updated`);
  return true;
}

async function main() {
  const payload = await getPayload({ config });

  for (const fix of STANDARD_FIXES) {
    const { OLD_BLOCK, NEW_BLOCK } = buildStandardBlocks(fix);
    await applyFix(payload, fix.pageId, OLD_BLOCK, NEW_BLOCK);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
