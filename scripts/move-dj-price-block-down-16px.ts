import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const PAGE_ID = 322; // la site "courses/dj-course"

// Ease back 16px of the -80px shift from move-dj-price-block-up-32px-again.ts,
// so the price/enrollment block is now 64px higher than its original
// position (16 - 32 - 32 + 16), while the JOIN NOW button below it stays put
// (see move-dj-price-block-up.ts's comment for why the margin-top/
// margin-bottom pair is used).
const OLD_FIRST = `.vc_custom_1770000001111{margin-top: -80px !important;}`;
const NEW_FIRST = `.vc_custom_1770000001111{margin-top: -64px !important;}`;

const OLD_SECOND = `.vc_custom_1770000002222{margin-bottom: 80px !important;}`;
const NEW_SECOND = `.vc_custom_1770000002222{margin-bottom: 64px !important;}`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  for (const [old, label] of [
    [OLD_FIRST, "first"],
    [OLD_SECOND, "second"],
  ] as const) {
    const occurrences = raw.split(old).length - 1;
    if (occurrences !== 1) {
      console.error(`Expected exactly 1 match for ${label} anchor, found ${occurrences} - aborting.`);
      process.exit(1);
    }
  }

  const updated = raw.replace(OLD_FIRST, NEW_FIRST).replace(OLD_SECOND, NEW_SECOND);

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
