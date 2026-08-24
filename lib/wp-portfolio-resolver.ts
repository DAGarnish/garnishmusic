import { getPayloadClient } from "./get-payload";
import type { PortfolioListResolver, PortfolioItem } from "../scripts/wp-shortcode-render";

export async function buildPortfolioListResolver(
  siteId: number | string,
  rawContent: string
): Promise<PortfolioListResolver> {
  // mkd_portfolio_slider is a separate shortcode from mkd_portfolio_list
  // (confirmed against production, e.g. la's /courses/synthesis-and-sound-
  // design/ "Meet Our World-Class Instructors" section), but shares the
  // same category-filtered portfolio data - rendered here as the same
  // static grid mkd_portfolio_list already uses rather than reproducing its
  // JS carousel, which doesn't need to run for the images to show. Its
  // category attribute can hold a comma-separated list (e.g. "ableton,
  // sound-design, logic"), unlike mkd_portfolio_list's single slug.
  // Category slugs are always lowercase (Payload's slug field normalizes
  // on save - confirmed against every category in this network), but
  // shortcode authors typed this attribute by hand and didn't reliably
  // match that casing (e.g. courses/dj-course's own "Meet Our World-Class
  // Instructors" section uses category="DJ", not "dj" - silently
  // rendering nothing this whole time, confirmed live). Lowercase here so
  // the query below actually finds the category regardless of how the
  // shortcode capitalized it.
  const categorySlugs = new Set<string>();
  for (const m of (rawContent || "").matchAll(/\[mkd_portfolio_(?:list|slider)[^\]]*\bcategory="([^"]*)"/g)) {
    if (!m[1]) continue;
    for (const slug of m[1].split(",")) {
      const trimmed = slug.trim().toLowerCase();
      if (trimmed) categorySlugs.add(trimmed);
    }
  }

  const map = new Map<string, PortfolioItem[]>();
  if (categorySlugs.size > 0) {
    const payload = await getPayloadClient();
    const categories = await payload.find({
      collection: "categories",
      where: { and: [{ site: { equals: siteId } }, { slug: { in: [...categorySlugs] } }] },
      limit: 100,
    });

    // One query per category previously meant a page with N distinct
    // portfolio categories made N sequential DB round-trips - fine when
    // each round-trip is a few ms, but this environment's Postgres
    // connection latency runs into multiple seconds per query (Neon
    // serverless cold-start), so N categories meant N times that latency
    // compounding, confirmed as the dominant cost behind some pages taking
    // 60+ seconds to render (e.g. ny's /courses/mixing-mastering/, with 2
    // separate mkd_portfolio_slider category sets). A single query with an
    // "in" filter across every category id, grouped client-side afterward,
    // costs the same one round-trip regardless of how many categories a
    // page references.
    const categoryIds = categories.docs.map((c: any) => c.id);
    const pages =
      categoryIds.length > 0
        ? await payload.find({
            collection: "pages",
            where: {
              and: [{ site: { equals: siteId } }, { portfolioCategories: { in: categoryIds } }],
            },
            limit: 100,
            depth: 1,
            // Explicit sort so row order (and therefore the rendered HTML
            // string) is stable across repeated queries - without it,
            // ordering isn't guaranteed and can differ between Next's two
            // internal render passes per request, causing hydration
            // mismatches.
            sort: "id",
          })
        : { docs: [] as any[] };

    for (const category of categories.docs) {
      const items: PortfolioItem[] = pages.docs
        .filter((p: any) =>
          Array.isArray(p.portfolioCategories)
            ? p.portfolioCategories.some((c: any) => (typeof c === "object" ? c.id : c) === category.id)
            : false
        )
        .map((p: any) => ({
          title: p.title,
          href: `/${p.slug}/`,
          imageUrl: (typeof p.featuredImage === "object" && p.featuredImage?.url) 
            ? p.featuredImage.url 
            : (typeof p.titleBackgroundImage === "object" && p.titleBackgroundImage?.url) 
              ? p.titleBackgroundImage.url 
              : undefined,
          categoryLabel:
            category.name?.toLowerCase() === "locations" || category.slug === "blog-topics"
              ? undefined
              : category.name,
        }));
      // Multiple WP taxonomies (portfolio-category, category, product_cat)
      // can share the same slug for a site, producing more than one
      // Payload category doc per slug. Merge rather than overwrite so an
      // empty match from the wrong taxonomy doesn't clobber the real one.
      const slug = category.slug as string;
      map.set(slug, [...(map.get(slug) || []), ...items]);
    }
  }

  return (categorySlug: string) => {
    let list = map.get(categorySlug.trim().toLowerCase()) || [];
    
    // Globally remove Release Party from portfolio grids
    list = list.filter(i => !i.href.includes("release-party"));
    
    return list;
  };
}
