import { getPayload } from "payload";
import config from "../payload.config";

const PAGE_IDS = [1356, 1331, 322]; // classes, dj-production-program, courses/dj-course (all LA site 16)

const SWAPS: [string, string][] = [
  ["/api/media/file/DRAMATIC-DJ-Match-Color.png", "/api/media/file/DRAMATIC-DJ-Match-Color.webp"],
  ["/api/media/file/CDJs-Lit-Match-Color.png", "/api/media/file/CDJs-Lit-Match-Color.webp"],
  [
    "/api/media/file/DJ-GIRLL-Match-Color-40-1600x660.png",
    "/api/media/file/DJ-GIRLL-Match-Color-40-1600x660.webp",
  ],
  ["/api/media/file/Female-DJ-Blur-2.png", "/api/media/file/Female-DJ-Blur-2.webp"],
];

async function main() {
  const payload = await getPayload({ config });

  for (const id of PAGE_IDS) {
    const page = await payload.findByID({ collection: "pages", id, depth: 0 });
    let raw = page.wpRawContent as string;
    let changedCount = 0;

    for (const [oldUrl, newUrl] of SWAPS) {
      const occurrences = raw.split(oldUrl).length - 1;
      if (occurrences === 0) continue;
      raw = raw.split(oldUrl).join(newUrl);
      changedCount += occurrences;
      console.log(`page ${id} (${page.slug}): replaced ${occurrences}x ${oldUrl}`);
    }

    if (changedCount > 0) {
      await payload.update({ collection: "pages", id, data: { wpRawContent: raw } });
      console.log(`page ${id} (${page.slug}): updated, ${changedCount} total replacement(s)`);
    } else {
      console.log(`page ${id} (${page.slug}): no matches found`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
