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
// edu itself has no single city, and its site.name doesn't follow the
// "Garnish Music Production School | <City>" pattern every per-city site's
// does (it's "...School, Worldwide" - a comma, not a pipe) - getCityName's
// own split falls through to site.slug.toUpperCase() for it with no
// override, which is how ModernCoursePage's "Course — EDU" eyebrow would
// otherwise leak through. Every page on edu already independently
// hardcodes "Worldwide" as the human-readable equivalent (ModernEduHomePage's
// own hero, ModernFooter's cityName prop, ...), so this makes that the
// single source of truth instead. "ny" itself gets no override here - its
// own site.name has a real "| New York" suffix that the normal split below
// already handles correctly (see ModernNYHomePage).
const CITY_NAME_OVERRIDES: Record<string, string> = {
  edu: "Worldwide",
};

export function getCityName(site: { name?: string; slug?: string }): string {
  const slug = site.slug || "";
  if (CITY_NAME_OVERRIDES[slug]) return CITY_NAME_OVERRIDES[slug];
  const parts = (site.name || "").split("|");
  const city = parts.length > 1 ? parts[1].trim() : "";
  return city || slug.toUpperCase();
}

// edu itself has no single city - "EDU" reads better in the header mark
// than its bare slug would anyway, but there's no slug this trivial for it
// to fall back to correctly. ny's own real abbreviation is "NYC" (three
// letters), not the bare uppercased two-letter slug "NY" the fallback
// below would otherwise produce.
const CITY_ABBR_OVERRIDES: Record<string, string> = {
  edu: "EDU",
  ny: "NYC",
};

export function getCityAbbr(site: { slug?: string }): string {
  const slug = site.slug || "";
  return CITY_ABBR_OVERRIDES[slug] || slug.toUpperCase();
}
