import { getPayloadClient } from "./get-payload";
import type { TestimonialsResolver, TestimonialItem } from "../scripts/wp-shortcode-render";

export async function buildTestimonialsResolver(
  siteId: number | string,
  rawContent: string
): Promise<TestimonialsResolver> {
  const usesTestimonials = /\[mkd_testimonials\b/.test(rawContent || "");
  if (!usesTestimonials) return () => [];

  // A page can have multiple [mkd_testimonials] instances, and each one's
  // own category attribute can itself be a comma-separated list (e.g. la's
  // /courses/fl-studio-production/ has both category="logic-pro" AND a
  // second instance category="hit-songwriting,songwriting-music-producer")
  // - confirmed against production, whose rendered carousel merges all of
  // them into one 14-slide widget. Splitting here means each individual
  // slug gets its own Payload category lookup below.
  const categorySlugs = new Set<string>();
  for (const m of (rawContent || "").matchAll(/\[mkd_testimonials[^\]]*\bcategory="([^"]*)"/g)) {
    if (!m[1]) continue;
    for (const slug of m[1].split(",")) {
      const trimmed = slug.trim();
      if (trimmed) categorySlugs.add(trimmed);
    }
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

  // One query per category previously meant a page with N distinct
  // testimonial categories made N sequential DB round-trips - fine when
  // each round-trip is a few ms, but this environment's Postgres connection
  // latency runs into multiple seconds per query (Neon serverless
  // cold-start), so N categories meant N times that latency compounding,
  // confirmed as the dominant cost behind some pages taking 60+ seconds to
  // render (e.g. ny's /courses/mixing-mastering/, with 2 separate
  // mkd_testimonials category sets). A single query with an "in" filter
  // across every category id, grouped client-side afterward, costs the
  // same one round-trip regardless of how many categories a page
  // references.
  const categoryIds = categories.docs.map((c: any) => c.id);
  const allTestimonials =
    categoryIds.length > 0
      ? await payload.find({
          collection: "testimonials",
          where: { and: [{ site: { equals: siteId } }, { categories: { in: categoryIds } }] },
          limit: 100,
          depth: 1,
          sort: "id",
        })
      : { docs: [] as any[] };

  const map = new Map<string, TestimonialItem[]>();
  for (const category of categories.docs) {
    const items: TestimonialItem[] = allTestimonials.docs
      .filter((t: any) =>
        Array.isArray(t.categories)
          ? t.categories.some((c: any) => (typeof c === "object" ? c.id : c) === category.id)
          : false
      )
      .map((t: any) => ({
        author: t.author,
        text: t.text,
        imageUrl: typeof t.image === "object" ? t.image?.url : undefined,
      }));
    const slug = category.slug as string;
    map.set(slug, [...(map.get(slug) || []), ...items]);
  }

  return (categorySlug: string) => map.get(categorySlug) || [];
}
