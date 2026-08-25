import { getPayload } from "payload";
import configPromise from "../payload.config";
import sharp from "sharp";

// The partner logo PNGs turn out to be genuine grayscale+alpha images (real
// transparency - confirmed via sharp metadata, hasAlpha: true); the earlier
// CSS mask-image attempt failed purely because the image is served via a
// redirect to S3 and browsers block cross-origin redirected images from
// being used as a mask source, not because the source lacked transparency.
// This keeps each pixel's real existing alpha and overwrites only RGB to
// the accent lime green, then uploads the result as a new Media doc (never
// touches the originals, which the legacy renderer on the other 17 sites
// still uses as-is) so the modern site can just render a normal same-origin
// <img> with no masking trickery needed at all.
const ACCENT = { r: 215, g: 255, b: 63 }; // #d7ff3f

async function processLogo(url: string): Promise<Buffer> {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const alpha = data[idx + channels - 1];
    const o = i * 4;
    out[o] = ACCENT.r;
    out[o + 1] = ACCENT.g;
    out[o + 2] = ACCENT.b;
    out[o + 3] = alpha;
  }

  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const global = await payload.findGlobal({ slug: "partners", depth: 1 });
  const logos = ((global as any)?.logos || []) as any[];

  const results: { name: string; link?: string; url: string }[] = [];

  for (const l of logos) {
    const originalUrl: string | undefined = typeof l.image === "object" ? l.image?.url : undefined;
    if (!originalUrl) continue;
    const absoluteUrl = originalUrl.startsWith("http")
      ? originalUrl
      : `http://localhost:3000${originalUrl}`;
    console.log(`Processing ${l.name}...`);
    const pngBuffer = await processLogo(absoluteUrl);
    const filename = `partner-lime-${(l.name || "logo").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;

    const doc = await payload.create({
      collection: "media",
      data: { alt: `${l.name} logo (lime, transparent)` },
      file: { data: pngBuffer, mimetype: "image/png", name: filename, size: pngBuffer.length },
    });
    results.push({ name: l.name, link: l.link, url: (doc as any).url });
  }

  console.log("\n=== RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
