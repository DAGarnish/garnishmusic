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

// la homepage ("locations" page, wpPostId matches la's homepageWpId).
const PAGE_ID = 1385;
const EXPECTED_SHA256 = "e28b13074d3121645fb91fef981ba17d6c976eeff34c44d5e196ed7b643b3a62";

// "Enroll Now: LA Academy Oct 5 / Spots Limited! / Registration closes
// Sept 21, Early Bird ends Sept 7" was a brownish-orange (#993300) -
// requested in red. #ce1713 matches the brand red used elsewhere on the
// site (e.g. the partners section background, course-schedule accordion).
const OLD_TEXT = "#993300";
const NEW_TEXT = "#ce1713";

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

  console.log("Recolored 'Enroll Now' banner red on page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
