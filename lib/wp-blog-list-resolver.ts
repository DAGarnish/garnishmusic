import { getPayloadClient } from "./get-payload";
import type { BlogListResolver, BlogListItem } from "../scripts/wp-shortcode-render";

export async function buildBlogListResolver(
  siteId: number | string,
  rawContent: string
): Promise<BlogListResolver> {
  const usesBlogList = /\[mkd_blog_list\b/.test(rawContent || "");
  if (!usesBlogList) return () => [];

  const categoryCsvs = new Set<string>();
  for (const m of (rawContent || "").matchAll(/\[mkd_blog_list[^\]]*\bcategory="([^"]*)"/g)) {
    if (m[1]) categoryCsvs.add(m[1]);
  }
  if (categoryCsvs.size === 0) return () => [];

  const payload = await getPayloadClient();
  const map = new Map<string, BlogListItem[]>();

  for (const csv of categoryCsvs) {
    const slugs = csv.split(",").map((s) => s.trim()).filter(Boolean);
    const categories = await payload.find({
      collection: "categories",
      where: { and: [{ site: { equals: siteId } }, { slug: { in: slugs } }] },
      limit: 100,
    });
    if (categories.docs.length === 0) {
      map.set(csv, []);
      continue;
    }
    const categoryIds = categories.docs.map((c: any) => c.id);
    const result = await payload.find({
      collection: "posts",
      where: {
        and: [
          { site: { equals: siteId } },
          { status: { equals: "published" } },
          { categories: { in: categoryIds } },
        ],
      },
      depth: 1,
      limit: 100,
      sort: "id",
    });
    const items: BlogListItem[] = result.docs.map((p: any) => ({
      title: p.title,
      href: `/${p.slug}/`,
      categoryLabels: Array.isArray(p.categories)
        ? p.categories.map((c: any) => (typeof c === "object" ? c.name : null)).filter(Boolean)
        : [],
      dateLabel: p.publishedDate
        ? new Date(p.publishedDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : undefined,
      excerpt: p.excerpt || "",
    }));
    map.set(csv, items);
  }

  return (categoryCsv: string) => map.get(categoryCsv) || [];
}
