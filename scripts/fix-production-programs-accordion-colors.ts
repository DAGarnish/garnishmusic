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

// Same fix as fix-la-course-accordion-colors.ts, applied to the nav's
// "Production Programs" pages instead of "Express Courses": 360 Music
// Production Academy, Ableton Production Program, Logic Production
// Program, SongCraft Production Program, DJ Production Program. Each has
// a [mkd_accordion color_style="white"] syllabus block on a dark
// background photo, authored the same way (inline `color: #ffffff` spans,
// nested formatting-only <span class="css-1jxf684..."> wrappers, bare
// <strong> tags) that globals.css's
//   .wpb_text_column ... { color: #000 !important }
//   .mkd-accordion-content, .mkd-accordion-content * { color: #000 !important }
// rules paint black - the second rule matches every descendant directly,
// so nested spans/strong tags need their own inline override too, not
// just the outer span.
const PAGE_IDS = [1357, 1374, 1373, 1353, 1331];

type Block = { start: number; end: number; openTag: string };

function findAccordionBlocks(raw: string): Block[] {
  const blocks: Block[] = [];
  const openRe = /\[mkd_accordion(?:\s[^\]]*)?\]/g;
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(raw))) {
    const start = m.index;
    const closeIdx = raw.indexOf("[/mkd_accordion]", start);
    if (closeIdx === -1) continue;
    const end = closeIdx + "[/mkd_accordion]".length;
    blocks.push({ start, end, openTag: m[0] });
    openRe.lastIndex = end;
  }
  return blocks;
}

function fixSegment(segment: string): string {
  let updated = segment.replace(/color:\s*#ffffff(;)?"/g, (_match, semi) => `color: #ffffff !important${semi || ""}"`);
  updated = updated.replace(/<span class="(css-1jxf684[^"]*)">/g, `<span class="$1" style="color: #ffffff !important">`);
  updated = updated.replace(/<strong>/g, `<strong style="color: #ffffff !important">`);
  return updated;
}

async function main() {
  const payload = await getPayload({ config });

  for (const id of PAGE_IDS) {
    const page = await payload.findByID({ collection: "pages", id, depth: 0 });
    const raw = page.wpRawContent as string;
    const blocks = findAccordionBlocks(raw).filter((b) => /color_style="white"/.test(b.openTag));
    if (blocks.length === 0) {
      console.log(`[${id}] ${page.slug}: no white-styled accordion block found, skipping`);
      continue;
    }

    let changed = false;
    let result = "";
    let cursor = 0;
    for (const block of blocks) {
      const segment = raw.slice(block.start, block.end);
      const fixed = fixSegment(segment);
      if (fixed !== segment) changed = true;
      result += raw.slice(cursor, block.start) + fixed;
      cursor = block.end;
    }
    result += raw.slice(cursor);

    if (!changed) {
      console.log(`[${id}] ${page.slug}: already clean, skipping`);
      continue;
    }

    await payload.update({
      collection: "pages",
      id,
      data: { wpRawContent: result },
    });
    console.log(`[${id}] ${page.slug}: updated`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
