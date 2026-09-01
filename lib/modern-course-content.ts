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

// mia's homepage uses [mkd_button text="..." link="..."] for its CTAs
// instead of la's raw <a class="btn-grand" href="...">Apply</a> anchors -
// sitting bare in the flow (no <p> wrapper), so it never reaches any of
// extractParagraphs's block matches at all and would otherwise just vanish
// under stripShortcodesExceptIcon's generic bracket-strip once the
// surrounding text did get matched. Converted to the exact same
// <p><a class="btn-grand"> shape la's own CTAs already use - already
// styled, already flows through extractParagraphs's <p> block match
// unchanged - before any of that stripping runs. Attribute order isn't
// assumed (mia's shortcode always types text before link, but this doesn't
// rely on that).
function convertMkdButtonsToLinks(html: string): string {
  return html.replace(/\[mkd_button\b([^\]]*)\]/gi, (whole, attrs) => {
    const text = attrs.match(/\btext="([^"]*)"/i)?.[1];
    const link = attrs.match(/\blink="([^"]*)"/i)?.[1];
    if (!text || !link) return "";
    return `<p><a class="btn-grand" href="${link}">${decodeEntities(text)}</a></p>`;
  });
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

// certificate-music-production-songwriting's own two promo graphics ("Why
// Choose Us?" id 19285, "F1 Visa Steps for International Creators" id
// 19290) are text baked into a screenshot-style image over a photo
// background, same problem as COMPARISON_VARIANTS above (never blends into
// this design's near-black background) - transcribed directly off each
// image and rebuilt as real text below rather than left as a screenshot.
type TextGraphicVariant =
  | { kind: "bullets"; items: { label: string; text: string }[] }
  | { kind: "steps"; items: string[]; note?: string };
const TEXT_GRAPHIC_VARIANTS: Record<string, TextGraphicVariant> = {
  "19285": {
    kind: "bullets",
    items: [
      {
        label: "Epic Production",
        text: "Craft chart-worthy tracks in Garnish LA's state-of-the-art studios with Grammy-nominated hit-makers.",
      },
      {
        label: "Music Mastery",
        text: "Elite theory, ear training & live ensembles at CCM Pasadena – become a complete artist.",
      },
      {
        label: "Insanely Affordable",
        text: "Full 2-year Associate Degree + OPT under $36K – same Hollywood access, better price, real degree (others $100K+).",
      },
      {
        label: "F-1 Visa Ready",
        text: "U.S. F-1 student visa eligible + 12-month OPT work authorization after graduation.",
      },
      {
        label: "Hollywood Edge",
        text: "Live in the music capital, network daily, join our global alumni dropping hits worldwide",
      },
    ],
  },
  "19290": {
    kind: "steps",
    items: [
      "Submit necessary documents and obtain Form I-20 from CCM",
      "Review the U.S. Department of State's Visa Page",
      "Pay the SEVIS I-901 Fee",
      "Complete Form DS-160",
      "Schedule a Visa Interview and attend",
      "Receive your F-1 Visa",
      "Fly to the U.S. and attend your Student Orientation",
    ],
    note: "Admissions staff at Garnish and CCM will explain these steps and required documents during our call",
  },
};

function textGraphicHtml(v: TextGraphicVariant): string {
  if (v.kind === "bullets") {
    return `<div class="not-prose my-6 space-y-4">${v.items
      .map(
        (i) =>
          `<p><strong class="text-[var(--gmpm-text)]">${i.label}:</strong> <span class="text-[var(--gmpm-text-dim)]">${i.text}</span></p>`
      )
      .join("")}</div>`;
  }
  return `<div class="not-prose my-6">
    <ol class="space-y-2 list-decimal list-inside">${v.items.map((s) => `<li>${s}</li>`).join("")}</ol>
    ${v.note ? `<p class="mt-4 text-sm text-[var(--gmpm-text-dim)]">${v.note}</p>` : ""}
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
  // See resolveSingleImages and textGraphicHtml above - same marker-tag
  // technique, for the two TEXT_GRAPHIC_VARIANTS ids.
  const textGraphicMatch = imgTag.match(/gmpm-text-graphic[^>]*\bdata-variant="(\d+)"/);
  if (textGraphicMatch) {
    const variant = TEXT_GRAPHIC_VARIANTS[textGraphicMatch[1]];
    return variant ? textGraphicHtml(variant) : "";
  }
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
  // the real white heading text next to it, instead of a dimmer gray. The
  // actual invert is done by the theme-aware .gmpm-cert-badge rule in
  // modern-globals.css rather than a literal filter class here, since a
  // hardcoded invert-to-white is itself invisible on .gmpm-theme-cream's
  // light background (see stripHardcodedWhiteText above for the same class
  // of bug on text) - that CSS rule flips back to plain brightness(0) (no
  // invert = the mark's own dark color) under .gmpm-theme-cream.
  // mb-6 (rather than a symmetric my-2) - the next block down is usually
  // the "Apply"/"Enroll now" CTA link, which reads as cramped sitting right
  // under the badge with only a small symmetric margin.
  return `<img src="${src}" alt="${decodeEntities(alt)}" class="max-h-12 w-auto inline-block mt-2 mb-6 mr-6 gmpm-cert-badge" />`;
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

// mia's own [vc_column_text] copy is written the same bare, unwrapped way
// (confirmed on its homepage's program blurbs and course descriptions), but
// extractBareParagraphs above only ever fires when a *whole chunk* produced
// no BLOCK_RE matches at all - it's an all-or-nothing per-chunk fallback,
// not a per-paragraph one. A chunk that mixes bare vc_column_text with any
// already-real markup (e.g. mia's own <h2> sub-heading for the next card,
// or a [mkd_button] converted to a real <p><a> by convertMkdButtonsToLinks
// above) already makes blocks.length > 0, so that fallback never runs and
// the bare paragraph is silently dropped - confirmed on mia's homepage
// "Ableton Producer Program"/"Logic Producer Program" cards, which kept
// their "See More" button but lost their entire description. Normalizing
// every bare [vc_column_text] into real <p> tags up front, before BLOCK_RE
// ever runs, fixes this at the source for every consumer of
// extractParagraphs (course pages included, not just the homepage) instead
// of only the single-bare-block case extractBareParagraphs already
// handled. Same blank-line-paragraph-splitting behavior as that function,
// deliberately not reusing its own decode/strip-tags step - the wrapped
// <p> gets carried into BLOCK_RE's own match here, so it goes through the
// exact same downstream decoding (iconParagraphToHtml) real <p> content
// already does, rather than duplicating that logic ahead of time.
// A [vc_column_text] block that mixes real <p> tags with a leading and/or
// trailing paragraph missing its own open/close half - confirmed on mia's
// academy page, where every multi-paragraph block in its raw content has
// this exact shape: the block's first paragraph has no opening <p> (just
// bare text ending in a stray, unmatched </p>), and/or its last paragraph
// opens a real <p> that's never closed, running straight to
// [/vc_column_text] - a migration artifact affecting the whole page, not a
// one-off typo (confirmed on its intro block and on two of its own
// [mkd_accordion_tab] bodies, "Logic Pro" and "More Free Stuff", both
// silently dropped entirely before this). BLOCK_RE's own <p> alternative
// requires a matched open+close pair, so both edge cases were previously
// lost rather than just left unstyled - this repairs the block's
// boundaries before BLOCK_RE ever sees it.
function repairUnbalancedParagraphEdges(inner: string): string {
  const openCount = (inner.match(/<p(?:\s[^>]*)?>/gi) || []).length;
  if (openCount === 0) return inner;
  let repaired = inner;
  if (!/^\s*</.test(repaired)) {
    repaired = `<p>${repaired}`;
  }
  const closeCount = (repaired.match(/<\/p>/gi) || []).length;
  const openCountAfter = (repaired.match(/<p(?:\s[^>]*)?>/gi) || []).length;
  if (openCountAfter > closeCount) {
    repaired = `${repaired}</p>`;
  }
  return repaired;
}

function wrapBareColumnText(html: string): string {
  return html.replace(
    /(\[vc_column_text[^\]]*\])([\s\S]*?)(\[\/vc_column_text\])/gi,
    (whole, openTag: string, inner: string, closeTag: string) => {
      if (/<(p|h[1-4]|ul|ol)[^>]*>/i.test(inner)) {
        const repairedInner = repairUnbalancedParagraphEdges(inner);
        return repairedInner === inner ? whole : `${openTag}${repairedInner}${closeTag}`;
      }
      const paragraphs = inner
        .split(/\n\s*\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 3 && !/^\d{1,4}$/.test(line));
      return paragraphs.length ? `${openTag}${paragraphs.map((p) => `<p>${p}</p>`).join("")}${closeTag}` : whole;
    }
  );
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

// Exported for the modern course-schedule accordion (mia's "View Course
// Schedule & Details" content, a `products` doc's own wpRawContent - plain
// <p>/<strong>/<a> markup, the exact shape this already handles) - every
// other caller in this file already used it internally before this needed
// to reach outside it.
export function extractParagraphs(rawChunk: string): string {
  const blocks: string[] = [];
  let skipping = false;
  for (const m of stripAccordionBlocks(wrapBareColumnText(rawChunk)).matchAll(BLOCK_RE)) {
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
  /^(new york|live online|(more\s+)?testimonials?|our instructors?|from the blog|(some of )?our partners)$/i;
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

// wpRawContent routinely hard-codes literal white text (e.g.
// `<span style="color: #ffffff !important">`) - correct on this design's
// original near-black theme (--gmpm-text is already ~white there, so the
// override is a no-op), but invisible once a site opts into
// .gmpm-theme-cream's light background (--gmpm-bg #ede9dc), where the same
// override forces white-on-cream. Rather than hunting down every extraction
// path that might carry one of these spans through untouched (unlike
// extractParagraphs's own stripCruftAttributes above, this has to catch
// <span> too, which isn't in that allowlist), every dangerouslySetInnerHTML
// call site runs its final HTML through this once, so the override is
// dropped and the text falls back to the theme's own --gmpm-text token -
// a no-op on the dark theme, a fix on the cream one.
export function stripHardcodedWhiteText(html: string): string {
  const isWhite = (value: string) =>
    /^(#fff(fff)?|white|rgba?\(\s*255\s*,\s*255\s*,\s*255\b)/i.test(value.trim());
  return html.replace(/\sstyle="([^"]*)"/gi, (full, styleValue: string) => {
    const kept = styleValue
      .split(";")
      .map((decl) => decl.trim())
      .filter((decl) => {
        if (!decl) return false;
        const m = decl.match(/^color\s*:\s*(.+?)(\s*!important)?$/i);
        return !(m && isWhite(m[1]));
      });
    const cleaned = kept.join("; ").trim();
    return cleaned ? ` style="${cleaned}"` : "";
  });
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
    /(?:<img[^>]*gmpm-resolved-image[^>]*>\s*)?<p>[^<]*Everything went really well in Ibiza[^<]*<\/p>\s*<p><strong>Paris Hilton<\/strong>[^<]*<\/p>/i,
    ""
  );
}

// Strips a trailing " | <city/qualifier>" so "Electronic Music DJ Class"
// and "Electronic Music DJ Class | Miami" dedupe as the same heading (see
// extractCourseSections' own use below) - mia's own course pages repeat
// their intro/first section's heading with this exact "| Miami" suffix on
// its hidden desktop-column duplicate.
function normalizeSectionHeading(heading: string): string {
  return heading.replace(/\s*\|\s*[^|]*$/, "").trim().toLowerCase();
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
    // mia's own hidden desktop-column mirror of the whole page (see the
    // <h4> module-card duplication extractIconBulletCardGroups' own
    // comment covers) repeats this same section's heading verbatim, plus a
    // "| Miami" suffix, right before dumping every module's bullets
    // flattened into one blob with no real card structure (confirmed on
    // electronic-dj-course - the second "section" was 34 unrelated bullets
    // under one heading). Once a heading repeats (city suffix or not),
    // everything from here on is that same duplicate mirror, not new
    // content, so this stops rather than skipping just the one row.
    if (
      sections.length > 0 &&
      sections.some((s) => normalizeSectionHeading(s.heading) === normalizeSectionHeading(parsed.heading))
    ) {
      break;
    }
    // parsed.taglines (e.g. certificate-music-production-songwriting's own
    // "Los Angeles & Live Online" / "International Students Study..." pair)
    // were previously discarded here - every other extractRowHeading caller
    // in this file already surfaces them via taglinesToHtml, this one just
    // hadn't been wired up yet.
    const bodyHtml = taglinesToHtml(parsed.taglines) + extractParagraphs(row.slice(parsed.contentStart));
    if (!bodyHtml) continue;
    sections.push({ heading: parsed.heading, bodyHtml });
  }
  return sections;
}

// certificate-music-production-songwriting's own two-column "Program
// Highlights" / "Prerequisites" block ([vc_row_inner][vc_column_inner
// width="1/2"]...) - a headless row with no [mkd_section_title]/<h1-3> of
// its own, so extractRowHeading (and extractCourseSections' loop, which
// skips any row it can't find a heading for) silently drops it entirely.
// Each column is raw WPBakery text, not real <li> markup - bullet lines are
// prefixed with a literal <span style="color: #cc0000 ...">•</span> marker,
// non-bullet lines (the two closing CTAs) aren't.
export type ProgramHighlightsColumn = { title: string; bullets: string[]; paragraphs: string[] };
export function extractProgramHighlights(
  wpRawContent: string
): { left: ProgramHighlightsColumn; right: ProgramHighlightsColumn } | null {
  const raw = wpRawContent || "";
  // Title is sometimes a bare <strong> (certificate page), sometimes
  // <p><strong>...</strong></p> (this page's own right column) - both
  // optional-matched here. Bullets are sometimes a real
  // <span style="color:#cc0000...">•</span> marker (certificate page),
  // sometimes a bare "•" character (this page) - both handled in
  // parseColumn below, along with a stray <p>/</p> wrapper straddling a
  // multi-line bullet list (this page's own right column again).
  const m = raw.match(
    /\[vc_column_text css=""\]\s*(?:<p[^>]*>)?<strong>([^<]+)<\/strong>(?:<\/p>)?\r?\n([\s\S]*?)\[\/vc_column_text\]\[\/vc_column_inner\]\[vc_column_inner width="1\/2"\]\[vc_column_text css=""\]\s*(?:<p[^>]*>)?<strong>([^<]+)<\/strong>(?:<\/p>)?\r?\n([\s\S]*?)\[\/vc_column_text\]/i
  );
  if (!m) return null;
  const parseColumn = (title: string, body: string): ProgramHighlightsColumn => {
    const bullets: string[] = [];
    const paragraphs: string[] = [];
    for (const rawLine of body.split("\n")) {
      const line = rawLine
        .trim()
        .replace(/^<p[^>]*>/i, "")
        .replace(/<\/p>$/i, "")
        .trim();
      if (!line) continue;
      const bulletMatch = line.match(/^(?:<span[^>]*>•<\/span>|•)\s*(.+)$/);
      if (bulletMatch) bullets.push(decodeEntities(bulletMatch[1]));
      else paragraphs.push(decodeEntities(line));
    }
    return { title: decodeEntities(title).trim(), bullets, paragraphs };
  };
  return { left: parseColumn(m[1], m[2]), right: parseColumn(m[3], m[4]) };
}

export function programHighlightsHtml(block: { left: ProgramHighlightsColumn; right: ProgramHighlightsColumn }): string {
  const column = (c: ProgramHighlightsColumn) => `<div class="gmpm-corner border border-[var(--gmpm-line)] p-6">
    <h3 class="gmpm-display font-bold text-lg mb-4">${c.title}</h3>
    ${
      c.bullets.length
        ? `<ul class="space-y-2">${c.bullets
            .map((b) => `<li class="flex gap-2"><span class="text-[var(--gmpm-accent)]">→</span><span>${b}</span></li>`)
            .join("")}</ul>`
        : ""
    }
    ${c.paragraphs.map((p) => `<p class="mt-4 text-sm">${p}</p>`).join("")}
  </div>`;
  return `<div class="grid md:grid-cols-2 gap-6 not-prose">${column(block.left)}${column(block.right)}</div>`;
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
  // mia's own multi-program rows (e.g. "Certified Producer Programs":
  // Ableton + Logic) use one *separate* [mkd_elements_holder] block per
  // program, each independently holding just its own image+text pair -
  // unlike la's multi-card rows, which pack every sub-card's image+text
  // pair into holder_items inside ONE shared holder instead. The flat
  // background_image scan below can't tell those two shapes apart on its
  // own: scanning straight across a row with two separate holders lets one
  // holder's real content bleed into its neighbor's card (confirmed on
  // mia's own Ableton/Logic row - Logic's entire heading+body+CTA ended up
  // appended inside the Ableton card instead of forming its own). Recursing
  // per top-level holder first avoids that; a row with exactly one holder
  // (la's own shape) falls straight through unchanged below, since
  // holderMatches.length > 1 is false there.
  const holderMatches = [...row.matchAll(/\[mkd_elements_holder(?![a-zA-Z_])[^\]]*\]/gi)];
  if (holderMatches.length > 1) {
    // Each holder gets its own heading extracted directly (wherever it
    // falls inside that holder - Ableton's own holder has its <h2> after
    // the image marker, Logic's has it *before*), rather than reusing the
    // one heading extractRowHeading found for the row as a whole (which is
    // always just whichever <h2> happens to appear textually first across
    // the entire row, e.g. always "Ableton Producer Program" even while
    // processing Logic's own holder) or relying on background_image's own
    // position within the holder to decide where the real content starts
    // (only correct when the image marker happens to precede the text,
    // which isn't consistent even between mia's own two holders here).
    const perHolderCards: OfferingCard[] = [];
    for (let i = 0; i < holderMatches.length; i++) {
      const start = holderMatches[i].index ?? 0;
      const end = holderMatches[i + 1]?.index ?? row.length;
      const holderChunk = row.slice(start, end);
      const imageId = holderChunk.match(/\[mkd_elements_holder_item\s+background_image="(\d+)"/i)?.[1] ?? null;
      const inner = extractRowHeading(holderChunk);
      const heading = inner?.heading || (i === 0 ? rowHeading : `${rowHeading} ${i + 1}`);
      // Only the first holder's row-level taglines (e.g. Certificate's "1
      // Year in Los Angeles" line) belong to the row as a whole - later
      // holders are separate programs with no tagline of their own.
      const bodyHtml = bulletizeIfProseOnly(
        taglinesToHtml(i === 0 ? rowTaglines : inner?.taglines ?? []) +
          extractParagraphs(inner ? holderChunk.slice(inner.contentStart) : holderChunk)
      );
      if (bodyHtml) perHolderCards.push({ heading, bodyHtml, imageId });
    }
    if (perHolderCards.length > 0) return perHolderCards;
  }

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
  const raw = convertMkdButtonsToLinks(wpRawContent || "");
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
// Scoped to the row whose own heading is "Our Students Say..." or a plain
// "Testimonials" (mia's course pages use this exact
// [mkd_section_title title_text="Testimonials"] heading over their own
// [mkd_testimonials category="..."] widget) - rather than a flat
// whole-content scan. la's homepage has a second, unrelated
// [mkd_testimonials category="famous-testimonials"] instance sitting in a
// disabled row of its own (right after the "Enroll Now" banner, with no
// heading at all), which a flat scan would incorrectly fold into this one,
// mixing an unrelated testimonial set into the carousel under Paris
// Hilton's own quote - an empty heading matches neither pattern here.
function isStudentsSayHeading(heading: string): boolean {
  return /students say|^testimonials$/i.test(heading.trim());
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

// mia's own course pages (e.g. courses/ableton-live-course) lay out their
// curriculum as a run of two-up [vc_column_inner width="1/2"] "cards"
// inside the same photo-parallax [vc_row_inner] wrapper extractCourseIntro
// above already handles for plain-prose cards - except these open with a
// real <h4>Module Name</h4> heading, followed by a [mkd_icon]-bulleted <p>
// (2+ icons in one paragraph, the exact shape iconParagraphToHtml already
// turns into a real <ul> elsewhere in this file) instead of plain prose.
// extractCourseIntro's own "no heading inside this card" check
// deliberately excludes these (a real module name, not body copy, would
// get flattened into an intro paragraph otherwise), and neither
// extractCourseSections ([mkd_section_title]/bare <h1-3> row headings)
// nor extractCurriculumModules (literal <h2>+<ul>) reach <h4>+[mkd_icon]
// content at all - confirmed on ableton-live-course, which has four real
// modules (Let's Get Going!, Creating With MIDI & Audio, DJing and Live
// Performance, MIDI Tracks and Composing with Virtual Instruments) totally
// invisible to every existing extractor. Bounded by the card's own closing
// [/vc_column_text] rather than a literal </p> - these paragraphs are
// routinely left unclosed in the source (a WPBakery authoring habit
// already confirmed as a real hydration hazard elsewhere in this file, see
// BLOCK_RE's own comment), so a literal-</p> requirement would swallow the
// next card's own heading into the wrong module.
export function extractIconBulletCardGroups(wpRawContent: string): CurriculumModule[] {
  const raw = wpRawContent || "";
  const groups: CurriculumModule[] = [];
  // The <p> wrapper is optional - some cards' [mkd_icon] bullets sit bare
  // right after </h4> with no <p> at all (confirmed on hit-songwriting-
  // course's 1st and 4th module cards; its 2nd and 3rd do have one) -
  // [/vc_column_text] is each card's own reliable close either way.
  for (const m of raw.matchAll(/<h4[^>]*>([^<]*?)<\/h4>\s*(?:<p[^>]*>)?([\s\S]*?)\[\/vc_column_text\]/gi)) {
    const heading = decodeEntities(m[1] || "").trim();
    // A bare "101"/"201"-style <h4> is the same WPBakery pagination/anchor
    // artifact extractCourseIntro's own numeric-line filter already drops
    // (confirmed on logic-course, sitting right before a duplicate,
    // differently-shaped <strong>+<ul> copy of this same content further
    // down the page - real module headings are never purely numeric).
    if (/^\d+$/.test(heading)) continue;
    const items = m[2]
      .split(/\[mkd_icon[^\]]*\]/gi)
      .map((s) => decodeEntities(s.replace(/<[^>]+>/g, "")).trim())
      .filter(Boolean);
    if (heading && items.length) groups.push({ heading, items });
  }
  return groups;
}

// The free-text intro before the first <h2> in that same older shape -
// plain lines separated by blank lines, no <p> wrapper. Bare short numeric
// lines (e.g. "101", "201") are WPBakery pagination/anchor artifacts, not
// content, and are dropped.
export function extractCourseIntro(wpRawContent: string): string[] {
  const raw = wpRawContent || "";

  let oldShape: string[] = [];
  const columnMatch = raw.match(/\[vc_column_text\]([\s\S]*?)(?:<h2|\[\/vc_column_text\])/i);
  if (columnMatch) {
    const afterH1 = columnMatch[1].replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");
    oldShape = afterH1
      .split(/\n\s*\n/)
      .map((line) => decodeEntities(line.replace(/<[^>]+>/g, "").trim()))
      .filter((line) => line.length > 3 && !/^\d{1,4}$/.test(line));
  }

  // mia's own program pages (Ableton/Logic/Electronic Music Academy
  // producer programs) use a third shape neither extractCourseSections's
  // own [mkd_section_title] pipeline nor the shape above fits: a run of
  // [vc_row_inner]...[vc_column_text]plain text[/vc_column_text]...
  // [/vc_row_inner] photo-parallax "cards" (one per paragraph, a background
  // image on the wrapping [vc_row_inner], no heading of its own at all)
  // sitting before any real section heading appears - confirmed on
  // programs/ableton-producer-program, which has three full paragraphs of
  // real body copy in exactly this shape. Each card's own [vc_column_text]
  // is matched directly; one with a real <h1-4> of its own (e.g. the same
  // page's later "Levels" divider card) is skipped - that's a real section
  // heading, not body prose, and shouldn't be flattened into the intro.
  const parallaxCards: string[] = [];
  for (const m of raw.matchAll(/\[vc_row_inner\b[^\]]*\]([\s\S]*?)\[\/vc_row_inner\]/gi)) {
    const textMatch = m[1].match(/\[vc_column_text[^\]]*\]([\s\S]*?)\[\/vc_column_text\]/i);
    if (!textMatch || /<h[1-4][^>]*>/i.test(textMatch[1])) continue;
    // Each card can itself hold more than one blank-line-separated thought
    // (e.g. Ableton's own second card: a paragraph, then a pull-quote, then
    // a closing paragraph) - split the same way the older shape's own
    // paragraphs are, rather than gluing them into one run-on <p>.
    for (const line of textMatch[1].split(/\r?\n\s*\r?\n/)) {
      const text = decodeEntities(stripShortcodesExceptIcon(line).replace(/<[^>]+>/g, "")).trim();
      if (text.length > 3) parallaxCards.push(text);
    }
  }

  // Whichever shape actually found real content wins, by total length -
  // the older shape's own regex above matches the *first bare*
  // [vc_column_text] (no css= attribute) anywhere in the whole page, not
  // specifically near the top: on mia's program pages that's "Levels", a
  // section divider far down the page (every one of the real
  // [vc_column_text css="..."] paragraph blocks has a css attribute and so
  // never matches that regex at all), producing a single useless
  // heading-fragment "intro" instead of falling through to real content.
  // Comparing lengths rather than always preferring one shape keeps this
  // safe for whichever other site oldShape's own comment already covers
  // (hou's electronic-sound-art page and similar) - those have no
  // [vc_row_inner] parallax cards at all, so parallaxCards stays empty and
  // oldShape wins unchanged.
  return parallaxCards.join(" ").length > oldShape.join(" ").length ? parallaxCards : oldShape;
}

// "courses/" is shared in this data with instructor bio pages (migrated
// under the same WP custom post type), so slug prefix alone can't tell a
// real course page apart from e.g. "courses/dave-garnish". The site's own
// nav tree is the actual list of pages presented as courses, so walk it
// for internal /courses/... links rather than guessing from the slug or
// portfolioCategories (both of which overlap between the two page kinds).
export function collectNavCourseSlugs(menu: unknown): Set<string> {
  const slugs = new Set<string>();
  // Most nav items are relative ("/courses/x/"), but some are baked in as
  // absolute "https://<site>.garnishmusicproduction.com/courses/x/" links
  // instead (e.g. "Art of Remix", under Programs > Express Courses) -
  // correct for the legacy theme (see ModernHeader's own relativizeOwnDomain,
  // fixing the same links for display), but this collector silently missed
  // every one of them since none actually start with "/courses/" as a bare
  // string - matched here too so a course isn't invisible to the modern
  // routing table just because of how its own nav link happens to be
  // stored.
  const coursePathMatch = /^(?:https?:\/\/[^/]*\.?garnishmusicproduction\.com)?\/(courses\/[^/?#]+)/i;
  function walk(nodes: any[]) {
    for (const node of nodes || []) {
      if (typeof node?.url === "string") {
        const m = node.url.match(coursePathMatch);
        if (m) slugs.add(m[1]);
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

// The modules accordion's own trailing "X Course Blog" tab (excluded above
// as "just another [shortcode] widget with no real <p>/<ul> of its own") -
// a real [mkd_blog_list category="..."] widget, not FAQ or curriculum, but
// still real content: rebuilt as a real accordion tab (see
// buildBlogListResolver, which already resolves this exact shortcode for
// the legacy pipeline) rather than left out entirely.
export function extractAccordionBlogTab(wpRawContent: string): { title: string; categoryCsv: string } | null {
  const raw = wpRawContent || "";
  const m = raw.match(
    /\[mkd_accordion_tab title="([^"]*)"[^\]]*\]\s*\[mkd_blog_list[^\]]*\bcategory="([^"]*)"[^\]]*\]\s*\[\/mkd_accordion_tab\]/i
  );
  if (!m) return null;
  const title = decodeEntities(m[1] || "").trim();
  const categoryCsv = m[2] || "";
  return title && categoryCsv ? { title, categoryCsv } : null;
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
export type VideoEmbed = { embedUrl: string; title: string; vertical: boolean };

export function extractVideoEmbeds(wpRawContent: string): VideoEmbed[] {
  const raw = wpRawContent || "";
  const videos: VideoEmbed[] = [];
  const seenUrls = new Set<string>();
  for (const m of raw.matchAll(/\[vc_video\s+link="([^"]*)"[^\]]*\]/gi)) {
    const link = m[1] || "";
    const titleMatch = m[0].match(/\btitle="([^"]*)"/i);
    const title = titleMatch ? decodeEntities(titleMatch[1] || "").trim() : "";
    // electronic-dj-course's own quick-sample clip is a youtube.com/shorts/ID
    // link (a vertical Short, not a regular watch?v= upload) - the same ID
    // shape, just a different URL path, so it needs its own alternative here
    // rather than falling through unmatched.
    const idMatch = link.match(/(?:youtu\.be\/|[?&]v=|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/);
    if (!idMatch) continue;
    const embedUrl = `https://www.youtube.com/embed/${idMatch[1]}`;
    // el_aspect="916" (9:16) marks a vertical Short - a fixed 16:9 aspect-
    // video box would badly letterbox one of these, so the caller needs to
    // know to size it differently. Also true for a bare /shorts/ link even
    // without an explicit el_aspect, since every Short is vertical.
    const vertical = /\bel_aspect="916"/i.test(m[0]) || /youtube\.com\/shorts\//i.test(link);
    // electronic-dj-course's own [vc_video] shortcode is repeated verbatim
    // in a second, hidden mobile-column copy of the same content further
    // down the page (same duplication pattern as the <h4> module cards -
    // see extractIconBulletCardGroups) - deduped here rather than double-
    // rendering the identical clip twice.
    if (seenUrls.has(embedUrl)) continue;
    seenUrls.add(embedUrl);
    videos.push({ embedUrl, title, vertical });
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
// mia's homepage course grid ("Shorter Music Production Classes") is a
// [mkd_portfolio_list category="short-courses"] widget - a dynamic query
// against the pages collection's portfolioCategories relationship (see
// lib/wp-portfolio-resolver.ts's buildPortfolioListResolver, already used
// by the legacy pipeline for this exact shortcode), not inline page text.
// extractHomepageOfferings has no way to render this: the widget sits in
// its own [vc_row] with no heading of its own (mia's heading - "Shorter
// Music Production Classes" - is in the row *before* it), so
// extractRowHeading finds nothing there and the whole row is silently
// skipped. This is a separate, narrower extractor just for that one
// widget: finds the shortcode's category/count, then looks backward for
// the nearest preceding <h2> to use as the section heading. Callers still
// need to resolve real items via buildPortfolioListResolver themselves
// (this only parses the raw string, no DB access here - same split as
// extractPortfolioSliderSpec above).
export type HomepagePortfolioSection = { heading: string; categorySlug: string; count: number };
export function extractHomepagePortfolioSection(wpRawContent: string): HomepagePortfolioSection | null {
  const raw = wpRawContent || "";
  const widgetMatch = raw.match(/\[mkd_portfolio_(?:list|slider)\b([^\]]*)\]/i);
  if (!widgetMatch) return null;
  const categoryMatch = widgetMatch[1].match(/\bcategory="([^"]*)"/i);
  const categorySlug = categoryMatch?.[1]?.split(",")[0]?.trim();
  if (!categorySlug) return null;
  const countMatch = widgetMatch[1].match(/\bportfolios_shown="(\d+)"/i);
  const count = countMatch ? Number(countMatch[1]) : 8;

  const before = raw.slice(0, widgetMatch.index ?? 0);
  const h2Matches = [...before.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  if (!h2Matches.length) return null;
  const heading = decodeEntities(h2Matches[h2Matches.length - 1][1].replace(/<[^>]+>/g, "")).trim();
  return heading ? { heading, categorySlug, count } : null;
}

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
    if (id in TEXT_GRAPHIC_VARIANTS) return `<img class="gmpm-text-graphic" data-variant="${id}" alt="" />`;
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
