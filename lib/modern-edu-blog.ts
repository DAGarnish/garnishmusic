// Maps each "blog-topics" portfolio tile (its own page slug, e.g.
// "blog/production") to the real post-category slugs actual blog posts are
// tagged with on edu-2 (site 15) - confirmed via `categories` collection dump
// (82 real categories exist; these are the ones that line up with each
// topic tile, several archived/aliased duplicates included, e.g. "ableton"
// + "ableton-live" + "ableton-archives" + "tutorials-ableton" all being
// real Ableton-tagged posts). Shared by ModernEduHomePage (each topic's
// 3-post preview) and ModernBlogTopicPage (that topic's full archive) so
// the two stay in sync, and by the [[...slug]] catch-all's own route check
// (Object.keys) so every one of these 12 slugs actually routes to
// ModernBlogTopicPage instead of falling through to the legacy theme.
export const TOPIC_POST_CATEGORY_SLUGS: Record<string, string[]> = {
  "blog/production": ["production", "producer"],
  "blog/songwriting": ["songwriting", "songwriting-insights", "hit-songwriting"],
  "blog/ableton": ["ableton", "ableton-live", "ableton-archives", "tutorials-ableton"],
  "blog/logic": ["logic-pro", "logic", "logic-producer"],
  "blog/mixing": ["mixing-mastering", "mixing"],
  "blog/software": ["software", "software-archives"],
  "blog/electronic": ["electronic", "electronic-archives", "electronic-dj", "electronic-music-producer"],
  "blog/biz": ["biz", "business", "marketing", "marketing-archives"],
  "blog/comp": ["comp"],
  "blog/sound-engineering-2": ["sound-engineering-2"],
  "blog/hip-hop": ["hip-hop"],
  "blog/acoustics": ["acoustics"],
};

export type BlogPost = {
  title: string;
  href: string;
  excerpt: string;
  imageUrl?: string;
  dateLabel?: string;
};

// Real posts are stored on edu-2 (site 15) regardless of which site is
// rendering (see lib/wp-blog-list-resolver.ts's own comment), but they
// render locally through ModernBlogPostPage (see [[...slug]]/page.tsx's
// findStagingBlogPostCached) rather than linking out to edu-2's own domain -
// so href here is a same-site relative path, not a cross-domain one.
// `limit: 3` for the homepage's per-topic preview, uncapped (200
// comfortably covers every topic - edu-2 has 329 posts total across all 12)
// for ModernBlogTopicPage's full archive.
export async function getTopicPosts(
  payload: any,
  eduSite: { id: number | string },
  topicSlug: string,
  limit: number
): Promise<BlogPost[]> {
  const catSlugs = TOPIC_POST_CATEGORY_SLUGS[topicSlug];
  if (!catSlugs) return [];
  const cats = await payload.find({
    collection: "categories",
    where: { and: [{ site: { equals: eduSite.id } }, { slug: { in: catSlugs } }] },
    limit: 20,
    depth: 0,
  });
  const catIds = cats.docs.map((c: any) => c.id);
  if (catIds.length === 0) return [];
  const postsRes = await payload.find({
    collection: "posts",
    where: {
      and: [
        { site: { equals: eduSite.id } },
        { status: { equals: "published" } },
        { categories: { in: catIds } },
      ],
    },
    depth: 1,
    limit,
    sort: "-publishedDate",
  });
  return (postsRes.docs as any[]).map((p) => ({
    title: p.title,
    href: `/${p.slug}/`,
    excerpt: p.excerpt || "",
    imageUrl: typeof p.featuredImage === "object" ? p.featuredImage?.url : undefined,
    dateLabel: p.publishedDate
      ? new Date(p.publishedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : undefined,
  }));
}
