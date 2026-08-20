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

const LA_SITE_ID = 16;
const INSTRUCTORS_PAGE_ID = 1351; // la site "music-production-instructors-los-angeles"
const GENERIC_TITLE_BG_MEDIA_ID = 278; // shared title-area background reused across LA instructor bio pages
const GENERIC_PANEL_TEXTURE_WP_ATTACHMENT_ID = "16855"; // shared subtle texture behind bio text, reused across LA instructor bio pages
const IMAGE_PATH = path.resolve(__dirname, "th3ory-square-1600.jpg");
const WP_ATTACHMENT_ID = 90000001; // synthetic id (not from a real WP migration) - just needs to be unique

async function main() {
  const payload = await getPayload({ config });

  // 1. Make sure our synthetic wpAttachmentId doesn't collide with anything real.
  const collision = await payload.find({
    collection: "media",
    where: { wpAttachmentId: { equals: WP_ATTACHMENT_ID } },
    limit: 1,
  });
  if (collision.totalDocs > 0) {
    console.error(`wpAttachmentId ${WP_ATTACHMENT_ID} already in use - pick another.`);
    process.exit(1);
  }

  // 2. Upload his photo (square-cropped from the source portrait, matching
  // the other LA instructor listing photos' 1:1 aspect ratio).
  const data = fs.readFileSync(IMAGE_PATH);
  const media = await payload.create({
    collection: "media",
    data: { alt: "Th3ory Producer Songwriter", site: LA_SITE_ID, wpAttachmentId: WP_ATTACHMENT_ID },
    file: { data, mimetype: "image/jpeg", name: "Th3ory.jpg", size: data.length },
  });
  const thumbUrl = media.sizes?.thumbnail?.url || media.url;
  console.log("Uploaded media", media.id, thumbUrl);

  // 3. Create his bio page, mirroring the structure of the other LA instructor
  // bio pages (e.g. Baddluck / Cole Nystrom at courses/baddluck, courses/cole-nystrom).
  const bioUrl = "https://la.garnishmusicproduction.com/courses/th3ory/";
  const cssId = Date.now();
  const bioRawContent = `[vc_row][vc_column][vc_empty_space height="64px"][/vc_column][/vc_row][vc_row content_width="grid" content_aligment="center"][vc_column css=".vc_custom_${cssId}{border-top-width: 2px !important;border-right-width: 2px !important;border-bottom-width: 2px !important;border-left-width: 2px !important;background: #F7F7F7 url(/api/media/file/Asset-1%402x.png) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: contain !important;border-left-style: none !important;border-right-style: none !important;border-top-style: none !important;border-bottom-style: none !important;border-radius: 2px !important;border-color: #e9003f !important;}" el_class="bg-1"][mkd_section_title title_text="Meet Th3ory" text_align="center" text_size="38"][vc_empty_space][mkd_elements_holder number_of_columns="two-columns"][mkd_elements_holder_item background_image="${WP_ATTACHMENT_ID}" item_padding_600_768="48% 0" item_padding_480_600="48% 0" item_padding_480="48% 0"][/mkd_elements_holder_item][mkd_elements_holder_item background_color="#f6f6f6" background_image="${GENERIC_PANEL_TEXTURE_WP_ATTACHMENT_ID}" item_padding="8% 10.5% 8% 10.5%" item_padding_1024_1280="19% 15% 22% 15%" item_padding_768_1024="22% 10% 24% 10%" item_padding_600_768="14% 10% 14% 10%" item_padding_480_600="14% 5% 0% 5%" item_padding_480="14% 5% 0% 5%"][vc_empty_space][vc_column_text css=""]
<p style="text-align: left"><strong>Bio</strong></p>
<p style="text-align: left">Th3ory is an LA based producer, songwriter, multi-instrumentalist and independent artist originally from Springfield, MA. Coined as a &lsquo;Swiss army knife&rsquo; in the room, Th3ory has the ability to collaborate with a variety of creatives across all genres as he wears many creative hats. His versatility speaks for itself as he can seamlessly navigate a variety of artist projects in the Pop, Hip-Hop, and R&amp;B space.</p>
[/vc_column_text][vc_column_text css=""]
<div class="wpb_text_column wpb_content_element">
<div class="wpb_wrapper">
<div class="page" title="Page 1">
<div class="section">
<div class="layoutArea">
<div class="column">
<p style="text-align: left"><strong>Credits</strong></p>
<p style="text-align: left">Th3ory has produced for artists such as Mary J. Blige, Elton John, Chris Brown, Wale, 6lack, PARTYNEXTDOOR, Nipsey Hussle, Eric Bellinger, and Blackbear to name a few.</p>

</div>
</div>
</div>
</div>
</div>
</div>
[/vc_column_text][vc_empty_space][/mkd_elements_holder_item][/mkd_elements_holder][vc_empty_space height="64px"][/vc_column][/vc_row]`;

  const bioPage = await payload.create({
    collection: "pages",
    data: {
      title: "Th3ory",
      slug: "courses/th3ory",
      site: LA_SITE_ID,
      status: "published",
      featuredImage: media.id,
      titleBackgroundImage: GENERIC_TITLE_BG_MEDIA_ID,
      showTitleArea: true,
      fullWidthTemplate: false,
      hasSidebar: false,
      portfolioCustomTemplate: false,
      portfolioCategories: [64, 69], // Songwriting, Instructor (LA site categories)
      wpRawContent: bioRawContent,
      seo: {
        metaTitle: "Th3ory - Garnish Music Production School | Los Angeles",
        metaDescription:
          "Th3ory is an LA based producer, songwriter and multi-instrumentalist who has produced for Mary J. Blige, Elton John, Chris Brown, Wale, 6lack, PARTYNEXTDOOR, Nipsey Hussle, Eric Bellinger and Blackbear.",
        noindex: false,
      },
    },
  });
  console.log("Created bio page", bioPage.id, "at /courses/th3ory/");

  // 4. Insert his listing entry 5th down the instructors page, i.e.
  // immediately before LVMA BLACK (previously 5th) so he becomes #5 and
  // everyone from LVMA BLACK on shifts down by one.
  const page = await payload.findByID({ collection: "pages", id: INSTRUCTORS_PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  // LVMA BLACK's block is the only one with this css id - use it to find the
  // exact, unique start of that block's opening tags.
  const LVMA_UNIQUE_CSS_ID = "1770711187198";
  const lvmaCssIdx = raw.indexOf(LVMA_UNIQUE_CSS_ID);
  if (lvmaCssIdx === -1) {
    console.error("Could not find LVMA BLACK's block - page content may have changed.");
    process.exit(1);
  }
  const anchorStart = raw.lastIndexOf('[vc_row content_width="grid"', lvmaCssIdx);
  if (anchorStart === -1) {
    console.error("Could not find the start of LVMA BLACK's row block.");
    process.exit(1);
  }
  // Every instructor block's vc_column_text open tag ends with this identical
  // padding declaration - find its close (the "] right after it) to isolate
  // the full, unique opening-tag chain from anchorStart through there.
  const closingMarker = 'padding-left: 20px !important;}"]';
  const closingIdx = raw.indexOf(closingMarker, lvmaCssIdx);
  if (closingIdx === -1) {
    console.error("Could not find the close of LVMA BLACK's vc_column_text open tag.");
    process.exit(1);
  }
  const anchor = raw.slice(anchorStart, closingIdx + closingMarker.length);
  const occurrences = raw.split(anchor).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 match for LVMA BLACK's anchor, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const listingCssId = cssId + 1;
  const newBlock = `[vc_row content_width="grid" content_aligment="center"][vc_column css=".vc_custom_1729129018281{border-top-width: 2px !important;border-right-width: 2px !important;border-bottom-width: 2px !important;border-left-width: 2px !important;background: #F7F7F7 url(/api/media/file/Asset-1%402x.png) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: contain !important;border-left-style: none !important;border-right-style: none !important;border-top-style: none !important;border-bottom-style: none !important;border-radius: 2px !important;border-color: #e9003f !important;}" el_class="bg-1"][vc_column_text css=".vc_custom_${listingCssId}{border-top-width: 20px !important;border-right-width: 20px !important;border-bottom-width: 20px !important;border-left-width: 20px !important;padding-top: 20px !important;padding-right: 20px !important;padding-bottom: 20px !important;padding-left: 20px !important;}"]
<h1 style="text-align: left"><a href="${bioUrl}"><img class="alignleft wp-image-${WP_ATTACHMENT_ID} size-medium" src="${thumbUrl}" alt="Th3ory Producer Songwriter" width="300" height="300" /></a>Th3ory</h1>
<h4 style="text-align: left"><strong>Producer, Songwriter &amp; Multi-Instrumentalist</strong></h4>
&nbsp;
<p style="text-align: left">Credits: Mary J. Blige, Elton John, Chris Brown, Wale, 6lack, PARTYNEXTDOOR, Nipsey Hussle, Eric Bellinger, Blackbear</p>
<p style="text-align: left">Specialities: Production, Songwriting, Multi-Instrumentalist, Pop, Hip-Hop, R&amp;B</p>
<p style="text-align: left"><a href="${bioUrl}">See Bio</a></p>
[/vc_column_text][/vc_column][/vc_row][vc_row][vc_column][vc_empty_space][/vc_column][/vc_row]`;

  const updatedRaw = raw.replace(anchor, newBlock + anchor);

  await payload.update({
    collection: "pages",
    id: INSTRUCTORS_PAGE_ID,
    data: { wpRawContent: updatedRaw },
  });

  console.log("Inserted Th3ory as the 5th instructor on page", INSTRUCTORS_PAGE_ID);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
