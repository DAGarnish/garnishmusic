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

// Baseline this script edits from - the exact content written by the
// earlier tidy-la-instructors-page.ts run.
const EXPECTED_SHA256 = "cad604099070e3771fadebcb3cff19ab93eed1df58d43faf3551fa5c801f0dc6";

// .instructor-thumb (added by tidy-la-instructors-page.ts) forces every
// thumbnail into a 300x300 box via object-fit: cover. That's fine for the
// ~19 photos whose source file is already square - the whole image shows,
// nothing is cropped. But ~10 source photos are portrait or landscape
// crops (200x300 up to 300x217), so `cover` crops them - and by default
// crops equally from both edges (object-position: 50% 50%), which pushes
// several faces uncomfortably close to the top edge or chops hair/hats.
// The 4 landscape sources (LVMA BLACK, Sandra Cucho, Zhou, Igor
// Krasnienko) only get cropped left/right and are already well-centered
// horizontally in frame - default centering is fine there. The 6 portrait
// sources below get cropped top/bottom, and every one has its face in the
// upper third - so shift the crop window up (a lower object-position Y%
// keeps more of the top of the image and crops more from the bottom) so
// the face reads as centered in the 300x300 box instead of low/cramped.
// Percentages were derived per-photo from where the head/face actually
// sits in each source image (see conversation), not a single guess
// applied to all of them.
const CROP_ADJUSTMENTS: { src: string; objectPositionY: string }[] = [
  { src: "/api/media/file/KSotomayor-225x300.jpeg", objectPositionY: "20%" },
  { src: "/api/media/file/Marianna-Matyja-200x300.jpg", objectPositionY: "20%" },
  { src: "/api/media/file/Chinsaku-Instructor-FL-Studio-247x300.jpg", objectPositionY: "20%" },
  { src: "/api/media/file/Joseph-Immanuel-200x300.jpeg", objectPositionY: "25%" },
  { src: "/api/media/file/Taylor-Dubray-236x300.png", objectPositionY: "25%" },
  { src: "/api/media/file/ORION-BIO-PIC-225x300.jpg", objectPositionY: "15%" },
];

// Also make the box itself scale down gracefully (as a perfect square)
// instead of staying a hard 300px on very narrow viewports, so it can
// never force horizontal overflow.
const NEW_CUSTOM_CSS = `.instructor-thumb { width: 300px; max-width: 100%; aspect-ratio: 1 / 1; height: auto; object-fit: cover; display: block; }`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  let raw = page.wpRawContent as string;

  const actualSha256 = crypto.createHash("sha256").update(raw).digest("hex");
  if (actualSha256 !== EXPECTED_SHA256) {
    console.error("Page content has changed since this script was written - aborting to avoid clobbering it.");
    console.error(`expected sha256 ${EXPECTED_SHA256}, got ${actualSha256}`);
    process.exit(1);
  }

  for (const { src, objectPositionY } of CROP_ADJUSTMENTS) {
    const needle = `<img class="instructor-thumb alignleft`;
    // scope the search to the exact <img ... src="{src}" ...> tag
    const tagRegex = new RegExp(
      `<img class="instructor-thumb alignleft[^>]*src="${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*/>`
    );
    const m = raw.match(tagRegex);
    if (!m) {
      console.error(`Could not find thumbnail tag for ${src} - aborting.`);
      process.exit(1);
    }
    const original = m[0];
    if (original.includes("style=")) {
      console.error(`Unexpected existing style attribute on ${src} - aborting.`);
      process.exit(1);
    }
    const updated = original.replace(
      '<img class="instructor-thumb alignleft',
      `<img style="object-position: 50% ${objectPositionY};" class="instructor-thumb alignleft`
    );
    const occurrences = raw.split(original).length - 1;
    if (occurrences !== 1) {
      console.error(`Expected exactly 1 match for ${src}'s tag, found ${occurrences} - aborting.`);
      process.exit(1);
    }
    raw = raw.replace(original, updated);
  }

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: raw, customCss: NEW_CUSTOM_CSS },
  });

  console.log("Adjusted thumbnail crop positioning on page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
