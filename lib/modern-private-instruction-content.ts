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
    .replace(/&#0?39;|&apos;/g, "'")
    // mia's own pricing bullets use a literal &bull; entity mid-sentence
    // ("...costs) &bull; Add 50% for each additional person") rather than a
    // real <li> per clause - decoded to a real bullet character rather than
    // left as literal text.
    .replace(/&bull;/g, "•");
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
  // mia's own private-tuition page has no <h1>/"<strong>Private Instruction"
  // marker at all - its intro is just the first [vc_column_text]'s own bare
  // <span> paragraph, right at the top of the page.
  const miaIntroMatch = raw.match(/\[vc_column_text[^\]]*\]\s*<span[^>]*>([\s\S]*?)<\/span>\s*\[\/vc_column_text\]/i);
  const intro = introMatch
    ? decodeEntities(introMatch[1].replace(/<[^>]+>/g, "")).trim()
    : miaIntroMatch
      ? decodeEntities(miaIntroMatch[1].replace(/<[^>]+>/g, "")).trim()
      : null;

  const pricingItems = [...raw.matchAll(/<li[^>]*><strong>([^<]*)<\/strong>\s*([\s\S]*?)<\/li>/gi)].map((m) =>
    decodeEntities(`${m[1]} ${m[2].replace(/<[^>]+>/g, "")}`.replace(/\s+/g, " ")).trim()
  );
  // mia's own pricing <li>s have no <strong> label prefix at all - just a
  // plain bulleted line (e.g. "Hourly instruction fee: $100 per hour...",
  // "6-hour package $580") - only used when the la-shaped match above found
  // nothing, so la's own labeled items keep their existing "label rest"
  // formatting untouched.
  const miaPricingItems =
    pricingItems.length === 0
      ? [...raw.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
          decodeEntities(m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ")).trim()
        )
      : [];

  const onlineMatch = raw.match(/<strong>Online:\s*<\/strong>\s*([^\n<]*)/i);
  const onlineNote = onlineMatch ? decodeEntities(onlineMatch[1]).trim() : null;

  return { intro, pricingItems: pricingItems.length > 0 ? pricingItems : miaPricingItems, onlineNote };
}

// Splits the flat pricingItems list into "what it costs" vs "what it costs
// extra depending on where you have it" (see ModernPricingLocationBlocks'
// own comment) - every real location-dependent bullet found across the
// network so far ("At our acoustically treated pro studio...", "At your
// home/studio/hotel...", "In a classroom at our facility...") opens with
// one of these same few words, so a simple prefix match is enough rather
// than hardcoding per-site item text. pdx/hou have no such bullets at all,
// so their split just returns everything in the pricing group.
const LOCATION_ITEM_RE = /^(at |in a |in an |in the |in one of |in our )/i;

export function splitPrivateInstructionPricing(pricingItems: string[]): {
  pricing: string[];
  location: string[];
} {
  const pricing: string[] = [];
  const location: string[] = [];
  for (const item of pricingItems) {
    (LOCATION_ITEM_RE.test(item) ? location : pricing).push(item);
  }
  return { pricing, location };
}
