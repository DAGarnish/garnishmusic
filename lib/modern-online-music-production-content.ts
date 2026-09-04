// edu-2's real /online-music-production/ page (id 1443, "Do What You Love.
// Remotely.") - a nested [vc_row][vc_column][vc_column_text] block of 3
// plain paragraphs plus a [vc_video] embed. Its own [mkd_section_title]/
// bare-<h2> shape doesn't match either of extractCourseIntro's/
// extractCourseSections' two known page shapes (confirmed empirically: both
// return nothing usable here, and extractCourseSections instead
// misidentifies a leading disable_element="yes" row - a tiny "Online Music
// Production" heading + 30px gif, not real visible content - as the page's
// only section), so it gets this small dedicated extractor instead, same
// reasoning as extractWhyUsBlurbs/extractLegalDocument for their own
// one-off pages. See ModernOnlineMusicProductionPage.
export function extractOnlineMusicProductionParagraphs(wpRawContent: string): string[] {
  const raw = wpRawContent || "";
  const blocks = [...raw.matchAll(/\[vc_column_text[^\]]*\]([\s\S]*?)\[\/vc_column_text\]/gi)].map((m) => m[1].trim());
  // The real copy block is the one with actual <strong> lead-ins - every
  // other vc_column_text on this page just wraps the disabled heading or a
  // bare <img>.
  const textBlock = blocks.find((b) => /<strong>/i.test(b));
  if (!textBlock) return [];
  return textBlock
    // This block's own opening tag is nested two levels deep inside a
    // further [vc_row][vc_column][vc_column_text] that never gets its own
    // matching close (the raw shortcode text isn't a properly balanced
    // tree), so the regex above's non-greedy capture swallows those stray
    // open tags as a literal prefix - stripped here before paragraph-
    // splitting rather than rendered as visible "[vc_row]..." text.
    .replace(/\[[^\]]*\]/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
