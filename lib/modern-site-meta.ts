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
// "staging" (edu's own network-wide-hub homepage preview - see
// ModernEduHomePage) and "edu" itself have no single city, and neither
// site.name follows the "Garnish Music Production School | <City>" pattern
// every per-city site's does (both are "...School, Worldwide" - a comma,
// not a pipe) - getCityName's own split falls through to
// site.slug.toUpperCase() for them with no override, which is how
// ModernCoursePage's "Course — STAGING" eyebrow leaked through before this
// existed. Every page on these two sites already independently hardcodes
// "Worldwide" as the human-readable equivalent (ModernEduHomePage's own
// hero, ModernFooter's cityName prop, ...), so this makes that the single
// source of truth instead.
const CITY_NAME_OVERRIDES: Record<string, string> = {
  staging: "Worldwide",
  edu: "Worldwide",
};

export function getCityName(site: { name?: string; slug?: string }): string {
  const slug = site.slug || "";
  if (CITY_NAME_OVERRIDES[slug]) return CITY_NAME_OVERRIDES[slug];
  const parts = (site.name || "").split("|");
  const city = parts.length > 1 ? parts[1].trim() : "";
  return city || slug.toUpperCase();
}

// "staging" is edu's own network-wide-hub homepage preview (see
// ModernEduHomePage) - "STAGING" is meaningless in the header mark real
// visitors see, and edu itself has no single city.
const CITY_ABBR_OVERRIDES: Record<string, string> = {
  staging: "EDU",
  edu: "EDU",
};

export function getCityAbbr(site: { slug?: string }): string {
  const slug = site.slug || "";
  return CITY_ABBR_OVERRIDES[slug] || slug.toUpperCase();
}
