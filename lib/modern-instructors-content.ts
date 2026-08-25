// Instructor bio pages (courses/{name}) are much simpler than course pages -
// bare paragraph text (blank-line separated, no <p> wrapper) with inline
// <strong>/<em>/<a> formatting, optionally wrapped in WPBakery
// [vc_row][vc_column][vc_column_text] layout shortcodes that carry no real
// content of their own. This strips those wrapper shortcodes and normalizes
// the surviving inline HTML the same way the course-page extractor does.
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
  const stripped = raw.replace(/\[\/?vc_[a-z_]+[^\]]*\]/gi, "");
  const paragraphs = stripped
    .split(/\n\s*\n/)
    .map((p) => decodeEntities(p.replace(/<(strong|em|p)[^>]*>/gi, "<$1>")).trim())
    .filter(Boolean);
  return paragraphs
    .map((p) => `<p>${p}</p>`)
    .join("")
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1" target="_blank" rel="noopener">');
}
