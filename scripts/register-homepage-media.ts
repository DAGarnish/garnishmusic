import { getPayloadClient } from "../lib/get-payload";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const mediaDir = path.resolve(dirname, "../media");

const files = [
  "Worlds-boutique-Music-Production-School-scaled.jpg",
  "20130809-DSC_9526-garnish@me.com_.jpg",
  "1.png",
  "2-copy-1.png",
  "3.png",
  "4-1.png",
  "svgexport-1-1.png",
  "AlphaTheta-1.png",
  "logo-1.png",
  "Auto-Tune_white_logo_with_green_A_wave-1.png",
  "Image-Line.png",
  "logo-2.png",
  "Native_Instruments_logo_2023.svg_-1.png",
  "apple.png",
];

async function main() {
  const payload = await getPayloadClient();

  for (const filename of files) {
    const existing = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
    });
    if (existing.docs[0]) {
      console.log(`skip (already registered): ${filename}`);
      continue;
    }

    const filePath = path.join(mediaDir, filename);
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const mimetype = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

    await payload.create({
      collection: "media",
      data: { alt: filename, site: 1 },
      file: { data, mimetype, name: filename, size: data.length },
    });
    console.log(`registered: ${filename}`);
  }
  process.exit(0);
}

main();
