// Related-reading section for course/program pages. All blog posts live on
// the "edu" site network-wide (see wp-blog-list-resolver.ts's comment - the
// ~750 posts were consolidated there for SEO reasons), so this always
// queries edu's posts/categories regardless of which site is rendering,
// and every link opens in a new tab pointed at the edu copy.
//
// Most course pages have no legacy [mkd_blog_list category="..."] shortcode
// of their own to reuse (checked: only 2 of ~19 pdx course pages have one,
// and where present the category list is a generic, seemingly copy-pasted
// set, not really course-specific) - so this maps each course/program slug
// to real edu category slugs instead, several of which line up exactly with
// the course itself (ableton-live, logic-pro, pro-tools, mixing-mastering,
// ableton-producer, logic-producer, private-tuition, summer-camp).
export const COURSE_BLOG_CATEGORY_SLUGS: Record<string, string[]> = {
  "courses/ableton-live": ["ableton-live", "ableton"],
  "courses/ableton-live-djs": ["ableton-live", "electronic-dj", "ableton"],
  "courses/fl-studio": ["software", "production"],
  "courses/logic-pro": ["logic-pro", "logic"],
  "courses/pro-tools": ["pro-tools", "software"],
  "courses/mixing-mastering": ["mixing-mastering", "mixing"],
  "courses/mastering": ["mixing-mastering", "mixing"],
  "courses/songwriting-course": ["hit-songwriting", "songwriting"],
  "courses/vocal-production": ["vox"],
  "courses/composition": ["songwriting", "production"],
  "courses/rhythm-section-programming": ["production"],
  "courses/electronic-sound-art": ["sound-design", "electronic"],
  "courses/rekordbox": ["electronic-dj", "dj-school"],
  "courses/electronic-dj-course": ["electronic-dj", "dj-school"],
  "courses/summer-camp-school": ["summer-camp"],
  "courses/k-pop-hit-songwriting-class": ["hit-songwriting", "songwriting"],
  "courses/mixing-sound-design-film-tv": ["sound-design", "mixing"],
  "courses/modern-pop-music-production-recording": ["production", "songwriting"],
  academy: ["comprehensive-academy", "production-courses"],
  "ableton-producer": ["ableton-producer", "ableton"],
  "logic-producer": ["logic-producer", "logic"],
  "private-instruction": ["private-tuition"],
};
const FALLBACK_CATEGORY_SLUGS = ["featured", "tutorials"];

export type RelatedPost = { title: string; slug: string; excerpt?: string; imageUrl?: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function getRelatedPosts(
  payload: any,
  eduSiteId: number | string,
  pageSlug: string,
  count = 6
): Promise<RelatedPost[]> {
  const primarySlugs = COURSE_BLOG_CATEGORY_SLUGS[pageSlug] || [];
  const categories = await payload.find({
    collection: "categories",
    where: { and: [{ site: { equals: eduSiteId } }, { slug: { in: [...primarySlugs, ...FALLBACK_CATEGORY_SLUGS] } }] },
    limit: 20,
  });
  const primaryIds = categories.docs.filter((c: any) => primarySlugs.includes(c.slug)).map((c: any) => c.id);
  const fallbackIds = categories.docs.filter((c: any) => FALLBACK_CATEGORY_SLUGS.includes(c.slug)).map((c: any) => c.id);

  async function fetchByCategoryIds(ids: number[]) {
    if (!ids.length) return [];
    const result = await payload.find({
      collection: "posts",
      where: { and: [{ site: { equals: eduSiteId } }, { status: { equals: "published" } }, { categories: { in: ids } }] },
      depth: 0,
      limit: 60,
    });
    return result.docs as any[];
  }

  const posts = await fetchByCategoryIds(primaryIds);
  if (posts.length < count) {
    const seen = new Set(posts.map((p) => p.id));
    const more = await fetchByCategoryIds(fallbackIds);
    for (const p of more) {
      if (!seen.has(p.id)) {
        posts.push(p);
        seen.add(p.id);
      }
    }
  }

  return shuffle(posts)
    .slice(0, count)
    .map((p) => ({ title: p.title, slug: p.slug, excerpt: p.excerpt || undefined }));
}
