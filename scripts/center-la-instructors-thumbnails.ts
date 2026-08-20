import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

const PAGE_ID = 1351; // la site "music-production-instructors-los-angeles"

// Baseline this script edits from - the content left by
// adjust-la-instructors-thumbnail-crop.ts.
const EXPECTED_SHA256 = "d86c7d944ea6988e8627fb0a01e9d8393973902a43178191e360315b57d69349";
const NEW_RAW_CONTENT = fs.readFileSync(path.resolve(dirname, "tidy-la-instructors-new-content.html"), "utf-8");

// Why the photo looked "raised" on some cards and "stuck to the bottom" on
// others: each card's image lived floated *inside* the <h1> (before the
// name text), with the name/title/credits/etc as separate block siblings
// after it - not a true sibling of a text column. WPBakery's column
// wrapper (`.wpb_column.bg-1`) also has a fixed ~87px gap above that h1
// (from the theme's own column-inner spacing) that never varies. Since a
// floated image doesn't contribute to its container's height, the card's
// total height was set by whichever was taller - the 300px photo, or the
// text block - while the photo itself always stayed pinned at that same
// 87px-from-top offset. Short bios -> card only as tall as the photo -> photo
// flush to the card's bottom edge ("stuck to the bottom"). Long bios (Matt
// Bang's 4-line credit list, etc) -> card grows well past 300px -> photo
// stranded near the top with growing empty space below it ("raised").
//
// Fix: restructure each card so the photo and the text block are true flex
// siblings (`.instructor-card-flex`, align-items: center) instead of a
// float buried inside the heading. That vertically centers the fixed
// 300x300 photo against the text column's actual height, whatever it ends
// up being - no more hard-coded offset, so nothing can end up "stuck" to
// either edge.
//
// Also addresses the mobile ask ("equal distance between photo and bio
// title"): when the flex row wraps to a stacked column on narrow screens,
// the gap between the photo and the text block is the flex `gap` (24px),
// and the name (<h1>) now has margin: 0 0 24px 0 - so the name sits
// exactly 24px below the photo and exactly 24px above the title on both
// sides, instead of hugging the photo with the title crowded right under it.
const NEW_CUSTOM_CSS = `.instructor-card-flex { display: flex; align-items: center; flex-wrap: wrap; gap: 24px 32px; }
.instructor-thumb { width: 300px; max-width: 100%; aspect-ratio: 1 / 1; height: auto; object-fit: cover; display: block; float: none; flex: 0 0 auto; }
.instructor-card-text { flex: 1 1 320px; min-width: 260px; }`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const actualSha256 = crypto.createHash("sha256").update(raw).digest("hex");
  if (actualSha256 !== EXPECTED_SHA256) {
    console.error("Page content has changed since this script was written - aborting to avoid clobbering it.");
    console.error(`expected sha256 ${EXPECTED_SHA256}, got ${actualSha256}`);
    process.exit(1);
  }

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: NEW_RAW_CONTENT, customCss: NEW_CUSTOM_CSS },
  });

  console.log("Centered instructor thumbnails on page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
