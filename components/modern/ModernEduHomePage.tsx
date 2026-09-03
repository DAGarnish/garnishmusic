import "../../app/modern-globals.css";
import { getPayloadClient } from "../../lib/get-payload";
import { getAllSitesCached } from "../../lib/sites-cache";
import { getUrlRewriteContext, rewriteUrlForLocalDev } from "../../lib/current-site";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernPartners from "./ModernPartners";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { PARTNER_LOGOS_RED } from "../../lib/modern-partner-logos";
import { getContactHref } from "../../lib/modern-sites";
import { getTopicPosts, type BlogPost } from "../../lib/modern-edu-blog";
import type { MenuNode } from "../menu-html";

// edu's real live homepage (site id 15) IS its "Locations" page (WP's own
// page_on_front points at wpPostId 5271, titled "Locations") - two
// [mkd_portfolio_list] widgets back to back, "Categories by Topic" (real
// city sites) and "Blog" (topic tiles, "Browse by Topic"), both rendered
// with the byte-identical WP theme grid - confirmed live, that's the
// "blog looks identical to locations" the redesign here fixes. Real copy:
// metaTitle "World-class Music Production, Sound Engineering & DJ School",
// metaDescription "We're proud to present to you the world's boutique
// music production, sound engineering & electronic music DJ school in 8
// locations, worldwide" (page id 1451's own seo fields).
const HERO_HEADING = "World-class music production, sound engineering & DJ school.";
const HERO_SUBHEAD =
  "The world's boutique music production, sound engineering & electronic music DJ school - in locations worldwide.";

// Each "locations" portfolio item (edu's own /courses/<slug> pages, id 363-
// 414 - see lib/wp-portfolio-resolver.ts) is really just a signpost to that
// city's own real subdomain in this app - confirmed against every current
// Sites doc. "London" is the one exception: no ldn.* site exists in this
// network yet, so it's left pointing at its own edu-internal page rather
// than a real subdomain that would 404.
const CITY_SITE_SLUG: Record<string, string> = {
  "courses/tokyo": "tyo",
  "courses/houston": "hou",
  "courses/lisbon": "lis",
  "courses/barcelona": "bcn",
  "courses/syd": "syd",
  "courses/hk": "hk",
  "courses/ny": "ny",
  "courses/mia": "mia",
  "courses/nsh": "nsh",
  "courses/la": "la",
  "courses/sf": "sf",
};

type GridItem = { title: string; href: string; imageUrl: string | undefined };

type BlogTopic = GridItem & { posts: BlogPost[] };

export default async function ModernEduHomePage({ site }: { site: any }) {
  const payload = await getPayloadClient();

  const categories = await payload.find({
    collection: "categories",
    where: { and: [{ site: { equals: 15 } }, { slug: { in: ["locations", "blog-topics"] } }] },
    limit: 10,
    depth: 0,
  });
  const locationsCat = categories.docs.find((c: any) => c.slug === "locations") as any;
  const blogCat = categories.docs.find((c: any) => c.slug === "blog-topics") as any;

  const items = await payload.find({
    collection: "pages",
    where: {
      and: [
        { site: { equals: 15 } },
        { portfolioCategories: { in: [locationsCat?.id, blogCat?.id].filter(Boolean) } },
      ],
    },
    limit: 100,
    depth: 1,
    sort: "id",
  });

  const inCategory = (doc: any, catId: number | undefined) =>
    catId !== undefined &&
    Array.isArray(doc.portfolioCategories) &&
    doc.portfolioCategories.some((c: any) => (typeof c === "object" ? c.id : c) === catId);

  const imageUrl = (doc: any) =>
    (typeof doc.featuredImage === "object" && doc.featuredImage?.url) ||
    (typeof doc.titleBackgroundImage === "object" && doc.titleBackgroundImage?.url) ||
    undefined;

  const allSites = await getAllSitesCached();
  const ctx = await getUrlRewriteContext();
  const eduSite = allSites.find((s: any) => s.slug === "edu");
  // "London" (courses/ldn) is the one location tile with no real ldn.* site
  // in this network yet (see the CITY_SITE_SLUG comment above) - its
  // fallback points at edu's own real page for that slug, not a relative
  // path on this "staging" preview, which clones edu's nav only, not its
  // ~100 pages, and would 404 on a bare `/${slug}/`.
  const locationHref = (slug: string): string => {
    const citySlug = CITY_SITE_SLUG[slug];
    const citySite = citySlug ? allSites.find((s: any) => s.slug === citySlug) : undefined;
    const targetSite = citySite || eduSite;
    return targetSite ? rewriteUrlForLocalDev(`https://${targetSite.domain}/${citySite ? "" : `${slug}/`}`, ctx) : `/${slug}/`;
  };

  const locations: GridItem[] = (items.docs as any[])
    .filter((d) => inCategory(d, locationsCat?.id))
    .map((d) => ({ title: d.title, href: locationHref(d.slug), imageUrl: imageUrl(d) }));

  // Real posts are stored on edu (site 15) regardless of which site is
  // rendering, but render locally here (ModernBlogPostPage, routed via
  // [[...slug]] page.tsx's findStagingBlogPostCached) rather than linking
  // out to edu's own domain - so these are same-site links, no new tab.
  const blogTopicDocs = (items.docs as any[]).filter((d) => inCategory(d, blogCat?.id));
  const blogTopics: BlogTopic[] = await Promise.all(
    blogTopicDocs.map(async (d) => ({
      title: d.title,
      // Routed to ModernBlogTopicPage (see [[...slug]] page.tsx's own
      // TOPIC_POST_CATEGORY_SLUGS check) rather than a legacy fallback -
      // that page shows every real post in this topic, not just the 3
      // previewed below.
      href: `/${d.slug}/`,
      imageUrl: imageUrl(d),
      posts: eduSite ? await getTopicPosts(payload, eduSite, d.slug, 3) : [],
    }))
  );

  const contactHref = getContactHref(site.slug);

  // Same real photo ModernWhyUsPage's own hero uses (edu's real /why-us/
  // page, "whychooseus-10.png") - user request (2026-09-03) to give the
  // homepage the same image+gradient hero treatment, no dedicated
  // "worldwide" photo of its own existing to reach for instead.
  const whyUsPage = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: 15 } }, { slug: { equals: "why-us" } }] },
    limit: 1,
    depth: 1,
  });
  const heroImageUrl =
    typeof (whyUsPage.docs[0] as any)?.titleBackgroundImage === "object"
      ? (whyUsPage.docs[0] as any).titleBackgroundImage?.url
      : undefined;

  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr="EDU" siteSlug={site.slug} />

      <section className="relative overflow-hidden gmpm-grid-bg">
        <div className="absolute inset-0">
          {heroImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImageUrl} alt="" className="w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--gmpm-bg)] via-[var(--gmpm-bg)]/55 to-[var(--gmpm-bg)]/10" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-16 pb-8 md:pt-24 md:pb-16">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            Worldwide
          </div>
          <ModernTypewriterHeading
            key={HERO_HEADING}
            text={HERO_HEADING}
            className="font-bold text-[11vw] leading-[0.95] md:text-[5.5vw] md:leading-[0.95] max-w-4xl"
          />
          <p className="mt-8 text-lg text-[var(--gmpm-text-dim)] max-w-xl">{HERO_SUBHEAD}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#locations"
              className="gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
            >
              Find your city
            </a>
            <a
              href={contactHref}
              className="gmpm-mono text-xs uppercase px-6 py-3 border border-[var(--gmpm-line)] hover:border-[var(--gmpm-accent)] transition-colors"
            >
              Talk to us
            </a>
          </div>
        </div>
      </section>

      {locations.length > 0 && (
        <section id="locations" className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--gmpm-line)]">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Worldwide</div>
          <h2 className="gmpm-display font-bold text-3xl md:text-5xl max-w-2xl mb-12">Choose your city.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {locations.map((item, i) => (
              <a key={i} href={item.href} target="_blank" rel="noopener" className="group block">
                {item.imageUrl && (
                  <div className="gmpm-corner border border-[var(--gmpm-line)] aspect-[4/5] overflow-hidden mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <h3 className="gmpm-display font-bold text-lg group-hover:text-[var(--gmpm-accent)] transition-colors">
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Deliberately NOT the same photo-grid-of-destinations shape as
          Locations above (production today renders both with the byte-
          identical widget, which is the "blog looks like locations" bug
          this redesign fixes) - an editorial index instead: each topic's
          circular icon + "View all" CTA header, with its own 3 real, most-
          recent published posts listed underneath (see
          TOPIC_POST_CATEGORY_SLUGS/getTopicPosts above) so the section
          reads as an actual blog index rather than a bare set of category
          links with nothing behind them. */}
      {blogTopics.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--gmpm-line)]">
          <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
            <div>
              <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">From the Blog</div>
              <h2 className="gmpm-display font-bold text-3xl md:text-5xl max-w-2xl">Browse by topic.</h2>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-px bg-[var(--gmpm-line)] border border-[var(--gmpm-line)]">
            {blogTopics.map((item, i) => (
              <div key={i} className="bg-[var(--gmpm-bg)] p-5">
                <a href={item.href} className="group flex items-center gap-5 mb-4">
                  {item.imageUrl && (
                    <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border border-[var(--gmpm-line)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-text-dim)] mb-1">Topic</div>
                    <h3 className="gmpm-display font-bold text-lg group-hover:text-[var(--gmpm-accent)] transition-colors truncate">
                      {item.title}
                    </h3>
                  </div>
                  <span className="gmpm-mono text-xs text-[var(--gmpm-text-dim)] group-hover:text-[var(--gmpm-accent)] transition-colors shrink-0">
                    View all →
                  </span>
                </a>
                {item.posts.length > 0 && (
                  <ul className="border-t border-[var(--gmpm-line)] divide-y divide-[var(--gmpm-line)]">
                    {item.posts.map((post, j) => (
                      <li key={j}>
                        <a href={post.href} className="group/post flex items-start gap-3 py-3">
                          <span className="gmpm-mono text-xs text-[var(--gmpm-accent)] shrink-0 mt-[2px]">/</span>
                          <span className="text-sm leading-snug text-[var(--gmpm-text)] group-hover/post:text-[var(--gmpm-accent)] transition-colors">
                            {post.title}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <ModernPartners logos={PARTNER_LOGOS_RED} />

      <ModernFooter siteName={site.name} cityName="Worldwide" siteSlug={site.slug} />
    </div>
  );
}
