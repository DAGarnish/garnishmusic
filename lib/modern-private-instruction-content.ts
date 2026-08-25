// Bespoke extractor for the single "private-instruction" page - its
// wpRawContent has mismatched/overlapping shortcode nesting (a stray
// [/mkd_accordion_tab][/mkd_accordion] with no matching open tag, a nested
// [vc_column_text] inside the still-open outer one) that doesn't fit either
// general shape in modern-course-content.ts, so this reads its specific
// known structure directly rather than trying to generalize from one page.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
}

export type PrivateInstructionContent = {
  intro: string | null;
  pricingItems: string[];
  onlineNote: string | null;
};

export function extractPrivateInstructionContent(wpRawContent: string): PrivateInstructionContent {
  const raw = wpRawContent || "";

  // Free-text intro between the closing </h1> (page title is used for the
  // hero heading instead - see caller - since a stale "| Marbella" location
  // in this particular <h1> shouldn't get surfaced) and the pricing list intro.
  const introMatch = raw.match(/<\/h1>([\s\S]*?)<strong>Private Instruction/i);
  const intro = introMatch ? decodeEntities(introMatch[1].replace(/<[^>]+>/g, "")).trim() : null;

  const pricingItems = [...raw.matchAll(/<li[^>]*><strong>([^<]*)<\/strong>\s*([\s\S]*?)<\/li>/gi)].map((m) =>
    decodeEntities(`${m[1]} ${m[2].replace(/<[^>]+>/g, "")}`.replace(/\s+/g, " ")).trim()
  );

  const onlineMatch = raw.match(/<strong>Online:\s*<\/strong>\s*([^\n<]*)/i);
  const onlineNote = onlineMatch ? decodeEntities(onlineMatch[1]).trim() : null;

  return { intro, pricingItems, onlineNote };
}
