import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

// fix-express-courses-accordion-surroundings.ts added !important to the
// OUTER heading span's color, but these two pages nest a second
// <span style="letter-spacing: -0.02em">Syllabus</span> INSIDE it with no
// color of its own. globals.css's ".wpb_text_column span { color: #000
// !important }" matches that inner span directly (not via inheritance
// from the parent's inline color), so "Syllabus" stayed black even after
// the outer-span fix. Give the inner span its own !important white color.
const PAGES = [
  {
    id: 328,
    slug: "courses/logic-pro-course",
    oldSpan: `<span style="letter-spacing: -0.02em">Syllabus</span></span></h2>`,
    newSpan: `<span style="letter-spacing: -0.02em; color: #ffffff !important">Syllabus</span></span></h2>`,
  },
  {
    id: 327,
    slug: "courses/synthesis-and-sound-design",
    oldSpan: `<span style="letter-spacing: -0.02em">Syllabus</span></span></h2>`,
    newSpan: `<span style="letter-spacing: -0.02em; color: #ffffff !important">Syllabus</span></span></h2>`,
  },
];

async function main() {
  const payload = await getPayload({ config });

  for (const { id, slug, oldSpan, newSpan } of PAGES) {
    const page = await payload.findByID({ collection: "pages", id, depth: 0 });
    const raw = page.wpRawContent as string;

    const occurrences = raw.split(oldSpan).length - 1;
    if (occurrences !== 1) {
      console.error(`[${id}] ${slug}: expected 1 match, found ${occurrences} - aborting.`);
      continue;
    }

    const updated = raw.replace(oldSpan, newSpan);

    await payload.update({
      collection: "pages",
      id,
      data: { wpRawContent: updated },
    });
    console.log(`Updated [${id}] ${slug}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
