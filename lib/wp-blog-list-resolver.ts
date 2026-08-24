import { getPayloadClient } from "./get-payload";
import { getAllSitesCached } from "./sites-cache";
import { getUrlRewriteContext, rewriteUrlForLocalDev } from "./current-site";
import type { BlogListResolver, BlogListItem } from "../scripts/wp-shortcode-render";

// All blog posts live on the "edu" site now (see scripts/migrate-blog-posts.ts
// - the network's ~750 posts were consolidated there to fix duplicate-content
// SEO drag). This resolver always queries edu's own posts/categories
// regardless of which site is rendering the [mkd_blog_list] shortcode, and
// marks every item with targetBlank=true unless the current site IS edu, so
// a course page on any other subdomain links out to the edu copy in a new
// tab instead of querying content that no longer exists locally.
export async function buildBlogListResolver(
  site: { id: number | string; slug: string },
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
  const allSites = await getAllSitesCached();
  const eduSite = allSites.find((s: any) => s.slug === "edu");
  if (!eduSite) return () => [];
  const targetBlank = site.slug !== "edu";
  const ctx = await getUrlRewriteContext();
  const map = new Map<string, BlogListItem[]>();

  for (const csv of categoryCsvs) {
    const slugs = csv.split(",").map((s) => s.trim()).filter(Boolean);
    const categories = await payload.find({
      collection: "categories",
      where: { and: [{ site: { equals: eduSite.id } }, { slug: { in: slugs } }] },
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
          { site: { equals: eduSite.id } },
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
      href: rewriteUrlForLocalDev(`https://${eduSite.domain}/${p.slug}/`, ctx),
      targetBlank,
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
