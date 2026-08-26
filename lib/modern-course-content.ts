// Pulls readable sections (heading + body paragraphs) out of a migrated
// WPBakery/VC shortcode string (page.wpRawContent) for course pages. Course
// content is far denser than the contact page's simple key/value shortcodes
// - nested vc_row/vc_column layout wrappers around genuine paragraph HTML,
// with the odd [mkd_icon ...] shortcode used inline as a bullet marker - so
// rather than trying to reproduce that layout, this extracts the actual
// editorial content (what a [mkd_section_title] heading introduces, and the
// paragraph text under it) and leaves all VC layout/styling behind. The
// surviving <p>/<strong>/<em>/<a> markup is real content authors wrote, so
// it's rendered as-is (same trust level as every other CMS rich-text field
// in this app), not literal WP theme markup.
export type CourseSection = { heading: string; bodyHtml: string };

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    // Some headings are already wrapped in a real <strong> tag AND have
    // literal "**" markdown-style bold markers typed inside it (e.g. la's
    // academy page: "**Apply by Sept 7...**") - redundant since the <strong>
    // already bolds it, and left as literal asterisks in the rendered text
    // otherwise.
    .replace(/\*\*(.+?)\*\*/g, "$1");
}

// Some content was pasted in from an editor that stamps every span with
// data-start/data-end character-offset attributes (meaningless outside that
// tool) - strip attributes from the handful of inline tags this content
// actually uses, keeping only the ones a link needs to function.
function stripCruftAttributes(html: string): string {
  return html
    .replace(/<(strong|em|p)[^>]*>/gi, "<$1>")
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1" target="_blank" rel="noopener">');
}

// Content bodies link to WordPress's own raster "CONNECT" button graphic
// (theme-uploaded /api/media/file/connect-button*.png, a rounded 3D pill)
// as the in-flow CTA - exactly the WP-theme visual weight this rebuild is
// meant to shed. Swaps it for a real button in the same accent styling as
// every other CTA on these pages (Enroll Now, Send us a message), keeping
// the real href so the link itself still works. Same class string used
// verbatim for every course/program page, so Tailwind's build-time scan of
// this file picks it up once for all of them.
// text-black is !important: the section wrapper's own [&_a]:text-accent
// rule (ModernCoursePage's prose-modern class, giving in-body links their
// accent color) is a two-class descendant selector, which beats a plain
// .text-black utility on specificity - without !important this button's
// label renders as accent-green text on an accent-green background.
const CONNECT_BUTTON_CLASSES =
  "inline-block no-underline gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] !text-black font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors";

function restyleLegacyConnectButton(html: string): string {
  return html.replace(
    /<a href="([^"]*)"[^>]*>\s*<img[^>]*src="[^"]*connect-button[^"]*"[^>]*>\s*<\/a>/gi,
    `<a href="$1" target="_blank" rel="noopener" class="${CONNECT_BUTTON_CLASSES}">Connect</a>`
  );
}

function stripShortcodesExceptIcon(s: string): string {
  return s.replace(/\[\/?(?!mkd_icon\b)[a-z_][a-z0-9_]*(?:\s[^\]]*)?\]/gi, "");
}

// A [mkd_icon ...] shortcode is used two different ways in this content: a
// single one inline as a plain bullet accent ("→ Shake hands with Ableton"),
// or - as with FL Studio's menu-bar rundown - several in a row, one per
// newline-separated line, meant as a real bulleted list ("File Menu / Edit
// Menu / Add Menu / ..."). Collapsing the second case to inline "→" text the
// way the first case works runs every item together into one unreadable
// arrow-chain, since HTML collapses the source newlines between them - so
// 2+ icons in a paragraph render as an actual <ul> instead.
function iconParagraphToHtml(p: string): string {
  const iconCount = (p.match(/\[mkd_icon[^\]]*\]/gi) || []).length;
  if (iconCount >= 2) {
    const items = p
      .split(/\[mkd_icon[^\]]*\]/gi)
      .map((s) => decodeEntities(stripShortcodesExceptIcon(s).replace(/<[^>]+>/g, "")).trim())
      .filter(Boolean);
    if (!items.length) return "";
    return `<ul class="space-y-2 my-4">${items
      .map((i) => `<li class="flex gap-2"><span class="text-[var(--gmpm-accent)]">→</span><span>${i}</span></li>`)
      .join("")}</ul>`;
  }
  // A literal "•" character (each one individually wrapped in its own
  // <span style="color: ...">) used the same inline-bullet-list way, e.g.
  // la academy's "Course Highlights: 360 Hrs • Music Production, Sound
  // Design... • Grammy Nominated... • ..." - tags are stripped from the
  // whole paragraph before splitting (not per-segment like the [mkd_icon]
  // case above) since the bullet marker itself sits inside a <span> here.
  // Any lead-in text before the first bullet (e.g. "Course Highlights: 360
  // Hrs") becomes its own bold line instead of a bullet item.
  const plainText = decodeEntities(stripShortcodesExceptIcon(p).replace(/<[^>]+>/g, ""));
  const bulletCount = (plainText.match(/•/g) || []).length;
  if (bulletCount >= 2) {
    const [lead, ...items] = plainText.split("•").map((s) => s.trim()).filter(Boolean);
    if (items.length) {
      const leadHtml = lead ? `<p class="font-semibold text-[var(--gmpm-text)] mb-2">${lead}</p>` : "";
      const listHtml = `<ul class="space-y-2 my-4">${items
        .map((i) => `<li class="flex gap-2"><span class="text-[var(--gmpm-accent)]">→</span><span>${i}</span></li>`)
        .join("")}</ul>`;
      return leadHtml + listHtml;
    }
  }
  const text = decodeEntities(stripShortcodesExceptIcon(p).replace(/\[mkd_icon[^\]]*\]/gi, "→ ")).trim();
  return text && text !== "→" ? `<p>${text}</p>` : "";
}

// The FL Studio course page's content runs its marketing copy, then an
// internal-looking menu-by-menu UI walkthrough ("Main Menu Bar" ->
// File/Edit/Add/... Menu, then half a dozen more <h3>s, most with no content
// under them at all) - unlike the short, complete bullet lists elsewhere
// (e.g. Ableton's "Shake hands with Ableton" list), this reads as leftover
// outline notes rather than finished page copy, and was asked to be removed
// outright rather than reformatted. It's a span in the middle of the
// section, not its tail: real content (duration/pricing copy, the CONNECT
// button) follows it, so this skips from the start heading up to - but not
// including - the first plain-text paragraph after it (every paragraph
// inside the outline is [mkd_icon]-bulleted; the real copy that resumes
// after it isn't), rather than stopping extraction outright.
const SKIP_FROM_HEADING = /^main menu bar$/i;

// A plain WPBakery/HTML <ul>/<ol><li> list (as opposed to the
// [mkd_icon]-bulleted paragraphs iconParagraphToHtml handles) - e.g. a
// "You'll learn how to:" list sitting between two <p> tags, or la academy
// page's numbered "Enrollment Steps (1-2-3)" <ol>. Same visual treatment
// (an arrow bullet) for both - the numbering itself isn't the point, the
// step order already reads fine as prose-adjacent bullets.
function plainListToHtml(li: string): string {
  const items = [...li.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim())
    .filter(Boolean);
  if (!items.length) return "";
  return `<ul class="space-y-2 my-4">${items
    .map((i) => `<li class="flex gap-2"><span class="text-[var(--gmpm-accent)]">→</span><span>${i}</span></li>`)
    .join("")}</ul>`;
}

// A WP-theme comparison graphic (a white card, Garnish LA vs. Others/Online
// Tutorials, five rows of green checks/red X's), reused as-is across every
// course/program page whose "Why choose X course at Garnish?" section has
// one - confirmed via a network-wide scan of every page referencing any of
// these three image ids. Three near-identical variants exist (same
// filename prefix "Asset-N-..."), differing only in the training-center and
// events rows: "Asset 1 Generic" (id 18427, most pages), "Asset 2 Logic"
// (18428, Logic/Pro Tools/FL Studio pages - reusing the Logic-branded one
// rather than having their own), and "Asset 3 Ableton" (18429, Ableton
// pages). Transcribed directly off each image (not invented) and rebuilt
// as a real themed block below (see bareImageToHtml's own
// gmpm-comparison-table check) rather than left as a plain screenshot,
// which never blended into this design's near-black background no matter
// how it was styled - and because every page shares one of these three
// image ids, fixing it here fixes it everywhere at once rather than
// needing a per-page override.
const COMPARISON_VARIANTS: Record<string, string[]> = {
  "18427": [
    "Real-time Feedback & Collaboration",
    "Fully Equipped Pro Studios",
    "Ableton & Apple Certified Training Center",
    "Award Winning Instructors",
    "Exclusive LA Events & Master Classes",
  ],
  "18428": [
    "Real-time Feedback & Collaboration",
    "Fully Equipped Pro Studios",
    "Apple Certified Training Center",
    "Award Winning Instructors",
    "Preferred access to Garnish LA events.",
  ],
  "18429": [
    "Real-time Feedback & Collaboration",
    "Fully Equipped Pro Studios",
    "Ableton Certified Training Center",
    "Award Winning Instructors",
    "Preferred access to Garnish LA events.",
  ],
};

function comparisonTableHtml(rows: string[]): string {
  const rowsHtml = rows.map(
    (label) => `<div class="grid grid-cols-[1fr_88px_88px] items-center gap-4 px-5 py-3 border-t border-[var(--gmpm-line)]">
      <span>${label}</span>
      <span class="justify-self-center text-[var(--gmpm-accent)] text-lg leading-none">&#10003;</span>
      <span class="justify-self-center text-[var(--gmpm-text-dim)] text-lg leading-none opacity-60">&#10005;</span>
    </div>`
  ).join("");
  return `<div class="not-prose my-6 gmpm-corner border border-[var(--gmpm-line)]">
    <div class="grid grid-cols-[1fr_88px_88px] items-center gap-4 px-5 py-4">
      <span class="gmpm-mono text-xs uppercase text-[var(--gmpm-text-dim)]">Side-by-Side Overview</span>
      <span class="justify-self-center gmpm-mono text-xs uppercase text-[var(--gmpm-accent)]">Garnish LA</span>
      <span class="justify-self-center gmpm-mono text-xs uppercase text-[var(--gmpm-text-dim)]">Others</span>
    </div>
    ${rowsHtml}
  </div>`;
}

// A bare <img> sitting directly in the flow with no <p>/<div> wrapper at
// all - e.g. la's academy page has two certification-logo images
// (Ableton/Apple) sitting as plain siblings between two paragraphs. Images
// already inside a <p> survive automatically (iconParagraphToHtml doesn't
// strip inner HTML tags), so this only needs to handle the bare case.
function bareImageToHtml(imgTag: string): string {
  // See resolveSingleImages and comparisonTableHtml - one of the three
  // COMPARISON_VARIANTS ids is spliced in as this marker (carrying its own
  // id in data-variant) specifically so it survives extractParagraphs's own
  // bare-<img> block matching, then swapped for the real themed table here.
  const variantMatch = imgTag.match(/gmpm-comparison-table[^>]*\bdata-variant="(\d+)"/);
  if (variantMatch) return comparisonTableHtml(COMPARISON_VARIANTS[variantMatch[1]] ?? []);
  // resolveSingleImages already produced a fully-styled <img> (see its own
  // gmpm-resolved-image marker) for a [vc_single_image] shortcode - e.g. a
  // full photo or graphic, sized and styled on its own terms. Passed
  // through untouched rather than rebuilt below, which would both shrink
  // it (the small-logo max-h-12 sizing) and run it through the
  // invert-to-white filter meant for dark logo marks - applied to a real
  // photo, that filter blows every photo out to a featureless gray block.
  if (imgTag.includes("gmpm-resolved-image")) return imgTag;
  const src = imgTag.match(/\bsrc="([^"]*)"/i)?.[1];
  if (!src) return "";
  const alt = imgTag.match(/\balt="([^"]*)"/i)?.[1] || "";
  // Anything else reaching here is a bare, unstyled <img> straight from
  // wpRawContent - every case seen so far is a small certification-badge
  // logo (la academy's Ableton/Apple marks): dark marks on a transparent
  // background, drawn for the legacy theme's light page background and
  // otherwise unreadable against this design's near-black one. Inverted to
  // full-white (no opacity dimming) so the mark reads exactly as bright as
  // the real white heading text next to it, instead of a dimmer gray.
  // mb-6 (rather than a symmetric my-2) - the next block down is usually
  // the "Apply"/"Enroll now" CTA link, which reads as cramped sitting right
  // under the badge with only a small symmetric margin.
  return `<img src="${src}" alt="${decodeEntities(alt)}" class="max-h-12 w-auto inline-block mt-2 mb-6 mr-6 [filter:brightness(0)_invert(1)]" />`;
}

// The FAQ accordion's own answer text (a <p> inside each [mkd_accordion_tab])
// was getting picked up a second time here as if it were regular body
// content - extractFaqs already reads this same content properly for the
// FAQ section, so the plain paragraph-matching below needs to skip over it
// rather than also capturing it as an orphaned, question-less paragraph.
function stripAccordionBlocks(s: string): string {
  return s.replace(/\[mkd_accordion\b[^\]]*\][\s\S]*?\[\/mkd_accordion\]/gi, "");
}

// A [vc_column_text] block whose editorial copy was pasted in as plain
// blank-line-separated text with no <p> wrapper at all (unlike the shape
// extractParagraphs's main loop matches, which needs real <p>/<h3>/<ul>
// tags to find anything) - confirmed on hou's electronic-sound-art page,
// where the whole marketing intro is written this way and the main loop
// above returns nothing for it. Same blank-line-splitting technique as
// extractCourseIntro uses for the older intro/curriculum shape.
function extractBareParagraphs(rawChunk: string): string {
  const m = rawChunk.match(/\[vc_column_text[^\]]*\]([\s\S]*?)\[\/vc_column_text\]/i);
  if (!m) return "";
  // A vc_column_text block with real <p> tags is already handled by the
  // main regex loop - this fallback only applies when that loop found
  // nothing to match on.
  if (/<p[^>]*>/i.test(m[1])) return "";
  const paragraphs = m[1]
    .split(/\n\s*\n/)
    .map((line) => decodeEntities(stripShortcodesExceptIcon(line).replace(/<[^>]+>/g, "")).trim())
    .filter((line) => line.length > 3 && !/^\d{1,4}$/.test(line));
  if (!paragraphs.length) return "";
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

// Converts a raw chunk of WPBakery content (which mixes literal paragraph
// HTML with bracket shortcodes) into safe, readable HTML: <h1>-<h4>
// sub-headings become sub-heading markup, <p> content becomes either a
// paragraph or a bullet list (see iconParagraphToHtml), a plain <ul>/<ol>
// becomes the same bullet-list markup, a bare <img> (no wrapping tag at
// all) is kept as an image, a bare styled <div> (see its own branch below)
// is treated the same as a <p>, every other [shortcode] token is stripped,
// and the wpb_text_column/wpb_wrapper divs WPBakery puts around every text
// block are left behind since only these tags are read out of them.
// Capture groups, by index: 1 heading (<h1>-<h4>), 2 <ol>, 3 <ul>, 4 <p>,
// 5 bare <img>, 6 bare styled <div> (numbered rather than named - this
// repo's ts target predates ES2018 named capture groups).
// The <p> alternative's own capture is bounded the same defensive way the
// <div> one already is (stopping early on a nested <p rather than
// swallowing forward into it) - confirmed necessary on
// songcraft-production-program's real content: a <p style="text-align:
// left"> wrapping [mkd_accordion]...[/mkd_accordion] is missing its own
// closing </p> in the source (a genuine authoring mistake), which let the
// old non-greedy [\s\S]*? match run straight past it into the *next* real
// paragraph's own <p> tag, embedding it as literal unescaped text inside
// this one - invalid nested-<p> HTML that produced a real hydration
// mismatch (the browser's own HTML parser silently closes a <p> the moment
// it hits a nested one, which doesn't match what the literal string, and so
// React's SSR/hydration comparison, expected). Now the malformed <p> simply
// matches nothing (its own stray content, always just leftover whitespace
// once the accordion is stripped, is correctly dropped) instead of
// corrupting the paragraph after it.
const BLOCK_RE =
  /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>|<ol[^>]*>([\s\S]*?)<\/ol>|<ul[^>]*>([\s\S]*?)<\/ul>|<p[^>]*>((?:(?!<p[^>]*>|<\/p>)[\s\S])*?)<\/p>|(<img\b[^>]*>)|<div\b[^>]*\bstyle="text-align:\s*(?:left|center)"[^>]*>((?:(?!<div|<ul|<ol|<p\b)[\s\S])*?)<\/div>/gi;

function extractParagraphs(rawChunk: string): string {
  const blocks: string[] = [];
  let skipping = false;
  for (const m of stripAccordionBlocks(rawChunk).matchAll(BLOCK_RE)) {
    const [, heading, ol, ul, p, img, div] = m;
    if (heading !== undefined) {
      const headingText = decodeEntities(heading.replace(/<[^>]+>/g, "")).trim();
      if (SKIP_FROM_HEADING.test(headingText)) skipping = true;
      if (!skipping && headingText)
        blocks.push(`<h4 class="gmpm-display font-bold text-lg mt-8 mb-3">${headingText}</h4>`);

      // This content alternates between two-column rows where one column's
      // [mkd_icon]-bulleted text sits inside a <p> (handled below via the
      // regular <p> match) and the other column's identical bullet list sits
      // bare, straight after the heading with no <p> wrapper at all - the
      // same icon-list content, just missing the tag the main loop matches
      // on. Caught here by looking ahead to the next real tag boundary and
      // treating that span as an icon list if it has no <p>/<ul> of its own.
      if (!skipping) {
        const afterHeading = (m.index ?? 0) + m[0].length;
        const nextTag = rawChunk
          .slice(afterHeading)
          .search(/<h[1-4][^>]*>|<p[^>]*>|<ul[^>]*>|<ol[^>]*>|\[\/vc_column_text\]/i);
        const bareSpan = rawChunk.slice(afterHeading, nextTag === -1 ? undefined : afterHeading + nextTag);
        if (/\[mkd_icon/i.test(bareSpan)) {
          const html = iconParagraphToHtml(bareSpan);
          if (html) blocks.push(html);
        }
      }
    } else if (ol !== undefined) {
      if (skipping) continue;
      const html = plainListToHtml(ol);
      if (html) blocks.push(html);
    } else if (ul !== undefined) {
      if (skipping) continue;
      const html = plainListToHtml(ul);
      if (html) blocks.push(html);
    } else if (img !== undefined) {
      if (skipping) continue;
      const html = bareImageToHtml(img);
      if (html) blocks.push(html);
    } else if (p !== undefined) {
      if (skipping) {
        if (!/\[mkd_icon[^\]]*\]/i.test(p)) skipping = false;
        else continue;
      }
      const html = iconParagraphToHtml(p);
      if (html) blocks.push(html);
    } else if (div !== undefined) {
      if (skipping) continue;
      // A bare styled <div> holding real editorial copy with no <p> wrapper
      // at all - e.g. la homepage's "Degree Programs"/"Social Media and
      // Branding" cards, previously dropped entirely (invisible to every
      // branch above, and extractBareParagraphs's own fallback never ran
      // here since these rows already have other real blocks, like the
      // "Apply" button paragraph). Wrapped as a plain <p> - none of these
      // divs use "•"/[mkd_icon] bullet markers, so iconParagraphToHtml's
      // own splitting doesn't apply, and rendering it as a <p> lets
      // bulletizeIfProseOnly (offering cards only) find and reformat it the
      // same as any other descriptive paragraph.
      const text = decodeEntities(div.replace(/<[^>]+>/g, "")).trim();
      if (text) blocks.push(`<p>${text}</p>`);
    }
  }
  if (!blocks.length) {
    const bare = extractBareParagraphs(rawChunk);
    if (bare) blocks.push(bare);
  }
  return restyleLegacyConnectButton(stripCruftAttributes(blocks.join("")));
}

// These pages reuse a handful of boilerplate section labels
// (Testimonials/Our Instructors/From The Blog/Our Partners) as generic
// wrappers around whatever unrelated content (pricing, other cities'
// schedules, a stray cross-site quote, raw partner-logo [vc_single_image]s)
// happened to follow them during migration - the label and body don't
// actually correspond. la's homepage own "Our partners" row is exactly this
// case: a real <h2>Our partners</h2> followed by [vc_single_image] logo
// shortcodes this extractor doesn't resolve, which - since those ids
// happen to get resolved to real <img> tags elsewhere first, for the
// *course-page* single-image pipeline - would otherwise surface as a
// second, unstyled duplicate of the logo grid ModernPartners already
// renders properly. Real per-course description content consistently comes
// first, before any of these show up, across every page checked - so stop
// extracting once one appears rather than show a mismatched heading/body
// pair (or, here, a redundant one).
// Checked as a whole-heading match, not a substring: a network-wide scan
// turned up over 200 real per-course subtitles like "Ableton Live Course |
// New York or Live Online" or "Los Angeles & Live Online" that legitimately
// mention a city/online availability as part of their own real heading text
// (a "new york"/"live online" *substring* match cut extraction short on
// essentially every la course page), and - confirmed separately - two more
// concrete collisions on the other patterns here: "testimonial" as a
// substring matched real, specific section titles like "RUMA- Student
// Testimonial" and "SongCraft Production Program Student Testimonial: James
// Salazar" (not the generic wrapper this exists to catch), and "our
// instructor" matched inside "Meet **your** instructor Kindred" purely
// because "your" ends in "our". Both cut dj-production-program and
// music-production-private-instruction's real extraction down to a single
// section. Exact-whole-heading matching avoids every one of these - the
// genuine generic wrapper labels (bare "Testimonials"/"More
// Testimonials"/"Our Instructors"/"From The Blog"/"Our Partners") never
// have any other text sharing their heading.
const BOILERPLATE_HEADING_EXACT =
  /^(new york|live online|(more\s+)?testimonials?|our instructors?|from the blog|our partners)$/i;
function isBoilerplateHeading(heading: string): boolean {
  return BOILERPLATE_HEADING_EXACT.test(heading.trim());
}

// Every course/program page (and the homepage) lays its content out as a
// sequence of top-level [vc_row]...[/vc_row] blocks, one real topic per row
// (intro, pricing/enrollment, instructors, syllabus, testimonials, ...) -
// confirmed network-wide across every course/program page checked. This is
// the page's own real section boundary, independent of which heading shape
// a given row happens to use inside it (see extractRowHeading). vc_row_inner
// (nested layout rows within a row) is deliberately NOT matched here - its
// own shortcode name and closing tag differ enough (a trailing "_inner")
// that this regex/indexOf pairing already skips right over it.
function splitTopLevelRows(raw: string): string[] {
  const rows: string[] = [];
  const openRe = /\[vc_row(?![a-zA-Z_])[^\]]*\]/gi;
  let match: RegExpExecArray | null;
  while ((match = openRe.exec(raw))) {
    const openEnd = match.index + match[0].length;
    const closeIdx = raw.indexOf("[/vc_row]", openEnd);
    if (closeIdx === -1) break;
    // NOT filtered by disable_element="yes" despite the name suggesting a
    // "don't render this row" flag - confirmed most rows carrying it (la
    // homepage's own Degree Programs, Upcoming Free Event, Express Courses,
    // Private Instruction, 1-on-1 rows among them) are real, live content
    // every other extractor here already surfaces correctly; whatever this
    // attribute actually toggles in the legacy WPBakery editor, it isn't
    // frontend visibility for this content. Only one row on this page is
    // genuinely a leftover to skip (see extractTestimonialCategorySlugs),
    // and that's handled there specifically rather than by this attribute.
    rows.push(raw.slice(openEnd, closeIdx));
    openRe.lastIndex = closeIdx + "[/vc_row]".length;
  }
  return rows;
}

// A few pages use a bare "-" as a purely visual section divider with no
// real title - not content, so it shouldn't act as this row's heading.
const BARE_DIVIDER = /^[-–—.]*$/;

// The generic "<City> & Live Online" (or bare "Live Online") subtitle almost
// every row's title chain ends with - real content never follows it (see
// isBoilerplateHeading's own "new york"/"live online" exact-match case), so
// it's safe to drop outright rather than surface as a tagline.
const CITY_AVAILABILITY_SUBTITLE = /^(?:[\w\s]+\s*&\s*)?live\s*online$/i;

// An internal editorial breadcrumb note left in place of a real subtitle
// (confirmed on Express Courses: "Go to Main Menu> Programs> Express
// Courses") - a note to whoever edits this content next, not real page copy
// meant for a visitor to read.
const EDITORIAL_NOTE_SUBTITLE = /^go to\b/i;

// A row's own heading is either a [mkd_section_title] shortcode (sometimes
// several back to back - a "Title" then one or more "Subtitle"s with
// nothing of their own between them, e.g. "360 Los Angeles Academy" ->
// "Los Angeles & Live Online", or "Certificate in Music Production and
// Songwriting" -> "1 Year in Los Angeles" -> "International F1 Eligible
// through CCM" - the first, most descriptive one is kept as the label, and
// real body content is read starting after the last one), or, when a row
// has none of those at all, its first literal <h1>/<h2>/<h3> tag (<h4> is
// never this row's own topic heading - see extractParagraphs, which demotes
// every *other* heading found within a row's body to <h4> sub-headings of
// whichever of these two came first, e.g. a pricing row's own "$2250
// Tuition..." <h1> and "Enrollment Steps" <h3> both nest under the row's
// first <h1> this way). Any subtitle beyond the first two - and the first
// subtitle itself when it isn't the generic city/availability one - is real,
// specific info (a program's own eligibility/duration tagline, an event's
// own subtitle, ...), returned separately as `taglines` for callers that
// want to actually show it, rather than silently discarding it the way this
// function's own two return fields (heading/contentStart) always have.
function extractRowHeading(
  row: string
): { heading: string; contentStart: number; taglines: string[] } | null {
  const titleMatches = [...row.matchAll(/\[mkd_section_title[^\]]*\btitle_text="([^"]*)"[^\]]*\]/gi)].filter(
    (m) => !BARE_DIVIDER.test(decodeEntities(m[1] || "").trim())
  );
  if (titleMatches.length > 0) {
    const heading = decodeEntities(titleMatches[0][1] || "").trim();
    const last = titleMatches[titleMatches.length - 1];
    const taglines = titleMatches
      .slice(1)
      .map((m) => decodeEntities(m[1] || "").trim())
      .filter((t) => t && !CITY_AVAILABILITY_SUBTITLE.test(t) && !EDITORIAL_NOTE_SUBTITLE.test(t));
    return heading ? { heading, contentStart: (last.index ?? 0) + last[0].length, taglines } : null;
  }
  const hMatch = row.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  if (!hMatch) return null;
  const heading = decodeEntities(hMatch[1].replace(/<[^>]+>/g, "")).trim();
  return heading ? { heading, contentStart: (hMatch.index ?? 0) + hMatch[0].length, taglines: [] } : null;
}

// Every course/program page's "Our Students Say" section carries the exact
// same hardcoded Paris Hilton quote (confirmed via a full sweep of all 20
// staging course/program pages - only the DJ-related pages actually fit the
// quote's own "Garnish DJ Program" attribution). Matched against the
// processed <p> output (post extractParagraphs), not the raw wp content, so
// it's immune to the raw markup's own minor inconsistencies (e.g.
// summer-camp-school's trailing semicolons on its style attributes).
export function stripParisHiltonQuote(bodyHtml: string): string {
  return bodyHtml.replace(
    /<p>[^<]*Everything went really well in Ibiza[^<]*<\/p>\s*<p><strong>Paris Hilton<\/strong>[^<]*<\/p>/i,
    ""
  );
}

export function extractCourseSections(wpRawContent: string, limit = 6): CourseSection[] {
  const raw = wpRawContent || "";
  const sections: CourseSection[] = [];
  for (const row of splitTopLevelRows(raw)) {
    if (sections.length >= limit) break;
    const parsed = extractRowHeading(row);
    if (!parsed) continue;
    // Only treat a boilerplate-looking heading as the real cutoff once at
    // least one real section has already been captured - some la pages'
    // course-title + city/online-availability subtitle pair (e.g.
    // composing-and-media-scoring's own subtitle is the bare "Live Online",
    // not "<City> & Live Online" like most others) would otherwise get
    // mistaken for the wrapper this check exists to catch, before any real
    // content has even been seen. Real boilerplate sections (Testimonials
    // etc.) only ever show up after genuine course content, never as the
    // first or second row on the page.
    if (sections.length > 0 && isBoilerplateHeading(parsed.heading)) break;
    const bodyHtml = extractParagraphs(row.slice(parsed.contentStart));
    if (!bodyHtml) continue;
    sections.push({ heading: parsed.heading, bodyHtml });
  }
  return sections;
}

// la's homepage presents each real offering (Degree Programs, the 360
// Academy, each of the four Music Production Programs sub-cards, ...) as an
// image + text pair: [mkd_elements_holder] with two items - the first just a
// bare background_image (the real photo, no content of its own), the second
// holding the real copy in [vc_column_text]. The second item's own
// background_image (always id 16855 in practice) is a decorative doodle
// graphic behind the text, not a real content photo - distinguished from the
// real photo item below by requiring background_image to be the shortcode's
// very first attribute, which only the real-photo item's tag has (the
// decorative one always starts with background_color first).
export type OfferingCard = { heading: string; bodyHtml: string; imageId: string | null };
export type OfferingGroup = { groupHeading: string; cards: OfferingCard[] };

// Splits flowing prose into individual sentences on simple ./!/? boundaries
// (no lookbehind - unsupported by this repo's pre-ES2018 ts target). Good
// enough for the short, clean marketing copy this is used on; not meant to
// handle abbreviations or decimals in general prose.
function splitIntoSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [text]).map((s) => s.trim()).filter(Boolean);
}

// Most offering cards' real description already comes from a genuine <ul>
// (Course Highlights, curriculum items, ...), rendered with the same arrow
// bullets used everywhere else in this design. A handful (la homepage's
// "Degree Programs", "Social Media and Branding for Artists", "Express
// Courses", ...) only ever had a single flowing paragraph in the CMS -
// split into one bullet per sentence here so those cards read the same
// scannable way as their neighbors instead of standing out as the only
// dense wall of text on the page. Only the longest paragraph (the real
// description) is touched - short CTA-only paragraphs like "Apply" or
// "Book Now!" are left alone. Tags are stripped from that paragraph before
// splitting (the same tradeoff iconParagraphToHtml's own "•" splitting
// already makes) - naive sentence-boundary matching on raw HTML risks
// splitting mid-tag or mid-URL.
function bulletizeIfProseOnly(bodyHtml: string): string {
  if (/<ul[\s>]/i.test(bodyHtml)) return bodyHtml;
  let longest: { match: string; text: string } | null = null;
  for (const m of bodyHtml.matchAll(/<p>([\s\S]*?)<\/p>/gi)) {
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim();
    if (!longest || text.length > longest.text.length) longest = { match: m[0], text };
  }
  if (!longest) return bodyHtml;
  const sentences = splitIntoSentences(longest.text);
  if (sentences.length < 2) return bodyHtml;
  const ul = `<ul class="space-y-2 my-4">${sentences
    .map((s) => `<li class="flex gap-2"><span class="text-[var(--gmpm-accent)]">→</span><span>${s}</span></li>`)
    .join("")}</ul>`;
  return bodyHtml.replace(longest.match, ul);
}

// A row can hold more than one image+text pair - the "Music Production
// Programs" row has four, one per sub-program, each with its own <h2> (e.g.
// "Ableton Production Program") inside its own [vc_column_text]. Only in
// that multi-card case is the per-card heading pulled out of the card's own
// content; a single-card row's [vc_column_text] never has a heading of its
// own (the row's own [mkd_section_title] already names it), and pulling a
// misc inline heading out of it there would just discard that real title in
// favor of a less specific one, the same mislabeling extractCourseSections's
// own row-splitting was built to avoid.
// A tagline (see extractRowHeading) rendered the same bold-intro-line way a
// card's own inline sub-headings already are, right at the top of the body
// - e.g. Certificate's real "1 Year in Los Angeles" / "International F1
// Eligible through CCM" lines, previously discarded entirely.
function taglinesToHtml(taglines: string[]): string {
  return taglines.map((t) => `<p class="font-semibold text-[var(--gmpm-text)]">${t}</p>`).join("");
}

function extractOfferingCardsFromRow(row: string, rowHeading: string, rowTaglines: string[]): OfferingCard[] {
  const matches = [...row.matchAll(/\[mkd_elements_holder_item\s+background_image="(\d+)"/gi)];
  if (matches.length === 0) return [];
  if (matches.length === 1) {
    const imageId = matches[0][1];
    const bodyHtml = bulletizeIfProseOnly(
      taglinesToHtml(rowTaglines) + extractParagraphs(row.slice((matches[0].index ?? 0) + matches[0][0].length))
    );
    return bodyHtml ? [{ heading: rowHeading, bodyHtml, imageId }] : [];
  }
  const cards: OfferingCard[] = [];
  for (let i = 0; i < matches.length; i++) {
    const imageId = matches[i][1];
    const chunkStart = (matches[i].index ?? 0) + matches[i][0].length;
    const chunkEnd = matches[i + 1]?.index ?? row.length;
    const chunk = row.slice(chunkStart, chunkEnd);
    const inner = extractRowHeading(chunk);
    const heading = inner?.heading || `${rowHeading} ${i + 1}`;
    const bodyHtml = bulletizeIfProseOnly(
      taglinesToHtml(inner?.taglines ?? []) + extractParagraphs(inner ? chunk.slice(inner.contentStart) : chunk)
    );
    if (bodyHtml) cards.push({ heading, bodyHtml, imageId });
  }
  return cards;
}

// One group per real top-level row, each with the one or more offering
// cards found in it - a single-card row's card always shares the group's own
// heading (see extractOfferingCardsFromRow), so callers only need to render
// a separate group label above a group's cards when it holds more than one.
export function extractHomepageOfferings(wpRawContent: string): OfferingGroup[] {
  const raw = wpRawContent || "";
  const groups: OfferingGroup[] = [];
  for (const row of splitTopLevelRows(raw)) {
    const parsed = extractRowHeading(row);
    if (!parsed) continue;
    if (groups.length > 0 && isBoilerplateHeading(parsed.heading)) break;
    const cards = extractOfferingCardsFromRow(row, parsed.heading, parsed.taglines);
    if (cards.length > 0) {
      groups.push({ groupHeading: parsed.heading, cards });
      continue;
    }
    // No real photo in this row (e.g. Express Courses) - still a real
    // offering, just text-only, matching extractCourseSections's own
    // fallback for the same case.
    const bodyHtml = bulletizeIfProseOnly(
      taglinesToHtml(parsed.taglines) + extractParagraphs(row.slice(parsed.contentStart))
    );
    if (bodyHtml) groups.push({ groupHeading: parsed.heading, cards: [{ heading: parsed.heading, bodyHtml, imageId: null }] });
  }
  return groups;
}

// [mkd_testimonials category="logic-pro"] - a widget pulling real reviews
// from the `testimonials` collection (author/text/image), sitting right
// after the "Our Students Say..." row's own single hand-picked quote (Paris
// Hilton on la's homepage). A page can have more than one instance, and
// each one's own category attribute can itself be a comma-separated list
// (matches lib/wp-testimonials-resolver.ts's own legacy-pipeline parsing of
// the same shortcode) - flattened here into one deduped slug list; the
// caller resolves them to real testimonial docs (see ModernHomePage, which
// - unlike that legacy resolver - doesn't filter by the *category* doc's
// own site, since staging's cloned testimonials keep pointing at la's
// original category docs rather than freshly cloned ones).
// Scoped to the row whose own heading is "Our Students Say..." (rather than
// a flat whole-content scan) - la's homepage has a second, unrelated
// [mkd_testimonials category="famous-testimonials"] instance sitting in an
// earlier row of its own (right after the "Enroll Now" banner, nothing to
// do with student reviews), which a flat scan would incorrectly fold into
// this one, mixing an unrelated testimonial set into the carousel under
// Paris Hilton's own quote.
function isStudentsSayHeading(heading: string): boolean {
  return /students say/i.test(heading);
}

export function extractTestimonialCategorySlugs(wpRawContent: string): string[] {
  const slugs = new Set<string>();
  for (const row of splitTopLevelRows(wpRawContent || "")) {
    const parsed = extractRowHeading(row);
    if (!parsed || !isStudentsSayHeading(parsed.heading)) continue;
    for (const m of row.matchAll(/\[mkd_testimonials[^\]]*\bcategory="([^"]*)"/gi)) {
      for (const slug of (m[1] || "").split(",")) {
        const trimmed = slug.trim();
        if (trimmed) slugs.add(trimmed);
      }
    }
  }
  return [...slugs];
}

// A second, older content shape some course pages use instead of
// [mkd_section_title]+<p> - a single [vc_column_text] block containing bare
// <h1>/<h2> tags and <ul><li> lists directly, with an unwrapped intro
// paragraph (plain text, blank-line separated) before the first <h2>.
export type CurriculumModule = { heading: string; items: string[] };

export function extractCurriculumModules(wpRawContent: string): CurriculumModule[] {
  const raw = wpRawContent || "";
  const modules: CurriculumModule[] = [];
  for (const m of raw.matchAll(/<h2>\s*(?:<strong>)?([^<]*?)(?:<\/strong>)?\s*<\/h2>(?:(?!<ul>)[\s\S])*?<ul>([\s\S]*?)<\/ul>/gi)) {
    const heading = decodeEntities(m[1] || "").trim();
    const items = [...m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((li) => decodeEntities(li[1].replace(/<[^>]+>/g, "")).trim())
      .filter(Boolean);
    if (heading && items.length) modules.push({ heading, items });
  }
  return modules;
}

// The free-text intro before the first <h2> in that same older shape -
// plain lines separated by blank lines, no <p> wrapper. Bare short numeric
// lines (e.g. "101", "201") are WPBakery pagination/anchor artifacts, not
// content, and are dropped.
export function extractCourseIntro(wpRawContent: string): string[] {
  const raw = wpRawContent || "";
  const columnMatch = raw.match(/\[vc_column_text\]([\s\S]*?)(?:<h2|\[\/vc_column_text\])/i);
  if (!columnMatch) return [];
  const afterH1 = columnMatch[1].replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");
  return afterH1
    .split(/\n\s*\n/)
    .map((line) => decodeEntities(line.replace(/<[^>]+>/g, "").trim()))
    .filter((line) => line.length > 3 && !/^\d{1,4}$/.test(line));
}

// "courses/" is shared in this data with instructor bio pages (migrated
// under the same WP custom post type), so slug prefix alone can't tell a
// real course page apart from e.g. "courses/dave-garnish". The site's own
// nav tree is the actual list of pages presented as courses, so walk it
// for internal /courses/... links rather than guessing from the slug or
// portfolioCategories (both of which overlap between the two page kinds).
export function collectNavCourseSlugs(menu: unknown): Set<string> {
  const slugs = new Set<string>();
  function walk(nodes: any[]) {
    for (const node of nodes || []) {
      if (typeof node?.url === "string" && node.url.startsWith("/courses/")) {
        slugs.add(node.url.replace(/^\//, "").replace(/\/$/, ""));
      }
      if (Array.isArray(node?.children)) walk(node.children);
    }
  }
  if (Array.isArray(menu)) walk(menu);
  return slugs;
}

// [mkd_accordion_tab title="Q"][vc_column_text]<p>A</p>[/vc_column_text][/mkd_accordion_tab] -
// this FAQ shortcode pattern shows up independently of which of the two
// section shapes above a page otherwise uses, so it's extracted separately
// and combined with whichever one applies.
export type Faq = { question: string; answer: string };

export function extractFaqs(wpRawContent: string): Faq[] {
  const raw = wpRawContent || "";
  const faqs: Faq[] = [];
  for (const m of raw.matchAll(/\[mkd_accordion_tab title="([^"]*)"[^\]]*\]([\s\S]*?)\[\/mkd_accordion_tab\]/gi)) {
    const question = decodeEntities(m[1] || "").trim();
    const answerMatch = m[2].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const answer = answerMatch ? decodeEntities(answerMatch[1].replace(/<[^>]+>/g, "")).trim() : "";
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

// [mkd_accordion_tab] is also used for genuinely long-form content, not
// just short FAQ answers - la's academy page has a "360 Garnish Music
// Production Academy Modules" accordion (10 modules, each a real <ul> of
// what's covered) immediately preceded by a heading whose text contains
// "Modules". extractFaqs's answer capture (a single <p>) finds nothing for
// these, so this is a separate, richer extractor: full HTML body (list or
// paragraph) per tab, kept as real markup instead of flattened to plain
// text. Deliberately excludes any tab whose own content is itself just
// another [shortcode] widget with no real <p>/<ul> of its own (e.g. the
// same accordion's trailing "Music Production Academy Blog" tab, which is
// only a [mkd_blog_list] pulling in unrelated network-wide posts).
export type AccordionModule = { title: string; bodyHtml: string };

export function extractAccordionModules(wpRawContent: string): AccordionModule[] {
  const raw = wpRawContent || "";
  const modules: AccordionModule[] = [];
  for (const m of raw.matchAll(/\[mkd_accordion_tab title="([^"]*)"[^\]]*\]([\s\S]*?)\[\/mkd_accordion_tab\]/gi)) {
    const title = decodeEntities(m[1] || "").trim();
    const bodyHtml = extractParagraphs(m[2]);
    if (title && bodyHtml) modules.push({ title, bodyHtml });
  }
  return modules;
}

// Whether wpRawContent's accordion (if any) is a curriculum/program-modules
// breakdown rather than a real FAQ - mislabeling one as the other (real
// curriculum content under a "Frequently asked questions" heading, or real
// questions under "Program modules") is exactly the bug this exists to
// avoid. Originally a keyword search (a heading containing "modules"/
// "syllabus"/"curriculum" shortly before the first [mkd_accordion_tab]),
// which missed courses/mixing-and-mastering-course entirely (its own
// modules accordion starts with no such heading at all, just straight into
// the tabs) and had no way to handle courses/k-pop-hitmaker (instructor
// bios *and* real modules share one accordion, with "Meet Your Instructors"
// - not a modules keyword - the only heading nearby). Judged instead by each
// tab's own title: a real FAQ's questions overwhelmingly end in "?"
// ("What age group is this camp for?"), while modules/syllabus/instructor-
// bio tabs (curriculum topics, people's names) essentially never do -
// confirmed against every accordion-bearing page checked, never a close
// call either way. The trailing "X Course Blog" tab (a [mkd_blog_list]
// widget, present on nearly every page) is excluded either way since it's
// neither real FAQ nor real curriculum.
export function hasModulesAccordion(wpRawContent: string): boolean {
  const raw = wpRawContent || "";
  const titles = [...raw.matchAll(/\[mkd_accordion_tab\s+title="([^"]*)"/gi)]
    .map((m) => decodeEntities(m[1] || "").trim())
    .filter((t) => t && !/\bblog$/i.test(t));
  if (titles.length === 0) return false;
  const questionLike = titles.filter((t) => t.endsWith("?")).length;
  return questionLike / titles.length < 0.5;
}

// [vc_video link="https://youtu.be/ID" title="..."] - la's academy page
// embeds two real student-testimonial YouTube videos this way. title is
// optional - individual course pages' own "quick sample" video (e.g. hip-hop
// production's) omits it entirely, and requiring it here was silently
// dropping every one of those videos. Handles both youtu.be/ID and
// youtube.com/watch?v=ID link shapes, since WPBakery's own video widget
// accepts either.
export type VideoEmbed = { embedUrl: string; title: string };

export function extractVideoEmbeds(wpRawContent: string): VideoEmbed[] {
  const raw = wpRawContent || "";
  const videos: VideoEmbed[] = [];
  for (const m of raw.matchAll(/\[vc_video\s+link="([^"]*)"[^\]]*\]/gi)) {
    const link = m[1] || "";
    const titleMatch = m[0].match(/\btitle="([^"]*)"/i);
    const title = titleMatch ? decodeEntities(titleMatch[1] || "").trim() : "";
    const idMatch = link.match(/(?:youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]{6,})/);
    if (!idMatch) continue;
    videos.push({ embedUrl: `https://www.youtube.com/embed/${idMatch[1]}`, title });
  }
  return videos;
}

// [vc_raw_html]BASE64[/vc_raw_html] - a base64-then-URL-encoded blob of
// literal HTML the WPBakery editor doesn't have a shortcode for (confirmed
// on la's homepage: an autoplay/muted/loop <video> hero background,
// "Garnish-Landing-Page-Promo-Video.mp4" - the reason that hero renders
// blank on the legacy theme locally, since autoplay video needs a moment
// even when it works). Only ever seen used for a plain <video><source>
// pair so far - returns the first real video src found, or null.
export function extractRawHtmlVideoSrc(wpRawContent: string): string | null {
  const raw = wpRawContent || "";
  for (const m of raw.matchAll(/\[vc_raw_html[^\]]*\]([A-Za-z0-9+/=]+)\[\/vc_raw_html\]/gi)) {
    try {
      const decoded = decodeURIComponent(Buffer.from(m[1], "base64").toString("utf-8"));
      const src = decoded.match(/<source[^>]*\bsrc="([^"]*\.mp4[^"]*)"/i)?.[1];
      if (src) return src;
    } catch {
      continue;
    }
  }
  return null;
}

// [mkd_portfolio_slider type="gallery" image_size="square" portfolios_shown="4"
//  category="ableton, sound design"] - the real instructor photo grid behind
// every course page's own "Meet Our World-Class Instructors" section
// (previously invisible: the shortcode was silently stripped like any other
// unhandled one, leaving just the heading + intro paragraph with no
// photos). category can be a comma-separated list; portfolios_shown caps
// how many to show (defaults to 8 here when the attribute is missing, matching
// a reasonable grid size). Real instructor data isn't a separate
// "portfolio" collection - it's the same `pages` docs the individual
// instructor bio pages already use (see lib/wp-portfolio-resolver.ts, the
// equivalent legacy-pipeline resolver this mirrors), each tagged with a
// portfolioCategories relationship. Slugs are matched with all non-
// alphanumeric characters stripped on both sides (see the caller) rather
// than an exact string compare - confirmed necessary against real data: the
// shortcode's own "sound design" (a space) needs to match the real stored
// category slug "sounddesign" (no space, no hyphen either), which a normal
// kebab-case slugify wouldn't produce.
export function extractPortfolioSliderSpec(
  wpRawContent: string
): { categorySlugs: string[]; count: number } | null {
  const raw = wpRawContent || "";
  const m = raw.match(/\[mkd_portfolio_(?:list|slider)\b([^\]]*)\]/i);
  if (!m) return null;
  const categoryMatch = m[1].match(/\bcategory="([^"]*)"/i);
  if (!categoryMatch) return null;
  const categorySlugs = categoryMatch[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!categorySlugs.length) return null;
  const countMatch = m[1].match(/\bportfolios_shown="(\d+)"/i);
  const count = countMatch ? Number(countMatch[1]) : 8;
  return { categorySlugs, count };
}

// [vc_single_image image="18427" ...] references a Payload media doc by id
// - unlike every other extractor in this file, this can't be resolved from
// wpRawContent alone (no image URL lives in the shortcode, just an id), so
// callers collect the referenced ids, resolve them to real media docs (a
// DB round trip - see the course-page route), and splice the resolved
// <img> tags back into the raw string before running the extractors above,
// the same "resolve ids, then substitute" shape as the legacy pipeline's
// own wp-image-resolver.ts.
export function extractSingleImageIds(wpRawContent: string): string[] {
  const raw = wpRawContent || "";
  const ids = new Set<string>();
  for (const m of raw.matchAll(/\[vc_single_image\s+image="(\d+)"/gi)) ids.add(m[1]);
  return [...ids];
}

export function resolveSingleImages(wpRawContent: string, urlsById: Map<string, string>): string {
  return (wpRawContent || "").replace(/\[vc_single_image\s+image="(\d+)"[^\]]*\]/gi, (whole, id) => {
    // Any of the three COMPARISON_VARIANTS ids (the "Asset 1/2/3" comparison
    // graphic - Garnish LA vs. Others/Online Tutorials, reused as-is across
    // every course/program page whose "Why choose X course at Garnish?"
    // section has one) is rebuilt as a real themed block rather than an
    // <img> tag (see bareImageToHtml's own check for this same marker), so
    // it's kept as a self-closing <img>-shaped tag here (carrying its own
    // id in data-variant) purely so extractParagraphs's existing bare-<img>
    // block matching still picks it up and carries it through to the final
    // output - a literal <div> spliced in at this point would match none
    // of extractParagraphs's own block patterns and get silently dropped.
    if (id in COMPARISON_VARIANTS) return `<img class="gmpm-comparison-table" data-variant="${id}" alt="" />`;
    const url = urlsById.get(id);
    // gmpm-resolved-image is a marker, not a real style - see
    // bareImageToHtml's own check for why: this tag will still pass back
    // through extractParagraphs's bare-<img> matching once spliced in, and
    // needs to be recognized there as already-styled rather than rebuilt
    // with the small-logo treatment that's only right for a genuinely bare
    // <img> straight from wpRawContent.
    return url ? `<img src="${url}" alt="" class="gmpm-resolved-image w-full h-auto gmpm-corner my-4" />` : "";
  });
}

export type CoursePricing = { priceLine: string | null; enrollLink: string | null };

// Pricing/enroll-CTA lives inside one of the boilerplate-labeled sections
// above (see comment on BOILERPLATE_HEADING) mixed in with unrelated
// copy, so it's pulled out separately rather than as part of a section -
// first "$..." price line and first enrollment link anywhere in the page.
// Two site-specific shapes seen so far: pdx/hou wrap the price in a plain
// <p> and link to a /connect URL; la's price sits inside an <h1>/<h3> (e.g.
// "$2250 Tuition + $300 Registration Fee") and its CTA is a class="btn-grand"
// anchor pointing at the site's own contact page instead of /connect - both
// are tried, in that order.
export function extractCoursePricing(wpRawContent: string): CoursePricing {
  const raw = wpRawContent || "";
  const priceMatch =
    raw.match(/<p[^>]*>(\$[^<]*)<\/p>/i) || raw.match(/<h[1-6][^>]*>(?:<span[^>]*>)?(\$[^<]*)/i);
  const priceLine = priceMatch ? decodeEntities(priceMatch[1]).trim() : null;

  const linkMatch =
    raw.match(/href="(https?:\/\/[^"]*\/connect[^"]*)"/i) ||
    raw.match(/class="btn-grand"[^>]*href="([^"]*)"/i) ||
    raw.match(/href="([^"]*)"[^>]*class="btn-grand"/i);
  const enrollLink = linkMatch?.[1] ?? null;

  return { priceLine, enrollLink };
}
