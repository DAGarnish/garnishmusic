import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

// Removes the "To be in the loop when we release more dates, sign up to our
// newsletter..." callout (and, where it's the same theme, the "Check out
// the student feedback from our ... Academy Program" line right after it)
// from every mia /courses/* page. Left video-production-course's second
// paragraph alone - it's a different, unrelated blurb about the testimonial
// video's videographer, not the newsletter/academy callout.
const FIXES: { id: number; slug: string; sha256: string; oldText: string; newText: string }[] = [
  {
    id: 251,
    slug: "courses/video-production-course",
    sha256: "a3eb4bd702cf2cf5baa4d8d9774b5c8e013e13c35733eb99e1a962a7b7c6891f",
    oldText:
      '<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\r\n',
    newText: "",
  },
  {
    id: 250,
    slug: "courses/ableton-live-course",
    sha256: "c9ffadad540397cccb09826ee4ebea8bcfcbc13ce98588e7c1a9f64ab33bb7bf",
    oldText:
      '<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\r\n<p style="text-align: center;">Check out the student feedback from our <a href="https://mia.garnishmusicproduction.com/programs/emp-electronic-music-producer/" target="_blank" rel="noopener noreferrer">Electronic Music Producer</a> Electronic Music Academy Program at our USA HQ ↓</p>\r\n',
    newText: "",
  },
  {
    id: 249,
    slug: "courses/logic-course",
    sha256: "0257ff114ae9fbe9314cfc1b700989aafb73ddd91e2e8931ee59e0cdb3a6950a",
    oldText:
      '<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\r\n<p style="text-align: center;">Check out the student feedback from our longer <a href="https://mia.garnishmusicproduction.com/academy/songwriting-music-producer/" target="_blank" rel="noopener noreferrer">Songwriting &amp; Production Academy</a> Program below.</p>\r\n',
    newText: "",
  },
  {
    id: 248,
    slug: "courses/pro-tools101-course",
    sha256: "b4c10c7ed9e61b032ad4c56fbc5d8df14faf116be8e01c7544f90e617173c8b8",
    oldText:
      '<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\r\n',
    newText: "",
  },
  {
    id: 246,
    slug: "courses/mixing-mastering-course",
    sha256: "b4cadd2ccdb308e9a97418ad147fba15f605cad5d7435578a3d70de92e92902c",
    oldText:
      '<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\r\n',
    newText: "",
  },
  {
    id: 245,
    slug: "courses/electronic-music-emp",
    sha256: "c2b9da264f4196bd44f3b37232850f4d1d07c5559ef307af3053c31227f139d5",
    oldText:
      '<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\r\n<p style="text-align: center;">Check out the student feedback from our longer <a href="https://mia.garnishmusicproduction.com/academy/emp-electronic-music-producer/" target="_blank" rel="noopener">Electronic Music Academy Program</a> ↓</p>\r\n',
    newText: "",
  },
  {
    id: 244,
    slug: "courses/hip-hop-course",
    sha256: "f513e5a04861b572b150d0792532a98c03ce32e0ef9f765ce93004309f1d5ca2",
    oldText:
      '<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\r\n',
    newText: "",
  },
  {
    id: 243,
    slug: "courses/electronic-dj-course",
    sha256: "588ab4d56373e3fb72fee24d20af940cef8d49337299647ec15fa56df42c7b9f",
    oldText:
      '<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\n',
    newText: "",
  },
  {
    id: 241,
    slug: "courses/turntablism-dj-course",
    sha256: "554f44c723dca2bc4f0e6b92a4ae48128f88c2088c82124adeaf24293368a0ad",
    oldText:
      '</a>To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don\'t send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>\r\n<p style="text-align: center;">Check out the student feedback from our <a href="https://mia.garnishmusicproduction.com/academy/emp-electronic-music-producer/" target="_blank" rel="noopener noreferrer">Electronic Music Academy</a> ↓</p>\r\n',
    newText: "</a></p>\r\n",
  },
  {
    id: 239,
    slug: "courses/summer-camp-school",
    sha256: "f65d6ca380f12fb031e6bd96a76c865a5c962918717f0d48d51ceecd890c210f",
    oldText:
      '<p style="text-align: center">To be in the loop when we release more dates, sign up to our newsletter on the right. We don\'t send many, and we never share our data with anyone, ever.</p>\n',
    newText: "",
  },
];

async function main() {
  const payload = await getPayload({ config });

  for (const fix of FIXES) {
    const doc = await payload.findByID({ collection: "pages", id: fix.id, depth: 0 });
    const raw = (doc as any).wpRawContent as string;

    const actualSha256 = crypto.createHash("sha256").update(raw).digest("hex");
    if (actualSha256 !== fix.sha256) {
      console.error(`[${fix.slug} ${fix.id}] content changed since script was written - skipping.`);
      console.error(`  expected sha256 ${fix.sha256}, got ${actualSha256}`);
      continue;
    }

    const occurrences = raw.split(fix.oldText).length - 1;
    if (occurrences !== 1) {
      console.error(`[${fix.slug} ${fix.id}] expected exactly 1 occurrence, found ${occurrences} - skipping.`);
      continue;
    }

    const updated = raw.split(fix.oldText).join(fix.newText);
    await payload.update({ collection: "pages", id: fix.id, data: { wpRawContent: updated } });
    console.log(`[${fix.slug} ${fix.id}] removed newsletter blurb.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
