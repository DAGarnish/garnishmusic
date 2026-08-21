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

const PAGE_ID = 1451; // edu homepage
const EXPECTED_SHA256 = "4493597ba67432d5967d6663b0229c3ed357672556a3326d997721d0d2646b82";

// The "Some of our partners" row is missing the "margin-top: -30px !important"
// override that every other vc_row on this page uses to cancel out the
// sitewide ".mkd-section, .vc_row { margin-top: 16px }" rule - so it's the
// only row on the page with a visible white gap above it (between it and the
// previous section). Match the override the other rows already use.
const OLD_TEXT =
  'vc_custom_1741773108194{padding-top: 30px !important;background-color: #CE1713 !important;}';
const NEW_TEXT =
  'vc_custom_1741773108194{margin-top: -30px !important;padding-top: 30px !important;background-color: #CE1713 !important;}';

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
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 occurrence of "${OLD_TEXT}", found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.split(OLD_TEXT).join(NEW_TEXT);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: updated },
  });

  console.log("Removed white gap above the partners section on page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
