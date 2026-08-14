import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const SITE_ID = 16; // la

// The "Course/Program Highlights" + "Prerequisites" white rounded boxes
// (.img-bg-1 p, used on every course/program page network-wide that
// overlays this two-column text on a background photo) sit with their
// bottom edge flush against the image's bottom edge - confirmed live via
// getBoundingClientRect on the SongCraft Production Program page: the
// taller box's bottom exactly equalled the image container's bottom,
// pixel for pixel.
//
// margin-bottom doesn't fix this: the outer .img-bg-1 row is
// content-height (not fixed), so adding margin just grows the row (and
// the photo, since its background-size is 100% 100%) taller by the same
// amount - the box's own position relative to the photo doesn't change at
// all (verified: box bottom stayed at the same pixel). transform instead
// moves the box without affecting layout/the row's height, which is what
// actually creates a gap.
const OLD_RULE = `.img-bg-1 p {\r\n\tmargin-left:5%;\r\n\tmargin-right: 5%;\r\n\tpadding: 20px;\r\n\tbackground-color: white;\r\n\tborder-radius: 25px;\r\n\topacity: .8;\r\n\t\r\n}`;
const NEW_RULE = `.img-bg-1 p {\r\n\tmargin-left:5%;\r\n\tmargin-right: 5%;\r\n\tpadding: 20px;\r\n\tbackground-color: white;\r\n\tborder-radius: 25px;\r\n\topacity: .8;\r\n\ttransform: translateY(-16px);\r\n\t\r\n}`;

async function main() {
  const payload = await getPayload({ config });
  const site = await payload.findByID({ collection: "sites", id: SITE_ID, depth: 0 });
  const css = site.customCss as string;

  const occurrences = css.split(OLD_RULE).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = css.replace(OLD_RULE, NEW_RULE);

  await payload.update({
    collection: "sites",
    id: SITE_ID,
    data: { customCss: updated },
  });

  console.log("Updated site", SITE_ID, "customCss");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
