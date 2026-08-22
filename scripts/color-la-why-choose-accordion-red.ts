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

// la homepage ("locations" page). Adds color_style="red" to the "Why Choose
// Garnish?" [mkd_accordion], which wp-shortcode-render.ts now maps to the
// mkd-accordion-red marker class - LegacyAccordionUpgrade reads that and
// swaps in the Accordion component's new "red" variant (solid red trigger
// bar, white title + arrow) - see components/ui/Accordion.tsx.
const PAGE_ID = 1385;
const EXPECTED_SHA256 = "0d1bfd0cb2b204bf067eaceb35f363dc8f9eea2e896463282274979857956a35";

const OLD_TEXT = '[mkd_accordion style="accordion"][mkd_accordion_tab title="Why Choose Garnish?" title_tag="h2"]';
const NEW_TEXT = '[mkd_accordion style="accordion" color_style="red"][mkd_accordion_tab title="Why Choose Garnish?" title_tag="h2"]';

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

  console.log("Set 'Why Choose Garnish?' accordion to red variant on page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
