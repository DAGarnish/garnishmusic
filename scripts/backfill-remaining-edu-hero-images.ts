import { getPayload } from "payload";
import fs from "fs";
import config from "../payload.config";

const SCRATCH =
  "/tmp/claude-1000/-home-abhises-Desktop-davemusic-garnishmusic-headless/80044343-6915-4d50-a1d8-8b6c2fd8bb41/scratchpad/hero-images";

const EDU_SITE_ID = 15;

// Pages that use the theme-wide default background (already uploaded as
// media id 3879 in the earlier courses backfill pass) - reuse it rather
// than re-uploading the same file.
const TYPEWRITER_MEDIA_ID = 3879;
const TYPEWRITER_PAGE_IDS = [
  1456, 1455, 1454, 1445, 1444, 1437, 1435, 1429, 1424, 1421, 1420, 1419, 1418,
  1415, 1414, 1411, 1410, 1409, 1408, 1401, 1400, 1399, 1398, 1395, 1393,
];

// Logic-Producer-Program.png was already uploaded as media id 3874 for the
// courses/logic-pro backfill - reuse for these two program pages too.
const LOGIC_PRODUCER_MEDIA_ID = 3874;
const LOGIC_PRODUCER_PAGE_IDS = [1442, 1432]; // programs/logic-producer, programs/summer-camp

// New unique images not covered by the courses backfill.
const NEW_IMAGES: Array<{
  file: string;
  mimeType: string;
  alt: string;
  wpSourceUrl: string;
  pageIds: number[];
}> = [
  {
    file: "services-title-area-img.jpg",
    mimeType: "image/jpeg",
    alt: "Services",
    wpSourceUrl: "http://buro.mikado-themes.com/wp-content/uploads/2016/09/Services-title-area-img.jpg",
    pageIds: [1453], // services
  },
  {
    file: "ableton-live-10-production-course-2.jpg",
    mimeType: "image/jpeg",
    alt: "Ableton Live 10 Production Course",
    wpSourceUrl: "https://la.garnishmusicproduction.com/wp-content/uploads/2018/04/Ableton-Live-10-production-course-2.jpg",
    pageIds: [1447, 1446], // cart, checkout
  },
  {
    file: "ableton-live-10-release-3-web.jpg",
    mimeType: "image/jpeg",
    alt: "Ableton Live 10",
    wpSourceUrl: "https://la.garnishmusicproduction.com/wp-content/uploads/2018/02/Ableton-Live-10-Release_3_web.jpg",
    pageIds: [1448], // shop
  },
];

async function setHero(payload: any, pageId: number, mediaId: number) {
  await payload.update({
    collection: "pages",
    id: pageId,
    data: { titleBackgroundImage: mediaId },
  });
  console.log(`  page ${pageId}: titleBackgroundImage = ${mediaId}`);
}

async function main() {
  const payload = await getPayload({ config });

  console.log(`Reusing typewriter default (media ${TYPEWRITER_MEDIA_ID}) for ${TYPEWRITER_PAGE_IDS.length} pages`);
  for (const pageId of TYPEWRITER_PAGE_IDS) {
    await setHero(payload, pageId, TYPEWRITER_MEDIA_ID);
  }

  console.log(`Reusing Logic Producer Program image (media ${LOGIC_PRODUCER_MEDIA_ID}) for ${LOGIC_PRODUCER_PAGE_IDS.length} pages`);
  for (const pageId of LOGIC_PRODUCER_PAGE_IDS) {
    await setHero(payload, pageId, LOGIC_PRODUCER_MEDIA_ID);
  }

  for (const img of NEW_IMAGES) {
    const filePath = `${SCRATCH}/${img.file}`;
    const data = fs.readFileSync(filePath);

    const media = await payload.create({
      collection: "media",
      data: {
        alt: img.alt,
        site: EDU_SITE_ID,
        wpSourceUrl: img.wpSourceUrl,
      },
      file: {
        data,
        mimetype: img.mimeType,
        name: img.file,
        size: data.length,
      },
    });

    console.log(`Uploaded ${img.file} -> media id ${media.id}`);
    for (const pageId of img.pageIds) {
      await setHero(payload, pageId, media.id);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
