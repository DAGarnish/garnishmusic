import { getPayloadClient } from "../lib/get-payload";
import { getUrlRewriteContext, rewriteUrlForLocalDev } from "../lib/current-site";

type SidebarSite = {
  id: number | string;
  domain: string;
  sidebarYelpImage?: unknown;
};

// The "sidebar" widget area (Yelp banner, Recent Posts, Search) is
// network-wide static chrome, not page content - confirmed against
// production, where the Yelp widget's shortcode (mkd_image_with_text,
// attachment id 10041, same title/link text) is byte-identical across
// every site's wp_options, and only the resolved image URL differs
// because each site independently has its own copy of the same file in
// its own media library. Recent Posts is the one genuinely per-site,
// per-request piece - generated live from that site's own posts rather
// than scraped, since we already have the data migrated.
export default async function Sidebar({ site }: { site: SidebarSite }) {
  const payload = await getPayloadClient();
  const ctx = await getUrlRewriteContext();

  const recentPosts = await payload.find({
    collection: "posts",
    where: { site: { equals: site.id } },
    sort: "-publishedDate",
    limit: 5,
    depth: 0,
  });

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
          <h5 className="mkd-widget-title">Recent Posts</h5>
          <ul>
            {recentPosts.docs.map((post) => (
              <li key={post.id}>
                <a href={rewriteUrlForLocalDev(`https://${site.domain}/${post.slug}/`, ctx)}>{post.title}</a>
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
