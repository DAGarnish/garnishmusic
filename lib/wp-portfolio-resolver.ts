import { getPayloadClient } from "./get-payload";
import type { PortfolioListResolver, PortfolioItem } from "../scripts/wp-shortcode-render";

export async function buildPortfolioListResolver(
  siteId: number | string,
  rawContent: string
): Promise<PortfolioListResolver> {
  const categorySlugs = new Set<string>();
  for (const m of (rawContent || "").matchAll(/\[mkd_portfolio_list[^\]]*\bcategory="([^"]*)"/g)) {
    if (m[1]) categorySlugs.add(m[1]);
  }

  const map = new Map<string, PortfolioItem[]>();
  if (categorySlugs.size > 0) {
    const payload = await getPayloadClient();
    const categories = await payload.find({
      collection: "categories",
      where: { and: [{ site: { equals: siteId } }, { slug: { in: [...categorySlugs] } }] },
      limit: 100,
    });

    for (const category of categories.docs) {
      const pages = await payload.find({
        collection: "pages",
        where: {
          and: [
            { site: { equals: siteId } },
            { portfolioCategories: { in: [category.id] } },
          ],
        },
        limit: 100,
        depth: 1,
        // Explicit sort so row order (and therefore the rendered HTML
        // string) is stable across repeated queries - without it, ordering
        // isn't guaranteed and can differ between Next's two internal
        // render passes per request, causing hydration mismatches.
        sort: "id",
      });

      const items: PortfolioItem[] = pages.docs.map((p: any) => ({
        title: p.title,
        href: `/${p.slug}/`,
        imageUrl: typeof p.featuredImage === "object" ? p.featuredImage?.url : undefined,
        categoryLabel: category.name,
      }));
      // Multiple WP taxonomies (portfolio-category, category, product_cat)
      // can share the same slug for a site, producing more than one
      // Payload category doc per slug. Merge rather than overwrite so an
      // empty match from the wrong taxonomy doesn't clobber the real one.
      const slug = category.slug as string;
      map.set(slug, [...(map.get(slug) || []), ...items]);
    }
  }

  return (categorySlug: string) => map.get(categorySlug) || [];
}
