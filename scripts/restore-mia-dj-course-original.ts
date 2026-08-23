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

// Restores the pre-accordion original content, reconstructed from the raw
// dumps taken while building fix-mia-dj-course-accordion-and-paypal.ts
// (since reverted at the user's "undo" - this page has no Payload version
// history to roll back to, so this rebuilds the exact original structure:
// same 5 alternating photo-backed [vc_row_inner] pairs, same el_class
// hash IDs, same bullet content, same "See Schedule" button).
function icon(text: string): string {
  return `[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] ${text}`;
}

const COL_INNER_CSS_FIRST = `.vc_custom_1735730060477{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}`;
const COL_INNER_CSS_SECOND = `.vc_custom_1735730075831{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}`;
const COL_INNER_CSS_VERYFIRST = `.vc_custom_1759301524640{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}`;

function rowInnerOpen(hash: string, image: string): string {
  return `[vc_row_inner css=".vc_custom_${hash}{margin-top: 50px !important;margin-right: 0px !important;margin-bottom: 50px !important;margin-left: 0px !important;background: #B7B7B7 url(/api/media/file/${image}) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: cover !important;border-radius: 20px !important;border-color: #000000 !important;}"]`;
}

function colText(hash: string): string {
  return `[vc_column_text css=".vc_custom_${hash}{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]`;
}

const modules = [
  { name: "Let’s Go", textHash: "1759301592106", body: [icon("Equipment, set up, and ready to go"), icon("Mixer essentials"), icon("Beats and bars"), icon("Intro to beat matching"), icon("The structure of electronic music")].join("\r\n") },
  { name: "Arrangement of Electronic Music", textHash: "1736435692621", body: `<p style="text-align: left;">${[icon("Pitch and identifying dissonance (known as clashing)"), icon("Where to mix in and mix out"), icon("Differences you need to know between Trap/Bass and ‘Four-On-The-Floor’")].join("\r\n")}` },
  { name: "Building a Set", textHash: "1736435736664", body: [icon("Tips on track choice"), icon("Tempo"), icon("Set order"), icon("Mix points"), icon("Teaser mixes")].join("\r\n") },
  { name: "FX", textHash: "1736435758903", body: [icon("Introduction to common FX"), icon("EQ"), icon("All about filtering"), icon("FX in the mix dos and don’ts")].join("\r\n") },
  { name: "Hardware &amp; Software", textHash: "1736435796223", body: [icon("Pioneer Nexus"), icon("Rekordbox"), icon(`<a href="https://www.mixedinkey.com/" target="_blank" rel="noopener noreferrer">Mixed In Key</a>`)].join("\r\n") },
  { name: "Your Set", textHash: "1736435818863", body: [icon("Fine tuning your set"), icon("Mixing acapellas"), icon("Reading a crowd and having a ‘plan b’")].join("\r\n") },
  { name: "Advanced Mixing &amp; Digital Tricks", textHash: "1736435859187", body: [icon("Sampling and triggering"), icon("All about delay and reverb in the mix"), icon("Looping and making your own mash-ups on the fly"), icon("Impact mixing with levels and FX"), icon("Body language behind the decks")].join("\r\n") },
  { name: "Advanced Set Building &amp; Ad-libbing", textHash: "1736435940620", body: [icon("Out-of-the-box song choice"), icon("Tempo change tips"), icon("Music programming")].join("\r\n") },
  { name: "Preparing for Your Show", textHash: "1736435968572", body: [icon("Recording your set for submission"), icon("Marketing and promoting your gig")].join("\r\n") },
  { name: "After Your Show", textHash: "1736435998138", body: [icon("How to keep the momentum going and get more gigs"), icon("EPK tips"), icon("Developing your sound")].join("\r\n") },
];

const rowInners = [
  { hash: "1759301336743", image: "IMG_6909-scaled-4.jpg" },
  { hash: "1759301136535", image: "IMG_1045-2-scaled-1.jpg" },
  { hash: "1759301157456", image: "IMG_2892-scaled-1.jpg" },
  { hash: "1759301179903", image: "IMG_7473-1-scaled-13.jpg" },
  { hash: "1759301198583", image: "fotor_2023-6-7_16_50_38-scaled-1.webp" },
];

function buildModuleBlock(m: (typeof modules)[number], colInnerCss: string): string {
  return `[vc_column_inner width="1/2" css="${colInnerCss}"]${colText(m.textHash)}\r\n<h4>${m.name}</h4>\r\n${m.body}[/vc_column_text][/vc_column_inner]`;
}

let originalSection = `[vc_row content_width="grid" el_class="blured-images-wrapper"][vc_column]`;
for (let i = 0; i < 5; i++) {
  const { hash, image } = rowInners[i];
  const first = modules[i * 2];
  const second = modules[i * 2 + 1];
  const firstColCss = i === 0 ? COL_INNER_CSS_VERYFIRST : COL_INNER_CSS_FIRST;
  originalSection += rowInnerOpen(hash, image);
  originalSection += buildModuleBlock(first, firstColCss);
  originalSection += buildModuleBlock(second, COL_INNER_CSS_SECOND);
  originalSection += `[/vc_row_inner]`;
}
originalSection += `[/vc_column][/vc_row]`;

const ORIGINAL_BUTTON_BLOCK =
  `<div class="vc_empty_space"></div>\r\n<div class="wpb_text_column wpb_content_element">\r\n<div class="wpb_wrapper">\r\n<p style="text-align: center;"><a href="https://mia.garnishmusicproduction.com/product/electronic-music-dj-course/" target="_blank" rel="noopener noreferrer"><picture class="aligncenter wp-image-10439 size-medium" data-od-replaced-sizes="(max-width: 300px) 100vw, 300px" data-od-xpath="/HTML/BODY/DIV[@class='mkd-wrapper']/*[1][self::DIV]/*[4][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[3][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[3][self::DIV]/*[1][self::DIV]/*[1][self::P]/*[1][self::A]/*[1][self::IMG]"><source srcset="/api/media/file/See-Schedule-300x114.gif.webp 300w, /api/media/file/See-Schedule-170x65.gif.webp 170w" type="image/webp" sizes="(782px &lt; width) 1300px, (max-width: 300px) 100vw, 300px" data-lazy-srcset="/api/media/file/See-Schedule-300x114.gif.webp 300w, /api/media/file/See-Schedule-170x65.gif.webp 170w" /><img class="entered lazyloaded" src="/api/media/file/See-Schedule-300x114-1.gif" sizes="(782px &lt; width) 1300px, (max-width: 300px) 100vw, 300px" srcset="/api/media/file/See-Schedule-300x114-1.gif 300w, /api/media/file/See-Schedule-170x65.gif 170w" alt="" width="300" height="114" data-od-replaced-sizes="(max-width: 300px) 100vw, 300px" data-od-xpath="/HTML/BODY/DIV[@class='mkd-wrapper']/*[1][self::DIV]/*[4][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[3][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[3][self::DIV]/*[1][self::DIV]/*[1][self::P]/*[1][self::A]/*[1][self::IMG]" data-lazy-srcset="/api/media/file/See-Schedule-300x114-1.gif 300w, /api/media/file/See-Schedule-170x65.gif 170w" data-lazy-sizes="(782px &lt; width) 1300px, (max-width: 300px) 100vw, 300px" data-lazy-src="/api/media/file/See-Schedule-300x114-1.gif" data-ll-status="loaded" /></picture></a></p>\r\n\r\n</div>\r\n</div>\r\n`;

// --- Anchors matching what the accordion-building script left behind ---
const NEW_SECTION_START_ANCHOR = `[vc_row content_width="grid"][vc_column][vc_column_text css=""]\n<h2 style="text-align: center">Electronic DJ Course Syllabus</h2>`;
const NEW_SECTION_END_MARKER = `[vc_row content_width="grid" css=".vc_custom_1735819130193`;
const EMPTY_BUTTON_SLOT = `<div class="vc_empty_space"></div>\r\n<div class="wpb_text_column wpb_content_element">\r\n<div class="wpb_wrapper">\r\n<p style="text-align: center;"><a href="https://mia.garnishmusicproduction.com/product/electronic-music-dj-course/" target="_blank" rel="noopener noreferrer">`;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 });
  let raw = page.wpRawContent as string;

  const newSectionStart = raw.indexOf(NEW_SECTION_START_ANCHOR);
  if (newSectionStart === -1) {
    console.error("Accordion section not found (already reverted?) - aborting without changes.");
    process.exit(1);
  }
  const newSectionEnd = raw.indexOf(NEW_SECTION_END_MARKER, newSectionStart);
  if (newSectionEnd === -1) {
    console.error("Accordion section end marker not found - aborting.");
    process.exit(1);
  }
  raw = raw.slice(0, newSectionStart) + originalSection + raw.slice(newSectionEnd);

  // Re-insert the "See Schedule" button where the empty [vc_column_text] slot is
  const buttonSlot = raw.indexOf(`[vc_empty_space height="20"][vc_column_text css=""]\r\n[/vc_column_text][mkd_separator`);
  if (buttonSlot === -1) {
    console.error("Empty button slot not found - aborting.");
    process.exit(1);
  }
  const slotAnchor = `[vc_column_text css=""]\r\n[/vc_column_text]`;
  const slotIdx = raw.indexOf(slotAnchor, buttonSlot);
  raw = raw.slice(0, slotIdx) + `[vc_column_text css=""]\r\n` + ORIGINAL_BUTTON_BLOCK + `[/vc_column_text]` + raw.slice(slotIdx + slotAnchor.length);

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: raw },
  });

  console.log("Restored page", PAGE_ID, "- new length:", raw.length);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
