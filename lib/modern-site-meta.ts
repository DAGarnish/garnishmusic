// The modern design system's per-site copy ("Portland — Music Production &
// DJ School", the footer's "— Houston", the header's "PDX"/"HOU" mark) reads
// off two small derived values instead of hardcoding one city everywhere,
// so a second/third rollout of this design (see app/(frontend)/[[...slug]]/
// page.tsx's MODERN_SITE_SLUGS) doesn't need per-string edits. Every site's
// `name` follows "Garnish Music Production School | <City>" (confirmed
// across all live sites, e.g. pdx -> "| Portland", hou -> "| Houston") - the
// part after the pipe is the real, human city name a visitor expects to
// read, so it's read from there rather than reverse-engineered from the
// slug (which is a 2-3 letter airport-style code, not a place name).
export function getCityName(site: { name?: string; slug?: string }): string {
  const parts = (site.name || "").split("|");
  const city = parts.length > 1 ? parts[1].trim() : "";
  return city || (site.slug || "").toUpperCase();
}

// "staging" is edu's own network-wide-hub homepage preview (see
// ModernEduHomePage) - "STAGING" is meaningless in the header mark real
// visitors see, and edu itself has no single city (getCityName's own
// site.name split also needs an edu-specific fallback - see below).
const CITY_ABBR_OVERRIDES: Record<string, string> = {
  staging: "EDU",
};

export function getCityAbbr(site: { slug?: string }): string {
  const slug = site.slug || "";
  return CITY_ABBR_OVERRIDES[slug] || slug.toUpperCase();
}
