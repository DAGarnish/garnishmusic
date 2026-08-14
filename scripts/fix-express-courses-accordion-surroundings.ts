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

// Same globals.css override bug fixed for Production Programs' "Modules"
// headings/closing paragraphs (fix-production-programs-modules-heading-color.ts):
// text immediately before/after a color_style="white" [mkd_accordion] uses
// plain inline color: #ffffff with no !important, which loses to
// .wpb_text_column ... { color: #000 !important } in globals.css.
// Anchors/counts sourced from scan-express-courses-accordion-surroundings.ts.
const CLOSING_PARA_ANCHOR = `<p style="text-align: center"><span style="color: #ffffff">Music Technology &amp; Business are constantly evolving. Our curriculums are routinely updated to give you the best experience.</span></p>`;

type Segment = { startAnchor: string; endAnchor: string; expectedCount: number };

const PAGES: { id: number; slug: string; segments: Segment[] }[] = [
  {
    id: 329,
    slug: "courses/ableton-live-course",
    segments: [
      {
        startAnchor: `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">Ableton Live Course Syllabus</span></h2>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 328,
    slug: "courses/logic-pro-course",
    segments: [
      {
        startAnchor: `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">Logic Pro Course <span style="letter-spacing: -0.02em">Syllabus</span></span></h2>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 327,
    slug: "courses/synthesis-and-sound-design",
    segments: [
      {
        startAnchor: `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">Synthesis and Sound Design <span style="letter-spacing: -0.02em">Syllabus</span></span></h2>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 310,
    slug: "courses/composing-and-media-scoring",
    segments: [
      {
        startAnchor: `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">Composing and Media Scoring Syllabus</span></h2>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 323,
    slug: "courses/mixing-and-mastering-course",
    segments: [
      {
        startAnchor: `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">Mixing and Mastering Syllabus</span></h2>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 306,
    slug: "courses/advanced-mastering",
    segments: [
      {
        startAnchor: `<h3 class="font_6" style="text-align: center"><span style="color: #ffffff">Advanced Mastering Syllabus</span></h3>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 298,
    slug: "courses/k-pop-hitmaker",
    segments: [
      // "Meet Your Instructors" intro sits directly before this page's
      // OTHER color_style="white" accordion block (the instructor bios
      // toggle) on the same dark bg-1 background - confirmed live.
      {
        startAnchor: `<h1 class="font_6" style="text-align: center"><span style="color: #ffffff">Meet Your Instructors</span></h1>`,
        endAnchor: `<p class="font_7" style="text-align: center"><span style="color: #ffffff">We present to you Multi-Platinum K-Pop Hitmakers with Billboard and Gaon chart No1s!</span></p>`,
        expectedCount: 2,
      },
      {
        startAnchor: `<h3 class="font_6" style="text-align: center"><span style="color: #ffffff">K-Pop Hitmaker Syllabus</span></h3>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 297,
    slug: "courses/hip-hop-production",
    segments: [
      {
        startAnchor: `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">Hip Hop Production Syllabus</span></h2>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 292,
    slug: "courses/art-of-remix",
    segments: [
      {
        startAnchor: `<h2 class="font_6" style="text-align: center"><span style="color: #ffffff">Art of Remix Course Syllabus</span></h2>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 326,
    slug: "courses/fl-studio-production",
    segments: [
      {
        startAnchor: `<h3 class="font_6" style="text-align: center"><span style="color: #ffffff">FL Studio Production Syllabus</span></h3>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 2,
      },
    ],
  },
  {
    id: 325,
    slug: "courses/pro-tools-course",
    segments: [
      {
        startAnchor: `<h3 class="font_6" style="text-align: center"><span style="color: #ffffff">Pro Tools Course</span></h3>\r\n<p class="font_6" style="text-align: center"><span style="color: #ffffff"><strong>Our Pvt Lessons have a flexible Curriculum depending on the student's needs</strong></span></p>`,
        endAnchor: CLOSING_PARA_ANCHOR,
        expectedCount: 3,
      },
    ],
  },
];

async function main() {
  const payload = await getPayload({ config });

  for (const { id, slug, segments } of PAGES) {
    const page = await payload.findByID({ collection: "pages", id, depth: 0 });
    let raw = page.wpRawContent as string;
    let changed = false;

    for (const { startAnchor, endAnchor, expectedCount } of segments) {
      const startOccurrences = raw.split(startAnchor).length - 1;
      if (startOccurrences !== 1) {
        console.error(`[${id}] ${slug}: expected 1 start anchor match, found ${startOccurrences} - aborting page.`);
        changed = false;
        break;
      }
      const start = raw.indexOf(startAnchor);

      const endOccurrencesAfterStart = raw.slice(start).split(endAnchor).length - 1;
      if (endOccurrencesAfterStart !== 1) {
        console.error(`[${id}] ${slug}: expected 1 end anchor match after start, found ${endOccurrencesAfterStart} - aborting page.`);
        changed = false;
        break;
      }
      const end = raw.indexOf(endAnchor, start) + endAnchor.length;

      const segment = raw.slice(start, end);
      const colorSpanCount = (segment.match(/color:\s*#ffffff(;)?"/g) || []).length;
      if (colorSpanCount !== expectedCount) {
        console.error(
          `[${id}] ${slug}: expected ${expectedCount} 'color: #ffffff' occurrences, found ${colorSpanCount} - aborting page.`
        );
        changed = false;
        break;
      }

      const updatedSegment = segment.replace(/color:\s*#ffffff(;)?"/g, (_m, semi) => `color: #ffffff !important${semi || ""}"`);
      raw = raw.slice(0, start) + updatedSegment + raw.slice(end);
      changed = true;
    }

    if (!changed) continue;

    await payload.update({
      collection: "pages",
      id,
      data: { wpRawContent: raw },
    });
    console.log(`Updated [${id}] ${slug}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
