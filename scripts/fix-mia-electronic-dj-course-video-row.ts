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

const PAGE_ID = 243; // mia site "courses/electronic-dj-course"

// el_class="call-action-la-content-row2" is a shared template row used
// on ~330 pages network-wide (intro text + video), so styling can't be
// scoped to that class alone without touching every one of them. Add a
// second, page-specific class to just this page's FIRST occurrence (the
// "Electronic Music DJ Class" intro block - the page's second occurrence,
// further down, is an unrelated full-width newsletter signup with no
// video column, distinguished here by the width="2/3" that only the
// video-row column carries) so globals.css can target only this block.
const OLD_TEXT = `el_class="call-action-la-content-row2"][vc_column_inner width="2/3"]`;
const NEW_TEXT = `el_class="call-action-la-content-row2 electronic-dj-video-row"][vc_column_inner width="2/3"]`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  const occurrences = raw.split(OLD_TEXT).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(OLD_TEXT, NEW_TEXT);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: updated },
  });

  console.log("Updated page", PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
