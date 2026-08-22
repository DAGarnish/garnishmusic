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

// mia's /courses/ableton-live-course/ -> product/ableton-production (see
// COURSE_SCHEDULE_PAGES in app/(frontend)/[[...slug]]/page.tsx).
const PRODUCT_ID = 77;
const EXPECTED_SHA256 = "c8619b1ad8aad635831579bf97988814a175ad4b74a240b0f866ddb619d65208";

// Adds a "balance due before start date" line to the early-bird/repeat-
// student discount blurb, splitting it into its own sentence between the
// early-bird clause and the repeat-course discount clause.
const OLD_TEXT =
  "Get your Early Bird discount if you enroll more than 14 days before class, plus an additional $100 off for each course previously taken with us. Contact us if you have questions.";
const NEW_TEXT =
  "Get your Early Bird discount if you enroll more than 14 days before class. Balance to be paid before the start date, Get an additional $100 off for each course previously taken with us. Contact us if you have questions.";

async function main() {
  const payload = await getPayload({ config });
  const doc = await payload.findByID({ collection: "products", id: PRODUCT_ID, depth: 0 });
  const raw = (doc as any).wpRawContent as string;

  const actualSha256 = crypto.createHash("sha256").update(raw).digest("hex");
  if (actualSha256 !== EXPECTED_SHA256) {
    console.error("Product content has changed since this script was written - aborting.");
    console.error(`expected sha256 ${EXPECTED_SHA256}, got ${actualSha256}`);
    process.exit(1);
  }

  const occurrences = raw.split(OLD_TEXT).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 occurrence of the discount blurb, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.split(OLD_TEXT).join(NEW_TEXT);

  await payload.update({
    collection: "products",
    id: PRODUCT_ID,
    data: { wpRawContent: updated },
  });

  console.log("Added balance-due-before-start-date note to product", PRODUCT_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
