import "../../app/modern-globals.css";
import { getPayloadClient } from "../../lib/get-payload";
import { getAllSitesCached } from "../../lib/sites-cache";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import { getContactHref } from "../../lib/modern-sites";
import { getTopicPosts } from "../../lib/modern-edu-blog";
import type { MenuNode } from "../menu-html";

// The "View all" archive for one blog-topics tile (see ModernEduHomePage's
// "Browse by topic" section) - every real published post in that topic,
// not just the 3-post homepage preview. Routed from the [[...slug]]
// catch-all for any of TOPIC_POST_CATEGORY_SLUGS's 12 keys (see that map's
// own comment in lib/modern-edu-blog.ts) instead of falling through to the
// legacy theme, which has no page of its own at these slugs on "staging"
// (only edu's real site does).
export default async function ModernBlogTopicPage({
  site,
  topicSlug,
}: {
  site: any;
  topicSlug: string;
}) {
  const payload = await getPayloadClient();
  const allSites = await getAllSitesCached();
  const eduSite = allSites.find((s: any) => s.slug === "edu");

  // Title/image for the tile itself comes from edu's own portfolio-item
  // page doc (same "pages" doc ModernEduHomePage reads for this tile) -
  // refetched by slug here rather than threaded through as props, so this
  // route can be linked to directly without the homepage's own query.
  const topicPage = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: 15 } }, { slug: { equals: topicSlug } }] },
    limit: 1,
    depth: 1,
  });
  const topicDoc = topicPage.docs[0] as any;
  const topicTitle = topicDoc?.title || topicSlug.split("/").pop();

  const posts = eduSite ? await getTopicPosts(payload, eduSite, topicSlug, 200) : [];
  const contactHref = getContactHref(site.slug);

  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr="EDU" siteSlug={site.slug} />

      <section className="relative overflow-hidden gmpm-grid-bg">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-16 pb-12 md:pt-20 md:pb-16">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            From the Blog
          </div>
          <h1 className="gmpm-display font-bold text-[10vw] leading-[0.95] md:text-[4.5vw] md:leading-[0.95] max-w-4xl">
            {topicTitle}
          </h1>
          <p className="mt-6 text-lg text-[var(--gmpm-text-dim)] max-w-xl">
            {posts.length} {posts.length === 1 ? "article" : "articles"}.
          </p>
          <div className="mt-8">
            <a
              href={contactHref}
              className="gmpm-mono text-xs uppercase px-6 py-3 border border-[var(--gmpm-line)] hover:border-[var(--gmpm-accent)] transition-colors inline-block"
            >
              Talk to us
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--gmpm-line)]">
        {posts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--gmpm-line)] border border-[var(--gmpm-line)]">
            {posts.map((post, i) => (
              <a
                key={i}
                href={post.href}
                className="group bg-[var(--gmpm-bg)] p-6 flex flex-col hover:bg-[var(--gmpm-bg-raised)] transition-colors"
              >
                {post.imageUrl && (
                  <div className="aspect-[16/10] overflow-hidden mb-4 border border-[var(--gmpm-line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                {post.dateLabel && (
                  <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-text-dim)] mb-2">
                    {post.dateLabel}
                  </div>
                )}
                <h3 className="gmpm-display font-bold text-lg mb-2 group-hover:text-[var(--gmpm-accent)] transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-[var(--gmpm-text-dim)] leading-relaxed line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                )}
                <span className="gmpm-mono text-[11px] uppercase text-[var(--gmpm-accent)] mt-auto">Read →</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-[var(--gmpm-text-dim)]">No articles in this topic yet.</p>
        )}
      </section>

      <ModernFooter siteName={site.name} cityName="Worldwide" siteSlug={site.slug} />
    </div>
  );
}
