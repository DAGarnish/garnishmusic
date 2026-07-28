import { getPayload } from "payload";
import fs from "fs";
import config from "../payload.config";

const SCRATCH =
  "/tmp/claude-1000/-home-abhises-Desktop-davemusic-garnishmusic-headless/80044343-6915-4d50-a1d8-8b6c2fd8bb41/scratchpad/hero-images";

const EDU_SITE_ID = 15;

// Each image, the WP attachment it corresponds to (for traceability), and
// which page IDs (courses/*) should get it as their titleBackgroundImage.
const IMAGES: Array<{
  file: string;
  mimeType: string;
  alt: string;
  wpAttachmentId: number;
  wpSourceUrl: string;
  pageIds: number[];
}> = [
  {
    file: "ableton-live-classes.jpg",
    mimeType: "image/jpeg",
    alt: "Ableton Live",
    wpAttachmentId: 10963,
    wpSourceUrl: "https://ny.garnishmusicproduction.com/wp-content/uploads/2017/07/Ableton-Live-Classes.jpg",
    pageIds: [398, 356], // courses/ableton-live, courses/ableton-live-2
  },
  {
    file: "ableton-live-10-release-6-web.jpg",
    mimeType: "image/jpeg",
    alt: "Ableton Live 10",
    wpAttachmentId: 10615,
    wpSourceUrl:
      "https://ny.garnishmusicproduction.com/wp-content/uploads/2017/07/Ableton-Live-10-Release_6_web.jpg",
    pageIds: [388], // courses/advanced-ableton-live
  },
  {
    file: "logic-producer-program.png",
    mimeType: "image/png",
    alt: "Logic Pro",
    wpAttachmentId: 10954,
    wpSourceUrl: "https://ny.garnishmusicproduction.com/wp-content/uploads/2017/07/Logic-Producer-Program.png",
    pageIds: [396], // courses/logic-pro
  },
  {
    file: "pro-tools-classes.png",
    mimeType: "image/png",
    alt: "Pro Tools",
    wpAttachmentId: 10960,
    wpSourceUrl: "https://ny.garnishmusicproduction.com/wp-content/uploads/2017/07/pro-tools-classes.png",
    pageIds: [395], // courses/pro-tools
  },
  {
    file: "on-air.jpg",
    mimeType: "image/jpeg",
    alt: "Radio & Podcast",
    wpAttachmentId: 25940,
    wpSourceUrl: "https://edu.garnishmusicproduction.com/wp-content/uploads/sites/8/2018/04/On-Air.jpg",
    pageIds: [389], // courses/radio-podcast-course
  },
  {
    file: "music-production-studio.jpg",
    mimeType: "image/jpeg",
    alt: "Private Instruction",
    wpAttachmentId: 12744,
    wpSourceUrl: "https://edu.garnishmusicproduction.com/wp-content/uploads/sites/8/2020/12/Music-Production-Studio.jpg",
    pageIds: [382], // courses/private-instruction
  },
  {
    file: "slide3.jpg",
    mimeType: "image/jpeg",
    alt: "Ableton Live for DJs",
    wpAttachmentId: 9643,
    wpSourceUrl: "https://ny.garnishmusicproduction.com/wp-content/uploads/sites/9/2018/01/slide3.jpg",
    pageIds: [371], // courses/ableton-live-djs
  },
  {
    file: "ableton-live-10-typewriter-scaled.jpg",
    mimeType: "image/jpeg",
    alt: "Garnish Music Production School",
    wpAttachmentId: 19717,
    wpSourceUrl:
      "https://edu.garnishmusicproduction.com/wp-content/uploads/sites/8/2021/10/Ableton-Live-10-typewriter-scaled.jpg",
    // theme-wide default background, used by pages with no per-post hero set:
    pageIds: [362, 361, 360, 358], // urban, songwriting-entrepreneur, electronic-dj, black-music-entrepreneur
  },
];

async function main() {
  const payload = await getPayload({ config });

  for (const img of IMAGES) {
    const filePath = `${SCRATCH}/${img.file}`;
    const data = fs.readFileSync(filePath);

    const media = await payload.create({
      collection: "media",
      data: {
        alt: img.alt,
        site: EDU_SITE_ID,
        wpAttachmentId: img.wpAttachmentId,
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
      await payload.update({
        collection: "pages",
        id: pageId,
        data: { titleBackgroundImage: media.id },
      });
      console.log(`  page ${pageId}: titleBackgroundImage = ${media.id}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
