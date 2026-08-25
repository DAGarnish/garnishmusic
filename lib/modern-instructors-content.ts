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
