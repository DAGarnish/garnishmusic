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

// la homepage ("locations" page). Follow-up to
// color-la-enroll-now-banner-red.ts: that swapped #993300 for #ce1713, but
// the sitewide ".wpb_text_column span { color: rgb(0,0,0) !important; }"
// rule (app_globals css) still beat the plain inline color, so it kept
// rendering black. Adding !important to the inline declaration wins,
// same fix pattern as every other inline-vs-sitewide-!important case here.
const PAGE_ID = 1385;
const EXPECTED_SHA256 = "5d9ae941fd71c8fff74d3b101cdd6ac83bdc0af943e2cc70cdb634b27d5aa5a6";

const OLD_TEXT = "color: #ce1713";
const NEW_TEXT = "color: #ce1713 !important";

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const actualSha256 = crypto.createHash("sha256").update(raw).digest("hex");
  if (actualSha256 !== EXPECTED_SHA256) {
    console.error("Page content has changed since this script was written - aborting.");
    console.error(`expected sha256 ${EXPECTED_SHA256}, got ${actualSha256}`);
    process.exit(1);
  }

  const occurrences = raw.split(OLD_TEXT).length - 1;
  if (occurrences !== 3) {
    console.error(`Expected exactly 3 occurrences of "${OLD_TEXT}", found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.split(OLD_TEXT).join(NEW_TEXT);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: updated },
  });

  console.log("Added !important to 'Enroll Now' banner red color on page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
