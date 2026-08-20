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

// Snapshot taken before this edit (see /tmp/la-instructors-raw2.html at the
// time this script was written) - guards against clobbering a concurrent
// edit to the page between then and now.
const EXPECTED_SHA256 = fs.readFileSync(path.resolve(dirname, "tidy-la-instructors-expected.sha256"), "utf-8").trim();
const NEW_RAW_CONTENT = fs.readFileSync(path.resolve(dirname, "tidy-la-instructors-new-content.html"), "utf-8");

// All 29 instructor cards were regenerated from one canonical template to
// fix: three different image-linking patterns (some photos linked to the
// bio page, some to a raw uploaded file, one had no link at all), two
// broken entries with stray empty/duplicate <h1> tags (K(Sotomayor), Marie
// Klausmeyer had 3 separate <h1>s each), leftover paste artifacts
// (Apple-converted-space spans, a Twitter "css-1jxf684..." span wrapping
// Sandra Cucho's credits, redundant color:#000000 spans on Marianna
// Matyja's paragraphs), stray RTL/LTR marks at the start of ~8 titles,
// double spaces after "Credits:"/"Specialities:" on a few entries, and a
// missing space in Orion Navaille's title ("Mixing&amp; Mastering").
// Thumbnails vary from 200x300 to 300x300 to 254x198 natively - rather than
// re-cropping every source image, every <img> now also gets a shared
// "instructor-thumb" class forcing a uniform 300x300 box via the page's
// customCss below.
const NEW_CUSTOM_CSS = `.instructor-thumb { width: 300px !important; height: 300px !important; object-fit: cover !important; }`;

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

  console.log("Tidied up page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
