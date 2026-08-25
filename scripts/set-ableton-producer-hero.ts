import { getPayload } from "payload";
import configPromise from "../payload.config";

const MODERN_ABLETON_SCREENSHOT_MEDIA_ID = 2632; // Ableton-Live-Screnshot.png, 3840x1970

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: "ableton-producer" } }] },
    limit: 1,
  });
  const doc: any = pages.docs[0];
  await payload.update({
    collection: "pages",
    id: doc.id,
    data: { titleBackgroundImage: MODERN_ABLETON_SCREENSHOT_MEDIA_ID },
  });
  console.log(`ableton-producer: titleBackgroundImage -> media #${MODERN_ABLETON_SCREENSHOT_MEDIA_ID}`);
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
