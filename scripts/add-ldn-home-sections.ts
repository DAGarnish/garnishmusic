import { getPayload } from "payload";
import config from "../payload.config";

const PAGE_ID = 2199; // www site (London) "locations" page = homepage

const ANCHOR =
  `<h1 style="text-align: center;">World-class Music Production Courses in London</h1>\r\n` +
  `[/vc_column_text][vc_empty_space][/vc_column][/vc_row][vc_row][vc_column][vc_empty_space][vc_column_text css=""]\r\n` +
  `<h1 style="text-align: center;">Shorter Music Production Courses</h1>`;

const INSERTION =
  `<h1 style="text-align: center;">World-class Music Production Courses in London</h1>\r\n` +
  `[/vc_column_text][vc_empty_space][/vc_column][/vc_row]` +
  `[vc_row content_aligment="center" css=".vc_custom_1755180001000{background-color: #f6f6f6 !important;}"][vc_column][mkd_elements_holder number_of_columns="two-columns"]` +
  `[mkd_elements_holder_item background_image="18626" item_padding_600_768="48% 0" item_padding_480_600="48% 0" item_padding_480="48% 0"][/mkd_elements_holder_item]` +
  `[mkd_elements_holder_item item_padding="32% 21% 34% 21%" item_padding_1024_1280="19% 15% 22% 15%" item_padding_768_1024="22% 10% 24% 10%" item_padding_600_768="14% 10% 14% 10%" item_padding_480_600="14% 5% 0% 5%" item_padding_480="14% 5% 0% 5%"][vc_column_text]\n` +
  `<h2>Garnish Industry Diploma</h2>\n` +
  `[/vc_column_text][vc_empty_space height="18px"][vc_column_text]The Garnish Industry Diploma is our flagship programme: 360 hours of hands-on learning in classes of no more than six, plus 24-hour access to the Garnish studio. Covering Logic Pro, Ableton Live, sound design &amp; synthesis, audio engineering, music theory and songwriting, it gives you the practical skills and portfolio to build a career in music production.[/vc_column_text]` +
  `[vc_empty_space height="35px"][mkd_button type="" target="_blank" icon_pack="" font_weight="" text="See More" link="https://www.garnishmusicproduction.com/academy/electronic-music-production/"][/mkd_elements_holder_item]` +
  `[/mkd_elements_holder][/vc_column][/vc_row]` +
  `[vc_row content_aligment="center" css=".vc_custom_1755180002000{background-color: #f6f6f6 !important;}"][vc_column][mkd_elements_holder number_of_columns="two-columns"]` +
  `[mkd_elements_holder_item item_padding="32% 21% 34% 21%" item_padding_1024_1280="19% 15% 22% 15%" item_padding_768_1024="22% 10% 24% 10%" item_padding_600_768="14% 10% 14% 10%" item_padding_480_600="10% 5% 10% 5%" item_padding_480="10% 5% 10% 5%"][vc_column_text]\n` +
  `<h2>Electronic Music Producer</h2>\n` +
  `[/vc_column_text][vc_empty_space height="18px"][vc_column_text]A focused 120-hour programme covering Ableton Live, sound design &amp; synthesis, music foundations, and mixing &amp; mastering. Taught in small, personalised groups by working industry professionals, it's built for producers who want to prioritise writing and finishing their own music.[/vc_column_text]` +
  `[vc_empty_space height="35px"][mkd_button type="" target="_blank" icon_pack="" font_weight="" text="See More" link="https://www.garnishmusicproduction.com/programs/ableton-producer-program/"][/mkd_elements_holder_item]` +
  `[mkd_elements_holder_item background_image="18620" item_padding_600_768="48% 0" item_padding_480_600="48% 0" item_padding_480="48% 0"][/mkd_elements_holder_item]` +
  `[/mkd_elements_holder][/vc_column][/vc_row]` +
  `[vc_row][vc_column][vc_empty_space][vc_column_text css=""]\n` +
  `<h1 style="text-align: center;">Shorter Music Production Courses</h1>`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  const raw = page.wpRawContent as string;

  if (!raw.includes(ANCHOR)) {
    console.error("ANCHOR NOT FOUND - aborting, no changes made.");
    process.exit(1);
  }
  const occurrences = raw.split(ANCHOR).length - 1;
  if (occurrences !== 1) {
    console.error(`Expected exactly 1 anchor match, found ${occurrences} - aborting.`);
    process.exit(1);
  }

  const updated = raw.replace(ANCHOR, INSERTION);

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
