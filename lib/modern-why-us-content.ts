// edu's own real /why-us/ page ("Discover Qualities That Distinguish Us",
// id confirmed via scripts/check-edu-why-us-meta.ts) is four real
// <strong>Label:</strong> paragraphs (Teaching Excellence, Proven Success
// Stories, Global Presence and Continuous Enhancement, Founder's
// Expertise) - no shortcode structure at all, just plain HTML with real
// <a> links (instructor/press references) worth keeping intact rather than
// stripped to plain text. See ModernWhyUsPage.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
}

export type WhyUsBlurb = { label: string; bodyHtml: string };

export function extractWhyUsBlurbs(wpRawContent: string): WhyUsBlurb[] {
  const raw = (wpRawContent || "").trim();
  const blurbs: WhyUsBlurb[] = [];
  for (const m of raw.matchAll(/<strong>([^<]+?):<\/strong>\s*([\s\S]*?)(?=\n\s*<strong>|$)/gi)) {
    const label = decodeEntities(m[1]).trim();
    const bodyHtml = m[2].trim();
    if (label && bodyHtml) blurbs.push({ label, bodyHtml });
  }
  return blurbs;
}
