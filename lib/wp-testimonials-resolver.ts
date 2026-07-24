import { getPayloadClient } from "./get-payload";
import type { TestimonialsResolver, TestimonialItem } from "../scripts/wp-shortcode-render";

export async function buildTestimonialsResolver(
  siteId: number | string,
  rawContent: string
): Promise<TestimonialsResolver> {
  const usesTestimonials = /\[mkd_testimonials\b/.test(rawContent || "");
  if (!usesTestimonials) return () => [];

  const categorySlugs = new Set<string>();
  for (const m of (rawContent || "").matchAll(/\[mkd_testimonials[^\]]*\bcategory="([^"]*)"/g)) {
    if (m[1]) categorySlugs.add(m[1]);
  }

  const payload = await getPayloadClient();

  // No category attribute: render all of this site's testimonials.
  if (categorySlugs.size === 0) {
    const all = await payload.find({
      collection: "testimonials",
      where: { site: { equals: siteId } },
      limit: 100,
      depth: 1,
      // See note in wp-portfolio-resolver.ts - explicit sort avoids
      // hydration mismatches from unstable row ordering.
      sort: "id",
    });
    const items: TestimonialItem[] = all.docs.map((t: any) => ({
      author: t.author,
      text: t.text,
      imageUrl: typeof t.image === "object" ? t.image?.url : undefined,
    }));
    return () => items;
  }

  const categories = await payload.find({
    collection: "categories",
    where: { and: [{ site: { equals: siteId } }, { slug: { in: [...categorySlugs] } }] },
    limit: 100,
  });

  const map = new Map<string, TestimonialItem[]>();
  for (const category of categories.docs) {
    const result = await payload.find({
      collection: "testimonials",
      where: { and: [{ site: { equals: siteId } }, { categories: { in: [category.id] } }] },
      limit: 100,
      depth: 1,
      sort: "id",
    });
    const items: TestimonialItem[] = result.docs.map((t: any) => ({
      author: t.author,
      text: t.text,
      imageUrl: typeof t.image === "object" ? t.image?.url : undefined,
    }));
    const slug = category.slug as string;
    map.set(slug, [...(map.get(slug) || []), ...items]);
  }

  return (categorySlug: string) => map.get(categorySlug) || [];
}
