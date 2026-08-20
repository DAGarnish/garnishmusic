import { getPayload } from "payload";
import config from "../payload.config";

const PAGE_ID = 160; // ny site, product/electronic-dj-class

// This page's background-image url()s still point at the old WordPress
// domain (ny.garnishmusicproduction.com/wp-content/uploads/...), which now
// 404s because that domain serves this same Next.js app in production - the
// referenced files were already migrated into the Media collection (see
// their matching wpSourceUrl fields), just never rewritten in this page's
// content, unlike every other migrated page which links /api/media/file/...
const REPLACEMENTS: [string, string][] = [
  [
    "'https://ny.garnishmusicproduction.com/wp-content/uploads/sites/9/2024/05/8O2A6671-scaled.jpg'",
    "'/api/media/file/8O2A6671-scaled.jpg'",
  ],
  [
    "'https://ny.garnishmusicproduction.com/wp-content/uploads/sites/9/2024/05/DSC2850-scaled.jpg?id=22485'",
    "'/api/media/file/DSC2850-scaled.jpg'",
  ],
  [
    "'https://ny.garnishmusicproduction.com/wp-content/uploads/sites/9/2024/05/DJ-Live-scaled.jpeg?id=22486'",
    "'/api/media/file/DJ-Live-scaled-1.jpeg'",
  ],
  [
    "'https://edu.garnishmusicproduction.com/wp-content/uploads/sites/8/2025/03/IMG_7473-1-scaled.jpg?id=22488'",
    "'/api/media/file/IMG_7473-1-scaled-4.jpg'",
  ],
  [
    "'https://ny.garnishmusicproduction.com/wp-content/uploads/sites/9/2024/05/DSC00601-scaled.jpg?id=22487'",
    "'/api/media/file/DSC00601-scaled.jpg'",
  ],
];

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "products", id: PAGE_ID, depth: 0 });
  let raw = (page as any).wpRawContent as string;

  for (const [oldUrl, newUrl] of REPLACEMENTS) {
    const occurrences = raw.split(oldUrl).length - 1;
    if (occurrences !== 1) {
      console.error(`Expected exactly 1 match for ${oldUrl}, found ${occurrences} - aborting.`);
      process.exit(1);
    }
    raw = raw.replace(oldUrl, newUrl);
  }

  await payload.update({
    collection: "products",
    id: PAGE_ID,
    data: { wpRawContent: raw },
  });

  console.log("Updated product page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
