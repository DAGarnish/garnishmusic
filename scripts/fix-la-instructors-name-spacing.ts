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

const PAGE_ID = 1351; // la site "music-production-instructors-los-angeles"

// Content-only check (this script doesn't touch wpRawContent, only customCss).
const EXPECTED_WPRAWCONTENT_SHA256 = "ae92ecb2d71581cc255173a01ddd5dfe93180caae0be971197d5333987ae2e1a";

// center-la-instructors-thumbnails.ts set each name's <h1> to
// `margin: 0 0 24px 0` inline, meant to match the flex row's 24px gap so
// the name sits exactly as far from the photo above as from the title
// below. That got silently overridden: app/globals.css has a deliberate,
// sitewide `!important` rule -
//   .wpb-content-wrapper h1 { margin-top: 32px !important; margin-bottom: 32px !important; }
// (see the "Ensure 32px spacing for all H1s inside content wrappers"
// comment there) - which beats an inline non-important style regardless of
// specificity. That rule exists for other pages' section titles and
// shouldn't be touched; instead this overrides it just for our cards with
// a higher-specificity selector (still !important, since ties between two
// !importants go to source order, and specificity is the safer bet).
const NEW_CUSTOM_CSS = `.instructor-card-flex { display: flex; align-items: center; flex-wrap: wrap; gap: 24px 32px; }
.instructor-thumb { width: 300px; max-width: 100%; aspect-ratio: 1 / 1; height: auto; object-fit: cover; display: block; float: none; flex: 0 0 auto; }
.instructor-card-text { flex: 1 1 320px; min-width: 260px; }
.instructor-card-flex .instructor-card-text h1 { margin-top: 0 !important; margin-bottom: 24px !important; }`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const actualSha256 = crypto.createHash("sha256").update(raw).digest("hex");
  if (actualSha256 !== EXPECTED_WPRAWCONTENT_SHA256) {
    console.error("Page content has changed since this script was written - aborting.");
    console.error(`expected sha256 ${EXPECTED_WPRAWCONTENT_SHA256}, got ${actualSha256}`);
    process.exit(1);
  }

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { customCss: NEW_CUSTOM_CSS },
  });

  console.log("Fixed name spacing on page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
