import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

const PAGE_ID = 1351; // la site "music-production-instructors-los-angeles"

// Same recurring bug as every other white-on-dark section fixed on this
// site: plain inline color: #ffffff loses to globals.css's
// .wpb_text_column ... { color: #000 !important }. The "Focus Hours" /
// "1-on-1 Consult..." headings on this page use mkd_section_title's
// text_color attr, which is now fixed at the renderer level
// (wp-shortcode-render.ts) - only the raw-HTML price/paragraph text below
// them, and the separate "Questions?" section further down, need a
// content-level fix.
const SEGMENTS = [
  {
    name: "Focus Hours price/instructions",
    startAnchor: `<h2 style="text-align: center"><span style="color: #ffffff">$250/Hr (2 Hrs max)</span></h2>`,
    endAnchor: `Contact Admissions</strong></a> to book.</span></p>`,
    expectedCount: 3,
  },
  {
    name: "Questions?",
    startAnchor: `<h1 class="font_6" style="text-align: center"><span style="color: #ffffff">Questions?</span></h1>`,
    endAnchor: `Contact</a> page from link below</strong></span></p>`,
    expectedCount: 3,
  },
];

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  let raw = page.wpRawContent as string;

  for (const { name, startAnchor, endAnchor, expectedCount } of SEGMENTS) {
    const startOccurrences = raw.split(startAnchor).length - 1;
    if (startOccurrences !== 1) {
      console.error(`[${name}] expected 1 start anchor match, found ${startOccurrences} - aborting.`);
      process.exit(1);
    }
    const start = raw.indexOf(startAnchor);

    const endOccurrencesAfterStart = raw.slice(start).split(endAnchor).length - 1;
    if (endOccurrencesAfterStart !== 1) {
      console.error(`[${name}] expected 1 end anchor match after start, found ${endOccurrencesAfterStart} - aborting.`);
      process.exit(1);
    }
    const end = raw.indexOf(endAnchor, start) + endAnchor.length;

    const segment = raw.slice(start, end);
    const colorSpanCount = (segment.match(/color:\s*#ffffff(;)?"/g) || []).length;
    if (colorSpanCount !== expectedCount) {
      console.error(`[${name}] expected ${expectedCount} 'color: #ffffff' occurrences, found ${colorSpanCount} - aborting.`);
      process.exit(1);
    }

    const updatedSegment = segment.replace(/color:\s*#ffffff(;)?"/g, (_m, semi) => `color: #ffffff !important${semi || ""}"`);
    raw = raw.slice(0, start) + updatedSegment + raw.slice(end);
    console.log(`Fixed segment: ${name}`);
  }

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: raw },
  });

  console.log("Updated page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
