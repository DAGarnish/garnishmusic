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
const EXPECTED_SHA256 = "ae92ecb2d71581cc255173a01ddd5dfe93180caae0be971197d5333987ae2e1a";

// "K(Sotomayor)" -> "K (Sotomayor)" - both the visible name (<h1>) and the
// photo's alt text. Her bio page's title field already reads "K (Sotomayor)"
// with the space; only the listing page's wpRawContent was missing it.
const OLD_TEXT = "K(Sotomayor)";
const NEW_TEXT = "K (Sotomayor)";

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
  if (occurrences !== 2) {
    console.error(`Expected exactly 2 occurrences of "${OLD_TEXT}", found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.split(OLD_TEXT).join(NEW_TEXT);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: updated },
  });

  console.log("Fixed K (Sotomayor) spacing on page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
