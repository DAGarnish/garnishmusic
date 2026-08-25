// Instructor bio pages (courses/{name}) are much simpler than course pages -
// bare paragraph text (blank-line separated, no <p> wrapper) with inline
// <strong>/<em>/<a> formatting, optionally wrapped in WPBakery layout
// shortcodes that carry no real content of their own - [vc_row]/[vc_column]/
// [vc_column_text] on pdx/hou's bio pages, but la's use [mkd_section_title]
// and [mkd_elements_holder]/[mkd_elements_holder_item] instead (confirmed:
// stripping only vc_-prefixed shortcodes left raw
// item_padding_480="..."]-style shortcode fragments visible in the
// rendered bio on la's instructor page). Strips every bracketed shortcode
// generically instead of allowlisting the vc_ prefix, then normalizes the
// surviving inline HTML the same way the course-page extractor does.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
}

export function extractInstructorBio(wpRawContent: string): string {
  const raw = wpRawContent || "";
  const stripped = raw.replace(/\[\/?[a-z_][a-z0-9_]*(?:\s[^\]]*)?\]/gi, "");
  const paragraphs = stripped
    .split(/\n\s*\n/)
    .map((p) => decodeEntities(p.replace(/<(strong|em|p)[^>]*>/gi, "<$1>")).trim())
    .filter(Boolean);
  return paragraphs
    .map((p) => `<p>${p}</p>`)
    .join("")
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1" target="_blank" rel="noopener">');
}

// la's own /music-production-instructors-los-angeles page (unlike pdx/hou's,
// which is an empty shell - see the curated-four fallback these two sites
// use instead) is a real, hand-maintained directory: 29 real instructors,
// each a `<div class="instructor-card-flex">` with a photo, name, role and
// a link out to their own courses/{slug} bio page. Parsed directly instead
// of curating a handful, since real, complete directory content already
// exists here - no reason to hide the other 25.
export type InstructorDirectoryCard = {
  name: string;
  title: string;
  photoUrl?: string;
  href: string;
  // "Credits: ..." / "Specialities: ..." lines - real per-instructor info
  // that sits between the role and the "See Bio" link on la's own page.
  info: string[];
};

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

// Card links are absolute (https://la.garnishmusicproduction.com/courses/
// {slug}/), baked in as real WordPress URLs rather than relative paths -
// rewritten to a same-site relative path so the link stays on whichever
// domain is actually serving this page (staging, or la itself once
// promoted) instead of hard-linking out to production la.
function toRelativeHref(href: string): string {
  return href.replace(/^https?:\/\/[^/]+/i, "").replace(/\/$/, "") || "/";
}

export function extractInstructorDirectory(wpRawContent: string): InstructorDirectoryCard[] {
  const raw = wpRawContent || "";
  const cards: InstructorDirectoryCard[] = [];
  const cardRe =
    /<div class="instructor-card-flex">[\s\S]*?<a href="([^"]*)"[^>]*>\s*(?:<img[^>]*src="([^"]*)"[^>]*>)?[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>[\s\S]*?<h4[^>]*>([\s\S]*?)<\/h4>([\s\S]*?)<\/div>\s*<\/div>/gi;
  for (const m of raw.matchAll(cardRe)) {
    const href = toRelativeHref(m[1] || "");
    const name = decodeEntities(stripTags(m[3] || "")).trim();
    const title = decodeEntities(stripTags(m[4] || "")).trim();
    if (!href || !name) continue;
    // Every <p> between the role and the closing tags, except the "See
    // Bio" link paragraph (same href as the card itself, not real info).
    const info = [...(m[5] || "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((p) => decodeEntities(stripTags(p[1])).trim())
      .filter((text) => text && !/^see bio$/i.test(text));
    cards.push({ name, title, photoUrl: m[2] || undefined, href, info });
  }
  return cards;
}
