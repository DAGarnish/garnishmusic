import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

// The "call-action-la-content-row2" box that CourseScheduleDisclosure
// portals the schedule accordion into (see COURSE_SCHEDULE_PAGES in
// app/(frontend)/[[...slug]]/page.tsx) sits inside its own [vc_row
// content_width="grid" css=".vc_custom_1735819130193{margin-top: 50px
// !important;}"] wrapper (duplicated once per desktop/mobile column, plus a
// couple of pages with an extra stray copy). wp-shortcode-render.ts's vc_row
// renderer (see the margin-top/margin-bottom regex around line 636)
// deliberately normalizes any of {32,50,60,64,70,80}px down to 16px, so this
// renders as a 16px top margin regardless of the source's 50px - that's the
// visible gap above the accordion box. Rewriting the source to 0px (a value
// the regex doesn't match) bypasses that normalization and removes the gap
// outright, without touching the shared regex used by every other row.
//
// Excludes the visually-similar-looking "gap-top-rm" (Instructors section)
// and summer-camp-school's "blured-images-wrapper" rows, which reuse the
// same vc_custom_1735819130193 class name by coincidence (stale WPBakery
// build id) but wrap unrelated content - matched precisely by anchoring on
// the exact byte sequence up to the immediately-following "[vc_column]",
// which only the accordion-wrapping rows have (the other two carry an
// el_class attribute in between).
const OLD_TEXT = '[vc_row content_width="grid" css=".vc_custom_1735819130193{margin-top: 50px !important;}"][vc_column]';
const NEW_TEXT = '[vc_row content_width="grid" css=".vc_custom_1735819130193{margin-top: 0px !important;}"][vc_column]';

const PAGES: { id: number; slug: string; sha256: string; expectedOccurrences: number }[] = [
  { id: 250, slug: "courses/ableton-live-course", sha256: "d39c1a74d3ec74062185a6f4f6ae5ecf3905d5134153c3e33fb12f3e89603419", expectedOccurrences: 2 },
  { id: 249, slug: "courses/logic-course", sha256: "a4671c9a1e72313b86df7c2f58d6288da26b703a60a866dd8c06b5e1edc87773", expectedOccurrences: 3 },
  { id: 243, slug: "courses/electronic-dj-course", sha256: "3f42bf122a45b7fbaea9f0e6b57f776e5f2915110382d278f18911bbeefa8cf9", expectedOccurrences: 1 },
  { id: 239, slug: "courses/summer-camp-school", sha256: "45cd3f7cf4b9856b2a2dcf7a3b3f42117216875da9a2258660e5b36dd842efec", expectedOccurrences: 1 },
  { id: 1309, slug: "programs/ableton-producer-program", sha256: "62bc85130235fb64c2b49a1b0787d8b976d47b96262ed670a880011bddfda4ac", expectedOccurrences: 2 },
  { id: 1308, slug: "programs/logic-producer-program", sha256: "7a5787103a51b959a24633c91dbd1f72c1d85a307611e5a395a899b60ed7b0e0", expectedOccurrences: 2 },
  { id: 242, slug: "courses/curso-de-dj-espanol", sha256: "c32f4ebdeae5d5ad2c8212a2997c747456bd98019bc0611dc66c23c7249950bf", expectedOccurrences: 1 },
];

async function main() {
  const payload = await getPayload({ config });

  for (const p of PAGES) {
    const doc = await payload.findByID({ collection: "pages", id: p.id, depth: 0 });
    const raw = (doc as any).wpRawContent as string;

    const actualSha256 = crypto.createHash("sha256").update(raw).digest("hex");
    if (actualSha256 !== p.sha256) {
      console.error(`[${p.slug} ${p.id}] content changed since script was written - skipping.`);
      console.error(`  expected sha256 ${p.sha256}, got ${actualSha256}`);
      continue;
    }

    const occurrences = raw.split(OLD_TEXT).length - 1;
    if (occurrences !== p.expectedOccurrences) {
      console.error(`[${p.slug} ${p.id}] expected ${p.expectedOccurrences} occurrence(s), found ${occurrences} - skipping.`);
      continue;
    }

    const updated = raw.split(OLD_TEXT).join(NEW_TEXT);
    await payload.update({ collection: "pages", id: p.id, data: { wpRawContent: updated } });
    console.log(`[${p.slug} ${p.id}] removed margin from ${occurrences} accordion-box row(s).`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
