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

// mia's Spanish DJ course - courses/curso-de-dj-espanol maps to this
// product (see COURSE_SCHEDULE_PAGES in app/(frontend)/[[...slug]]/page.tsx).
const PRODUCT_ID = 69;
const EXPECTED_SHA256 = "eb3343ae01156a3c41beb990689dac27a03b246ca3e928aa7647b4b2e2eebe3c";

// Removes the trailing "repeat student discount" note along with the six
// blank "&nbsp;" lines that were padding it away from the schedule above -
// that gap is what made the note look like a stray afterthought rather than
// part of the schedule block.
const OLD_TEXT =
  ')</p>\n&nbsp;\n\n&nbsp;\n\n&nbsp;\n\n&nbsp;\n\n&nbsp;\n\n&nbsp;\n<p style="text-align: center">Si ha tomado un curso previo con nosotros tendrá $100 de descuento. Contáctenos para más información.</p>';
const NEW_TEXT = ")</p>";

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
    console.error(`Expected exactly 1 occurrence, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.split(OLD_TEXT).join(NEW_TEXT);
  await payload.update({ collection: "products", id: PRODUCT_ID, data: { wpRawContent: updated } });
  console.log("Removed repeat-student discount note and its padding from product", PRODUCT_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
