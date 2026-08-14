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

// .btn-grand (every "JOIN NOW" / "Book Now!" / "Artist Services Page" /
// etc. gradient CTA button sitewide) is an <a> with no `display` set, so it
// defaults to inline. An inline element that WRAPS across multiple lines
// gets its background-image and border-radius applied independently PER
// LINE FRAGMENT, not once across the whole visual shape - each wrapped
// line becomes its own little rounded gradient box, showing a different
// horizontal slice of the same gradient (btn-grand's is 200%-wide,
// left-to-right pink -> cream -> pink) and overlapping the line above/
// below it. Confirmed by narrowing the "Artist Services Page" button's
// container in a live page: it reproduced exactly the split/overlapping-
// boxes look reported on the LA homepage's Garnish LA Artist Services
// section on a phone-width screen, where its 3-word label wraps.
// display: inline-block makes the whole (possibly multi-line) label act
// as one box with one continuous background, same as it already renders
// when the text happens to fit on one line - purely additive, no
// behavior change for the common case.
const OLD_RULE = `.btn-grand {\r\n            background-image: linear-gradient(to right, #ED4264 0%, #FFEDBC  51%, #ED4264  100%);\r\n            margin: 10px;\r\n            padding: 15px 45px;\r\n            text-align: center;\r\n            text-transform: uppercase;\r\n            transition: 0.5s;\r\n            background-size: 200% auto;\r\n            color: white;            \r\n            box-shadow: 0 0 20px #eee;\r\n            border-radius: 10px;\r\n  }`;
const NEW_RULE = `.btn-grand {\r\n            display: inline-block;\r\n            background-image: linear-gradient(to right, #ED4264 0%, #FFEDBC  51%, #ED4264  100%);\r\n            margin: 10px;\r\n            padding: 15px 45px;\r\n            text-align: center;\r\n            text-transform: uppercase;\r\n            transition: 0.5s;\r\n            background-size: 200% auto;\r\n            color: white;            \r\n            box-shadow: 0 0 20px #eee;\r\n            border-radius: 10px;\r\n  }`;

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
