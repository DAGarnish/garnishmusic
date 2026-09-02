import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";

async function main() {
  const payload = await getPayload({ config });

  const filePath =
    "/Users/garnish/Library/CloudStorage/Dropbox/Images/GMP/GMP Mia/IMG_6909.JPG";
  const buffer = fs.readFileSync(filePath);

  const media = await payload.create({
    collection: "media",
    data: {
      alt: "Garnish Miami studio - outboard compressor rack",
      site: 24,
    },
    file: {
      data: buffer,
      mimetype: "image/jpeg",
      name: "miami-outboard-gear-hero.jpg",
      size: buffer.length,
    },
  });
  console.log("created media id:", (media as any).id, "url:", (media as any).url);

  const res = await payload.find({
    collection: "hero-sliders",
    where: { and: [{ site: { equals: 24 } }, { alias: { equals: "main-home" } }] },
    limit: 1,
    depth: 0,
  });
  const doc = (res.docs as any[])[0];
  const slides = doc.slides as any[];

  slides.unshift({
    image: (media as any).id,
  });

  await payload.update({
    collection: "hero-sliders",
    id: doc.id,
    data: { slides },
  });
  console.log(
    "new slide order:",
    slides.map((s: any) => s.image)
  );
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
