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

// Rolls the fix already applied by hand to courses/studio-vocal-production
// (see fix-studio-vocal-syllabus-color.ts and
// fix-studio-vocal-syllabus-nested-spans.ts) out to every other LA
// "courses/*" page's [mkd_accordion color_style="white"] block: these sit
// on a dark background photo and author their body copy with inline
// `color: #ffffff` spans, but globals.css's
//   .wpb_text_column, .wpb_text_column span, ... { color: #000 !important }
//   .mkd-accordion-content, .mkd-accordion-content * { color: #000 !important }
// wins over a plain (non-important) inline color, and even wins directly
// over bare <strong> tags nested inside an already-white span (a directly
// matched rule beats an inherited value regardless of the ancestor's
// importance). So every block needs 1) every `color: #ffffff` upgraded to
// `!important`, and 2) every bare <strong> given its own inline
// `color: #ffffff !important` too.

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
  updated = updated.replace(/<strong>/g, `<strong style="color: #ffffff !important">`);
  return updated;
}

async function main() {
  const payload = await getPayload({ config });
  const pagesQuery = await payload.find({
    collection: "pages",
    where: { site: { equals: 16 } },
    limit: 500,
    depth: 0,
  });

  const coursePages = pagesQuery.docs.filter(
    (p) => typeof p.slug === "string" && p.slug.startsWith("courses/")
  );

  for (const page of coursePages) {
    const raw = page.wpRawContent as string | undefined;
    if (!raw) continue;
    const blocks = findAccordionBlocks(raw).filter((b) => /color_style="white"/.test(b.openTag));
    if (blocks.length === 0) continue;

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
      console.log(`[${page.id}] ${page.slug}: already clean, skipping`);
      continue;
    }

    await payload.update({
      collection: "pages",
      id: page.id,
      data: { wpRawContent: result },
    });
    console.log(`[${page.id}] ${page.slug}: updated`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
