import { getPayloadClient } from "../lib/get-payload";
import { getAllSitesCached } from "../lib/sites-cache";
import { getUrlRewriteContext, rewriteUrlForLocalDev } from "../lib/current-site";

type SidebarSite = {
  id: number | string;
  slug: string;
  domain: string;
  sidebarYelpImage?: unknown;
};

// The "sidebar" widget area (Yelp banner, Featured Posts, Search) is
// network-wide static chrome, not page content - confirmed against
// production, where the Yelp widget's shortcode (mkd_image_with_text,
// attachment id 10041, same title/link text) is byte-identical across
// every site's wp_options, and only the resolved image URL differs
// because each site independently has its own copy of the same file in
// its own media library. Featured Posts always pulls from edu-2's posts now
// (see scripts/migrate-blog-posts.ts - every site's blog content was
// consolidated there for SEO, before edu's own later cutover onto its
// staging redesign moved that content to edu-2 - see
// scripts/promote-staging-to-edu.ts), opening in a new tab from any other
// site.
//
// FEATURED_CATEGORY_ID (806, edu-2's "Featured" category, slug "featured" -
// not to be confused with the separate 1-post "featured-archives" category
// that happens to share the display name) is the real, already-established
// curation mechanism: 23 posts already carry this tag from the original WP
// migration. Tag any post with it in the admin to make it eligible here.
const FEATURED_CATEGORY_ID = 806;
// "360-Degree Video Footage Of A Class" is explicitly pinned per an
// editorial request - it's tagged with FEATURED_CATEGORY_ID like any other
// featured post, but its 2017 publishedDate means a plain "N most recent
// featured posts" query would never surface it against 2022-dated peers,
// so it's guaranteed a slot below rather than left to compete on recency.
const PINNED_SLUG = "360-degree-video-footage-of-a-class";

export default async function Sidebar({ site }: { site: SidebarSite }) {
  const payload = await getPayloadClient();
  const ctx = await getUrlRewriteContext();
  const allSites = await getAllSitesCached();
  const eduSite = allSites.find((s: any) => s.slug === "edu-2") || site;
  const linksOffSite = site.slug !== "edu-2";

  const [pinned, otherFeatured] = await Promise.all([
    payload.find({
      collection: "posts",
      where: { and: [{ site: { equals: eduSite.id } }, { slug: { equals: PINNED_SLUG } }] },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: "posts",
      where: {
        and: [
          { site: { equals: eduSite.id } },
          { status: { equals: "published" } },
          { categories: { in: [FEATURED_CATEGORY_ID] } },
          { slug: { not_equals: PINNED_SLUG } },
        ],
      },
      sort: "-publishedDate",
      limit: 4,
      depth: 0,
    }),
  ]);

  const recentPosts = { docs: [...pinned.docs, ...otherFeatured.docs] };

  const yelpImage =
    site.sidebarYelpImage && typeof site.sidebarYelpImage === "object"
      ? (site.sidebarYelpImage as { url?: string; width?: number; height?: number })
      : undefined;

  const searchAction = rewriteUrlForLocalDev(`https://${site.domain}/`, ctx);

  return (
    <aside className="mkd-sidebar">
      <div id="text-26" className="widget widget_text">
        <div className="textwidget">
          <div className="mkd-image-with-text">
            <a
              className="mkd-iwt-link"
              href="https://www.yelp.com/biz/garnish-music-production-school-west-hollywood"
              target="_blank"
              rel="external noopener noreferrer"
            ></a>
            <div className="mkd-iwt-text">
              <span className="mkd-iwt-title" style={{ color: "#ffffff", fontSize: 32 }}>
                See reviews &amp; pictures on Yelp
              </span>
            </div>
            {yelpImage?.url && (
              <div className="mkd-iwt-image">
                <img
                  src={yelpImage.url}
                  alt=""
                  width={yelpImage.width ?? undefined}
                  height={yelpImage.height ?? undefined}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {recentPosts.docs.length > 0 && (
        <div id="recent-posts-2" className="widget widget_recent_entries">
          <h5 className="mkd-widget-title">Featured Posts</h5>
          <ul>
            {recentPosts.docs.map((post) => (
              <li key={post.id}>
                <a
                  href={rewriteUrlForLocalDev(`https://${eduSite.domain}/${post.slug}/`, ctx)}
                  {...(linksOffSite ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div id="search-2" className="widget widget_search">
        <form method="get" id="searchform" action={searchAction}>
          <div className="mkd-search-wrapper">
            <input type="text" defaultValue="" placeholder="Search" name="s" id="s" />
            <input type="submit" id="searchsubmit" value="" />
          </div>
        </form>
      </div>
    </aside>
  );
}
