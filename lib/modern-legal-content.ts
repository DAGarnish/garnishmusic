// edu's real /tc/ and /privacy-policy/ pages - both a flat run of <h3>/<h4>
// headings each followed by bare paragraph text (WordPress's own export
// dropped the <p> wrapper entirely on most of it - confirmed on both pages,
// paragraphs are just blank-line-separated text) plus the occasional real
// <ul> list and inline <strong>/<a> markup (e.g. privacy-policy's "a) Usage
// Data" bold sub-labels, its real "Get the add-on from Google" link).
// modern-course-content.ts's own extractParagraphs was built for pages
// whose body text IS wrapped in real <p> tags - reaching for it here would
// have silently dropped most of both documents (confirmed: extractParagraphs
// only ever falls back to bare-paragraph text when its BLOCK_RE finds zero
// blocks on the whole page, not per-section, and both pages have plenty of
// real <ul>/<h3-4> matches that would have suppressed that fallback while
// still losing every bare paragraph in between). This is a simpler, purpose
// -built extractor for exactly this shape instead.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
}

// Keeps <strong>/<em>/<a> (real inline emphasis/links worth preserving),
// strips everything else (stray <p>/<div>/<span> wrapper tags, WordPress's
// own data-* attributes), and forces every <a> to open in a new tab -
// these are the only two pages network-wide (this shape isn't shared with
// any course page) that link off-site (Google's opt-out add-on, this
// site's own /connect/) from body copy.
function cleanInlineHtml(s: string): string {
  return s
    .replace(/<(?!\/?(strong|em|a)\b)[^>]+>/gi, "")
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1" target="_blank" rel="noopener" class="text-[var(--gmpm-accent)] underline underline-offset-2">')
    // The trailing [/vc_column_text][/vc_column][/vc_row] closing every
    // page's own outer wrapper (never a real heading boundary, so never
    // trimmed by extractLegalDocument's own heading-to-heading slicing) -
    // confirmed leaking into the last section's final paragraph as literal
    // visible text without this.
    .replace(/\[\/?[a-z_]+[^\]]*\]/gi, "")
    .trim();
}

function legalBodyToHtml(chunk: string): string {
  const parts: string[] = [];
  for (const segment of chunk.split(/(<[uo]l[^>]*>[\s\S]*?<\/[uo]l>)/gi)) {
    if (/^<[uo]l/i.test(segment)) {
      const ordered = /^<ol/i.test(segment);
      const items = [...segment.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((m) => decodeEntities(cleanInlineHtml(m[1])).trim())
        .filter(Boolean);
      if (items.length) {
        const tag = ordered ? "ol" : "ul";
        const listClass = ordered ? "list-decimal" : "list-disc";
        parts.push(
          `<${tag} class="${listClass} pl-6 space-y-1 my-4">${items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`
        );
      }
    } else {
      for (const para of segment.split(/\n\s*\n/)) {
        const text = decodeEntities(cleanInlineHtml(para)).trim();
        if (text) parts.push(`<p class="mb-4">${text}</p>`);
      }
    }
  }
  return parts.join("");
}

// edu-2's own /gift/ page - just two bare paragraphs plus a WooCommerce
// [variation-dropdow] shortcode (no real checkout for this network), no
// <h3>/<h4> headings at all, so extractLegalDocument's own heading-to-
// heading slicing finds zero sections. Reuses the same paragraph/list-to-
// HTML conversion it already applies per-section, just applied once to the
// whole raw body instead - cleanInlineHtml's shortcode strip already drops
// the WooCommerce tag on its own.
export function extractPlainBodyHtml(wpRawContent: string): string {
  return legalBodyToHtml(wpRawContent || "");
}

export type LegalSection = { heading: string; bodyHtml: string };

export function extractLegalDocument(wpRawContent: string): LegalSection[] {
  const raw = wpRawContent || "";
  const sections: LegalSection[] = [];
  const headingMatches = [...raw.matchAll(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/gi)];
  for (let i = 0; i < headingMatches.length; i++) {
    const match = headingMatches[i];
    const heading = decodeEntities((match[1] || "").replace(/<[^>]+>/g, "")).trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < headingMatches.length ? headingMatches[i + 1].index : raw.length;
    const bodyHtml = legalBodyToHtml(raw.slice(start, end));
    if (heading && bodyHtml) sections.push({ heading, bodyHtml });
  }
  return sections;
}
