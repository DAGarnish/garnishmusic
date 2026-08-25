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
    .replace(/&#0?39;|&apos;/g, "'");
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

// A plain WPBakery/HTML <ul><li> list (as opposed to the [mkd_icon]-bulleted
// paragraphs iconParagraphToHtml handles) - e.g. a "You'll learn how to:"
// list sitting between two <p> tags. Same visual treatment as an icon list.
function plainListToHtml(li: string): string {
  const items = [...li.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim())
    .filter(Boolean);
  if (!items.length) return "";
  return `<ul class="space-y-2 my-4">${items
    .map((i) => `<li class="flex gap-2"><span class="text-[var(--gmpm-accent)]">→</span><span>${i}</span></li>`)
    .join("")}</ul>`;
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
// HTML with bracket shortcodes) into safe, readable HTML: <h3> sub-headings
// become sub-heading markup, <p> content becomes either a paragraph or a
// bullet list (see iconParagraphToHtml), a plain <ul> becomes the same
// bullet-list markup, every other [shortcode] token is stripped, and the
// wpb_text_column/wpb_wrapper divs WPBakery puts around every text block are
// left behind since only <p>/<h3>/<ul> are read out of them.
function extractParagraphs(rawChunk: string): string {
  const blocks: string[] = [];
  let skipping = false;
  for (const m of stripAccordionBlocks(rawChunk).matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>|<ul[^>]*>([\s\S]*?)<\/ul>|<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    if (m[1] !== undefined) {
      const heading = decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim();
      if (SKIP_FROM_HEADING.test(heading)) skipping = true;
      if (!skipping && heading) blocks.push(`<h4 class="gmpm-display font-bold text-lg mt-8 mb-3">${heading}</h4>`);

      // This content alternates between two-column rows where one column's
      // [mkd_icon]-bulleted text sits inside a <p> (handled below via the
      // regular <p> match) and the other column's identical bullet list sits
      // bare, straight after the <h3> with no <p> wrapper at all - the same
      // icon-list content, just missing the tag the main loop matches on.
      // Caught here by looking ahead to the next real tag boundary and
      // treating that span as an icon list if it has no <p>/<ul> of its own.
      if (!skipping) {
        const afterHeading = (m.index ?? 0) + m[0].length;
        const nextTag = rawChunk.slice(afterHeading).search(/<h3[^>]*>|<p[^>]*>|<ul[^>]*>|\[\/vc_column_text\]/i);
        const bareSpan = rawChunk.slice(afterHeading, nextTag === -1 ? undefined : afterHeading + nextTag);
        if (/\[mkd_icon/i.test(bareSpan)) {
          const html = iconParagraphToHtml(bareSpan);
          if (html) blocks.push(html);
        }
      }
    } else if (m[2] !== undefined) {
      if (skipping) continue;
      const html = plainListToHtml(m[2]);
      if (html) blocks.push(html);
    } else if (m[3] !== undefined) {
      if (skipping) {
        if (!/\[mkd_icon[^\]]*\]/i.test(m[3])) skipping = false;
        else continue;
      }
      const html = iconParagraphToHtml(m[3]);
      if (html) blocks.push(html);
    }
  }
  if (!blocks.length) {
    const bare = extractBareParagraphs(rawChunk);
    if (bare) blocks.push(bare);
  }
  return restyleLegacyConnectButton(stripCruftAttributes(blocks.join("")));
}

// These pages reuse a handful of boilerplate section labels
// (Testimonials/Our Instructors/From The Blog) as generic wrappers around
// whatever unrelated content (pricing, other cities' schedules, a stray
// cross-site quote) happened to follow them during migration - the label
// and body don't actually correspond. Real per-course description content
// consistently comes first, before any of these show up, across every page
// checked - so stop extracting once one appears rather than show a
// mismatched heading/body pair.
const BOILERPLATE_HEADING = /testimonial|our instructor|from the blog|new york|live online/i;

export function extractCourseSections(wpRawContent: string, limit = 6): CourseSection[] {
  const raw = wpRawContent || "";
  const headingRe = /\[mkd_section_title[^\]]*\btitle_text="([^"]*)"/gi;
  // A few pages use a bare "-" as a purely visual section divider with no
  // real title - not content, so it shouldn't render as a heading. Dropped
  // from the match list entirely (rather than skipped in the loop below)
  // so it doesn't act as a span boundary either: mixing-mastering's real
  // intro/curriculum content sits right after one of these, and treating it
  // as a boundary was cutting that content's span short before extracting
  // any of it - the "-" isn't a real section break, so the content after it
  // belongs to the same span as the heading before it.
  const matches = [...raw.matchAll(headingRe)].filter(
    (m) => !/^[-–—.]*$/.test(decodeEntities(m[1] || "").trim())
  );

  const sections: CourseSection[] = [];
  for (let i = 0; i < matches.length && sections.length < limit; i++) {
    const heading = decodeEntities(matches[i][1] || "").trim();
    if (!heading) continue;
    if (BOILERPLATE_HEADING.test(heading)) break;
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = matches[i + 1]?.index ?? raw.length;
    const bodyHtml = extractParagraphs(raw.slice(start, end));
    if (!bodyHtml) continue;
    sections.push({ heading, bodyHtml });
  }

  return sections;
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

export type CoursePricing = { priceLine: string | null; enrollLink: string | null };

// Pricing/enroll-CTA lives inside one of the boilerplate-labeled sections
// above (see comment on BOILERPLATE_HEADING) mixed in with unrelated
// copy, so it's pulled out separately rather than as part of a section -
// first "$..." price line and first /connect enrollment link anywhere in
// the page, both of which were consistent across every course page checked.
export function extractCoursePricing(wpRawContent: string): CoursePricing {
  const raw = wpRawContent || "";
  const priceMatch = raw.match(/<p[^>]*>(\$[^<]*)<\/p>/i);
  const priceLine = priceMatch ? decodeEntities(priceMatch[1]).trim() : null;

  const linkMatch = raw.match(/href="(https?:\/\/[^"]*\/connect[^"]*)"/i);
  const enrollLink = linkMatch?.[1] ?? null;

  return { priceLine, enrollLink };
}
