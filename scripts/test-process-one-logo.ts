import sharp from "sharp";
import fs from "fs";

const ACCENT = { r: 215, g: 255, b: 63 };
const OUT_DIR = "/private/tmp/claude-501/-Users-garnish-Documents/8d85fea4-60e2-4c2e-a931-c3551d57f0f8/scratchpad";

// The source PNGs are genuine grayscale+alpha images (real transparency,
// confirmed via sharp metadata - hasAlpha: true) - recolor by keeping each
// pixel's real existing alpha and overwriting only RGB to the accent green,
// rather than trying to re-derive alpha from luminance.
async function processLogo(url: string): Promise<Buffer> {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let maxAlpha = 0;
  for (let i = 0; i < width * height; i++) maxAlpha = Math.max(maxAlpha, data[i * channels + (channels - 1)]);
  console.log("max alpha found in image:", maxAlpha);

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
  const buffer = await processLogo("http://localhost:3000/api/media/file/1-12.png");
  fs.writeFileSync(`${OUT_DIR}/ableton-lime-test.png`, buffer);
  console.log("saved");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
