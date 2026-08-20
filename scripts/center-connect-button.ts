import { getPayload } from "payload";
import config from "../payload.config";

// ny site's private-instruction page (id 1507): the CONNECT button's <a><img
// class="aligncenter" ...></a> sits bare between two <p style="text-align:
// center;"> paragraphs, with no wrapping element of its own. Every other
// image on the site that uses the WordPress "aligncenter" class relies on
// being inside a `<p style="text-align: center">` wrapper - see
// app/globals.css's `.wpb-content-wrapper img:not(...)` rule, which forces
// `display: inline` specifically so that pattern can center images (this
// overrides the display:block+margin:auto that `.aligncenter` would
// otherwise use). Without a wrapper here, the button has no text-align:
// center to inherit and renders left-aligned. Fix: wrap the anchor in the
// same `<p style="text-align: center;">` pattern already used by its
// sibling paragraphs, rather than changing the global CSS rule.
const PAGE_ID = 1507;

const OLD = `<a href="https://edu.garnishmusicproduction.com/pi/" target="_blank" rel="noopener"><img class="aligncenter wp-image-13381 size-full" src="/api/media/file/connect-button.png" sizes="(max-width: 256px) 100vw, 256px" srcset="/api/media/file/connect-button.png 256w, /api/media/file/connect-button-170x71.png 170w" alt="" width="256" height="107" /></a>`;

const NEW = `<p style="text-align: center;"><a href="https://edu.garnishmusicproduction.com/pi/" target="_blank" rel="noopener"><img class="aligncenter wp-image-13381 size-full" src="/api/media/file/connect-button.png" sizes="(max-width: 256px) 100vw, 256px" srcset="/api/media/file/connect-button.png 256w, /api/media/file/connect-button-170x71.png 170w" alt="" width="256" height="107" /></a></p>`;

async function main() {
  const payload = await getPayload({ config });

  const before = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = (before as any).wpRawContent as string;

  const occurrences = raw.split(OLD).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 occurrence of the CONNECT button markup, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(OLD, NEW);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: updated },
  });

  console.log("Updated page", PAGE_ID, "- new length:", updated.length, "(was", raw.length, ")");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
