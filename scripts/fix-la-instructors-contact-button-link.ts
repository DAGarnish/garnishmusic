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

const PAGE_ID = 1351; // la site "music-production-instructors-los-angeles"

// The "CONTACT US" button pointed at the old los-angeles-la-contact-map
// URL - user confirmed that's wrong and gave the correct destination.
const OLD_TEXT = `<a class="btn-grand" href="https://la.garnishmusicproduction.com/los-angeles-la-contact-map/">CONTACT US</a>`;
const NEW_TEXT = `<a class="btn-grand" href="https://la.garnishmusicproduction.com/music-production-school-los-angeles-contact/">CONTACT US</a>`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const occurrences = raw.split(OLD_TEXT).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(OLD_TEXT, NEW_TEXT);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: updated },
  });

  console.log("Updated page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
