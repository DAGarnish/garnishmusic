import { getPayload } from "payload";
import config from "../payload.config";

// la's contact page (id 2264, slug contact-map - see
// scripts/make-contact-map-la-contact-page.ts) has a [mkd_button] CTA added
// by scripts/add-la-contact-cta.ts; ModernContactPage renders its "text"
// attribute verbatim as the button label (see lib/modern-contact-content.ts
// extractContactDetails). Request: relabel it "Apply here" (link unchanged).
async function main() {
  const payload = await getPayload({ config });
  const PAGE_ID = 2264;

  const doc = (await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 })) as any;
  const OLD = '[mkd_button text="Send Us a Message" link="https://edu.garnishmusicproduction.com/connect/"]';
  const NEW = '[mkd_button text="Apply here" link="https://edu.garnishmusicproduction.com/connect/"]';

  const occurrences = doc.wpRawContent.split(OLD).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = doc.wpRawContent.replace(OLD, NEW);
  await payload.update({ collection: "pages", id: PAGE_ID, data: { wpRawContent: updated } });
  console.log("updated page", PAGE_ID);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
