export const dynamic = "force-dynamic";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Sidebar from "../../../components/Sidebar";
import PortfolioShare from "../../../components/PortfolioShare";
import AddToCart from "../../../components/AddToCart";
import PayPalHostedButtons from "../../../components/PayPalHostedButtons";
import { getCurrentSite } from "../../../lib/current-site";
import { getPayloadClient } from "../../../lib/get-payload";
import { buildImageResolver } from "../../../lib/wp-image-resolver";
import { buildPortfolioListResolver } from "../../../lib/wp-portfolio-resolver";
import { buildTestimonialsResolver } from "../../../lib/wp-testimonials-resolver";
import { buildHeroSliderResolver } from "../../../lib/wp-hero-slider-resolver";
import { buildBlogListResolver } from "../../../lib/wp-blog-list-resolver";
import { resolvePartners } from "../../../lib/wp-partners-resolver";
import { wpContentToStyledHtml } from "../../../scripts/wp-shortcode-render";
import { BlockRenderer } from "../../../components/blocks/BlockRenderer";

const EMPTY_RICHTEXT = {
  root: {
    type: "root",
    children: [],
    direction: null,
    format: "" as const,
    indent: 0,
    version: 1,
  },
};

type Args = {
  params: Promise<{ slug?: string[] }>;
};

const getSiteCached = cache(getCurrentSite);

async function findContent(site: any, slugSegments: string[]) {
  const payload = await getPayloadClient();
  const siteId = site.id;
  const fullPath = slugSegments.join("/");

  if (!fullPath) {
    // Homepage: the migrated Page whose wpPostId matches this site's real
    // WordPress page_on_front setting IS the real homepage content.
    if (site.homepageWpId) {
      const front = await payload.find({
        collection: "pages",
        where: {
          and: [{ site: { equals: siteId } }, { wpPostId: { equals: site.homepageWpId } }],
        },
        limit: 1,
        depth: 2,
      });
      if (front.docs[0]) return { type: "page" as const, doc: front.docs[0] };
    }

    // Fallback (e.g. main site, whose front page was deleted from WordPress
    // itself): a page literally slugged "home", else the first page.
    const home = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: siteId } }, { slug: { equals: "home" } }] },
      limit: 1,
      depth: 2,
    });
    if (home.docs[0]) return { type: "page" as const, doc: home.docs[0] };

    const anyPage = await payload.find({
      collection: "pages",
      where: { site: { equals: siteId } },
      limit: 1,
      sort: "-createdAt",
      depth: 2,
    });
    if (anyPage.docs[0]) return { type: "page" as const, doc: anyPage.docs[0] };
    return null;
  }

  const page = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: siteId } }, { slug: { equals: fullPath } }] },
    limit: 1,
    depth: 2,
  });
  if (page.docs[0]) return { type: "page" as const, doc: page.docs[0] };

  const post = await payload.find({
    collection: "posts",
    where: { and: [{ site: { equals: siteId } }, { slug: { equals: fullPath } }] },
    limit: 1,
    depth: 2,
  });
  if (post.docs[0]) return { type: "post" as const, doc: post.docs[0] };

  const product = await payload.find({
    collection: "products",
    where: { and: [{ site: { equals: siteId } }, { slug: { equals: fullPath } }] },
    limit: 1,
    depth: 2,
  });
  if (product.docs[0]) return { type: "product" as const, doc: product.docs[0] };

  return null;
}

const findContentCached = cache(findContent);

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = [] } = await params;
  const site = await getSiteCached();
  if (!site) return {};

  const result = await findContentCached(site, slug);
  if (!result) return {};

  const { type, doc } = result;
  const seo = "seo" in doc ? doc.seo : undefined;
  const rawTitle = "title" in doc ? doc.title : doc.name;
  const description =
    seo?.metaDescription ||
    ("excerpt" in doc ? doc.excerpt : undefined) ||
    ("shortDescription" in doc ? doc.shortDescription : undefined) ||
    undefined;
  const noindex = Boolean(seo?.noindex);

  // Matches RankMath's live production behavior: a custom SEO title is
  // shown as-is with no suffix; without one, the title template
  // "{title} - {site name}" applies (confirmed against production for
  // both titled and untitled pages across multiple sites).
  const title = seo?.metaTitle || `${rawTitle} - ${site.name}`;

  const canonicalPath = slug.join("/");
  const canonicalUrl = `https://${site.domain}/${canonicalPath ? `${canonicalPath}/` : ""}`;

  const rawImage =
    ("featuredImage" in doc && doc.featuredImage && typeof doc.featuredImage === "object"
      ? doc.featuredImage
      : undefined) ||
    ("images" in doc && Array.isArray(doc.images) && typeof doc.images[0] === "object"
      ? doc.images[0]
      : undefined);
  const ogImage = rawImage?.url
    ? [{ url: rawImage.url, width: rawImage.width ?? undefined, height: rawImage.height ?? undefined, alt: rawImage.alt || rawTitle }]
    : undefined;

  return {
    title,
    description,
    // Without this, Next.js infers metadataBase itself - in dev that's
    // always the bare "http://localhost:PORT" origin, not the ".slug"
    // subdomain a request actually came in on, so relative og:image URLs
    // resolved to a host with no site context (and none of our sites'
    // media). Pin it to the real production domain, same as canonicalUrl
    // below, so social-preview images resolve correctly in both dev and
    // prod regardless of which host served the request.
    metadataBase: new URL(`https://${site.domain}`),
    robots: noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: site.name,
      type: type === "post" ? "article" : "website",
      images: ogImage,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage?.map((img) => img.url),
    },
  };
}

export default async function CatchAllPage({ params }: Args) {
  const { slug = [] } = await params;
  const site = await getSiteCached();

  if (!site) {
    return (
      <>
        <Header />
        <main style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h1>Site not found</h1>
          <p>No Payload site is registered for this domain.</p>
        </main>
        <Footer />
      </>
    );
  }

  const result = await findContentCached(site, slug);

  if (!result) {
    notFound();
  }

  const { type, doc } = result;
  // WooCommerce products carry their real body content the same way pages
  // do (WPBakery shortcode markup) - see backfill-product-content.ts for why
  // this lives in a separate wpRawContent field sourced from WordPress's
  // post_excerpt rather than post_content (which is empty for every product
  // network-wide). Rendered through the identical pipeline as pages.
  const hasRawContent =
    (type === "page" || type === "product") && "wpRawContent" in doc && doc.wpRawContent;

  let styledHtml: string | null = null;
  if (hasRawContent) {
    // Each of these six builders is an independent DB round-trip with no
    // dependency on any of the others' results - awaiting them one at a
    // time made every additional distinct testimonial/portfolio/blog
    // category on a page add its own full extra round-trip latency, on top
    // of the others, instead of overlapping with them. This environment's
    // Postgres connection latency is high enough (multiple seconds per
    // query - confirmed via proxy.ts's own request-timing logs) that pages
    // with more distinct categories (e.g. ny's /courses/mixing-mastering/,
    // with 2 mkd_testimonials + 2 mkd_portfolio_slider instances) compounded
    // into 60+ second loads, long enough that the browser's own concurrent
    // image requests for the rest of the page started timing out entirely
    // (surfaced as 503s from the media-file route, not from these queries
    // themselves - confirmed no error is logged for those requests, only
    // very large proxy.ts/application-code timing numbers in the same
    // request's own log line).
    const [resolveImage, resolvePortfolioList, resolveTestimonials, resolveHeroSlider, resolveBlogList, partners] =
      await Promise.all([
        buildImageResolver(site.id, doc.wpRawContent as string),
        buildPortfolioListResolver(site.id, doc.wpRawContent as string),
        buildTestimonialsResolver(site.id, doc.wpRawContent as string),
        buildHeroSliderResolver(site.id, doc.wpRawContent as string),
        buildBlogListResolver(site.id, doc.wpRawContent as string),
        resolvePartners(doc.wpRawContent as string),
      ]);
    styledHtml = wpContentToStyledHtml(
      doc.wpRawContent as string,
      resolveImage,
      resolvePortfolioList,
      resolveTestimonials,
      resolveHeroSlider,
      resolveBlogList,
      partners
    );
  }

  if (type === "post") {
    const categories = "categories" in doc && Array.isArray(doc.categories) ? doc.categories : [];
    const categoryLabel = categories
      .map((c: any) => (typeof c === "object" ? c.name : null))
      .filter(Boolean)
      .join(", ");
    const dateLabel = doc.publishedDate
      ? new Date(doc.publishedDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    return (
      <>
        <Header menu={site.mainMenu as any} currentPath={slug.join("/")} siteDomain={site.domain} />
        {/* Confirmed against production (e.g. nsh's single-post pages): the
           blog single template has no title-area hero bar at all - content
           goes straight from </header> to .mkd-content-inner > .mkd-container.
           This block used to unconditionally render a red site-name banner
           here that production never shows. */}
        <div className="mkd-container">
          <div className="mkd-container-inner">
            <div className="mkd-two-columns-75-25 clearfix">
              <div className="mkd-column1 mkd-content-left-from-sidebar">
                <div className="mkd-column-inner">
                  <div className="mkd-blog-holder mkd-blog-single">
                    <article className="post type-post status-publish format-standard hentry">
                      <div className="mkd-post-content">
                        <div className="mkd-post-text">
                          <div className="mkd-post-text-inner clearfix">
                            <h3 className="mkd-post-title">{doc.title}</h3>
                            <div className="mkd-post-info-top">
                              <div className="mkd-post-info-top-left">
                                {dateLabel && (
                                  <div className="mkd-post-info-date">{dateLabel}</div>
                                )}
                                {doc.author && (
                                  <div className="mkd-post-info-author">
                                    <span>{doc.author}</span>
                                  </div>
                                )}
                                {categoryLabel && (
                                  <div className="mkd-post-info-category">{categoryLabel}</div>
                                )}
                              </div>
                              <div className="mkd-post-info-top-right">
                                <div className="mkd-post-info-comments-holder">
                                  <span className="icon_comment_alt"></span>No Comments
                                </div>
                                <div className="mkd-blog-like">
                                  <i className="icon_heart_alt" aria-hidden="true"></i>
                                  <span>0 Likes</span>
                                </div>
                              </div>
                            </div>
                            <RichText data={doc.content || EMPTY_RICHTEXT} />
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
              <div className="mkd-column2">
                <div className="mkd-column-inner">
                  <Sidebar site={site} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer site={site} />
      </>
    );
  }

  const customCss = "customCss" in doc && doc.customCss ? doc.customCss : null;
  // The theme wraps every ordinary page in the boxed .mkd-container (fixed
  // max-width, centered, with grid-gutter padding on its own); pages built
  // with WordPress's "Full Width" page template (_wp_page_template =
  // "full-width.php", see backfill-full-width-template.ts) instead get the
  // edge-to-edge .mkd-full-width - the homepage is just the most common
  // example of this, not a special case of its own (confirmed against
  // production: any other page built with that same template, e.g. ny's
  // /music-production-academy/ and /programs/logic-pro-x-music-program/,
  // renders identically edge-to-edge - previously hardcoding this to
  // isHomepage squeezed those other pages' rows into the ~1300px boxed
  // container instead). Getting this wrong doesn't just look different:
  // content that isn't itself wrapped in a proper vc_row/vc_column (e.g. a
  // page with orphaned top-level shortcodes, which WPBakery's builder can
  // leave behind) relies entirely on .mkd-container's own padding for its
  // left/right gap - mkd-full-width provides none at all, so that content
  // ran edge-to-edge (confirmed against production on /private-instruction/).
  const isHomepage = "wpPostId" in doc && doc.wpPostId === site.homepageWpId;
  const isFullWidthTemplate = isHomepage || ("fullWidthTemplate" in doc && doc.fullWidthTemplate === true);
  const WrapperTag = isFullWidthTemplate ? "mkd-full-width mkd-full-width-shift" : "mkd-container";
  const InnerTag = isFullWidthTemplate ? "mkd-full-width-inner" : "mkd-container-inner clearfix";
  // Buro theme's mkd_sidebar_meta (e.g. "sidebar-25-right") - a page-level
  // layout choice stored in postmeta, entirely separate from the page's own
  // shortcode content. Only "page"/"portfolio-item" docs carry it (confirmed
  // against production: course pages like hk's /programs/ableton-producer-
  // program/ render the same .mkd-two-columns-75-25 wrapper as the instructor-
  // bio special case below, but with the *sidebar* in column2 instead of a
  // portfolio image - the two never overlap in practice since a page is
  // either an instructor bio or a sidebar page, not both).
  const hasSidebar = "hasSidebar" in doc && Boolean(doc.hasSidebar);

  const hasLayout = "layout" in doc && Array.isArray((doc as any).layout) && (doc as any).layout.length > 0;

  if (hasLayout) {
    const ownImage = "titleBackgroundImage" in doc && doc.titleBackgroundImage && typeof doc.titleBackgroundImage === "object" ? doc.titleBackgroundImage : undefined;
    const siteDefaultImage = site.defaultTitleBackgroundImage && typeof site.defaultTitleBackgroundImage === "object" ? site.defaultTitleBackgroundImage : undefined;
    const titleImage = ownImage ?? siteDefaultImage;
    const hasImage = Boolean(titleImage);
    
    if (slug.length === 0) {
      console.log("SF HOMEPAGE RENDER:", {
        type,
        ownImage: !!ownImage,
        siteDefaultImage: !!siteDefaultImage,
        hasImage,
        showTitleArea: "showTitleArea" in doc ? doc.showTitleArea : undefined
      });
    }

    const explicitHeight = "titleAreaHeight" in doc && typeof doc.titleAreaHeight === "number" ? doc.titleAreaHeight : undefined;
    const isResponsive = "titleBackgroundResponsive" in doc ? doc.titleBackgroundResponsive !== false : true;
    const naturalWidth = titleImage && typeof (titleImage as any).width === "number" ? (titleImage as any).width : undefined;
    const naturalHeight = titleImage && typeof (titleImage as any).height === "number" ? (titleImage as any).height : undefined;
    const aspectRatio = naturalWidth && naturalHeight ? naturalWidth / naturalHeight : undefined;
    const fallbackHeight = explicitHeight || (isResponsive ? 400 : 810);
    const height = hasImage ? fallbackHeight : 200;

    return (
      <>
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <Header menu={site.mainMenu as any} currentPath={slug.join("/")} siteDomain={site.domain} />
        <main className="w-full flex flex-col min-h-screen">
            <pre style={{color: 'red', zIndex: 9999, position: 'relative', background: 'white'}}>
              DEBUG INFO: {JSON.stringify({ type, ownImage: !!ownImage, siteDefaultImage: !!siteDefaultImage, hasImage, showTitleArea: "showTitleArea" in doc ? doc.showTitleArea : undefined, slugLen: slug.length })}
            </pre>
          {hasImage && type === "page" && ("showTitleArea" in doc ? doc.showTitleArea !== false : true) && (
            <div 
              className="relative w-full overflow-hidden" 
              style={aspectRatio && isResponsive ? { aspectRatio: `${aspectRatio}` } : { height }}
            >
              <img
                src={(titleImage as any).sizes?.large?.url || (titleImage as any).url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <div className="absolute inset-0 bg-black/40 z-10" />
              <div className="relative z-20 h-full max-w-5xl mx-auto px-4 flex flex-col justify-center items-center text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-md leading-normal md:leading-snug">
                  <span className="text-white px-4 py-2" style={{ backgroundColor: '#cc0000', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>
                    {doc.title}
                  </span>
                </h1>
              </div>
            </div>
          )}
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <BlockRenderer blocks={(doc as any).layout} />
          </div>
        </main>
        <Footer site={site} />
      </>
    );
  }

  return (
    <>
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <Header menu={site.mainMenu as any} currentPath={slug.join("/")} siteDomain={site.domain} />
      {/* The title bar sits BEFORE .mkd-container/.mkd-full-width in the
         DOM, not nested inside it - it's always full-bleed regardless of
         whether the page content below is boxed (confirmed against
         production: /private-instruction/'s title area starts well before
         the page's first .mkd-container div). Moving it inside the
         container earlier constrained the hero image with the same
         left/right margins as the boxed content, which production doesn't
         have. */}
      {/* NOTE: We previously did not show title areas for homepages, but some sites (e.g. SF, Miami) DO use them on the homepage. */}
      {type === "page" &&
              "showTitleArea" in doc &&
              doc.showTitleArea !== false &&
              (() => {
                // A page's own title image (mkd_title_area_background_image_meta,
                // per-page postmeta) takes priority; without one, the theme
                // falls back to a site-wide default (Buro theme option
                // title_area_background_image, stored in wp_options - NOT
                // page postmeta, which is why this needs its own field on
                // Sites rather than living on the page doc) - confirmed
                // against production, where pages with no page-specific
                // image (e.g. bcn's /uk-a-level-3-course/) still show this
                // default studio photo, not a bare title bar.
                const ownImage =
                  "titleBackgroundImage" in doc &&
                  doc.titleBackgroundImage &&
                  typeof doc.titleBackgroundImage === "object"
                    ? doc.titleBackgroundImage
                    : undefined;
                const siteDefaultImage =
                  site.defaultTitleBackgroundImage && typeof site.defaultTitleBackgroundImage === "object"
                    ? site.defaultTitleBackgroundImage
                    : undefined;
                const titleImage = ownImage ?? siteDefaultImage;
                const hasImage = Boolean(titleImage);
                // With a background image, production adds the
                // background/parallax classes and uses a taller (400px)
                // banner; without one, mkd-title-image renders as an empty
                // div and the banner is a shorter (200px) bare title bar -
                // confirmed against production for both cases (e.g.
                // courses/ableton-live has an image, academy pages like
                // www's /academy/ don't).
                //
                // mkd_title_area_background_image_responsive_meta=no pages
                // (see backfill-title-area-responsive.ts) use a different
                // markup in production: a plain inline background-image
                // directly on .mkd-title itself, no nested <img>. But the
                // DEFAULT (responsive=true, the far more common case) markup
                // is *also* broken here: it depends on theme JS to measure
                // the loaded <img>'s natural size and set an explicit pixel
                // height, because buro-modules-responsive.css has
                // .mkd-title.mkd-has-responsive-background{height:auto
                // !important} - an !important rule that silently wins over
                // any inline height we set ourselves. We don't run that JS,
                // so every responsive-mode title area collapsed to 0px
                // (confirmed against production, ny's /courses/ableton/,
                // a portfolio-item whose hero photo simply never appeared).
                // Sidestep the whole fragile CSS/JS chain the same way
                // already works for the non-responsive case: put the
                // background-image inline ourselves and compute a real
                // height server-side, using the image's own aspect ratio via
                // CSS aspect-ratio (genuinely responsive across viewport
                // widths, unlike a fixed pixel height) when Payload's
                // upload doc has captured natural width/height, falling
                // back to the fixed default otherwise.
                const isResponsive = "titleBackgroundResponsive" in doc ? doc.titleBackgroundResponsive !== false : true;
                const explicitHeight = "titleAreaHeight" in doc && typeof doc.titleAreaHeight === "number" ? doc.titleAreaHeight : undefined;
                const className = hasImage
                  ? isResponsive
                    ? "mkd-title mkd-standard-type mkd-preload-background mkd-has-background mkd-has-responsive-background mkd-content-center-alignment mkd-title-small-text-size mkd-animation-no mkd-title-image-responsive mkd-title-in-grid"
                    : "mkd-title mkd-standard-type mkd-preload-background mkd-has-background mkd-content-center-alignment mkd-title-small-text-size mkd-animation-no mkd-title-image-not-responsive mkd-title-in-grid"
                  : "mkd-title mkd-standard-type mkd-content-center-alignment mkd-title-small-text-size mkd-animation-no mkd-title-in-grid";
                const naturalWidth = titleImage && typeof (titleImage as any).width === "number" ? (titleImage as any).width : undefined;
                const naturalHeight = titleImage && typeof (titleImage as any).height === "number" ? (titleImage as any).height : undefined;
                const aspectRatio = naturalWidth && naturalHeight ? naturalWidth / naturalHeight : undefined;
                const fallbackHeight = explicitHeight ?? (isResponsive ? 400 : 810);
                const height = hasImage ? fallbackHeight : 200;
                const nonResponsiveStyle = hasImage
                  ? aspectRatio
                    ? { aspectRatio: `${aspectRatio}` }
                    : { height }
                  : { height };
                return (
                  <div
                    className={className}
                    style={nonResponsiveStyle}
                    data-height={height}
                    // buro-modules.min.js's mkdPreloadBackgrounds() runs on
                    // document.ready, preloads this element's background-image
                    // via a plain JS Image() object, and removes
                    // .mkd-preload-background the instant that image's load
                    // event fires - often near-instantly from browser cache,
                    // racing React's own hydration of this element. Same
                    // external-script-mutates-the-DOM situation as
                    // #mkd-back-to-top in layout.tsx: the mismatch is the
                    // script doing exactly what it's supposed to, not a real
                    // bug (confirmed via buro-modules.min.js's own source).
                    suppressHydrationWarning
                  >
                    {hasImage && (
                      // Real WordPress renders this photo as a literal <img>
                      // nested inside .mkd-title, not a CSS background-image
                      // (confirmed against production's live DOM: an <img>
                      // occupying this exact position/size, no background-
                      // image anywhere) - this app used background-image
                      // instead specifically to avoid depending on client JS
                      // to size things. That divergence is invisible until a
                      // page's own migrated custom_css contains a rule like
                      // ".mkd-title{background-image:none!important}" (real
                      // WP pages sometimes carry this, harmlessly, since real
                      // WP never populated that property to begin with) -
                      // confirmed on nsh's /courses/mixing-mastering/, whose
                      // custom_css does exactly this, silently erasing the
                      // photo here while doing nothing on production. Using
                      // a real <img> (kept out of layout flow so it doesn't
                      // disturb the server-computed aspect-ratio/height
                      // sizing above) is immune to that entire class of
                      // legacy custom CSS the same way production always was.
                      <img
                        src={((titleImage as any)?.sizes?.large?.url || titleImage?.url) ?? undefined}
                        alt=""
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          zIndex: -1,
                        }}
                      />
                    )}
                    <div className="mkd-title-holder" style={{ height: "100%" }}>
                      <div className="mkd-container clearfix">
                        <div className="mkd-container-inner">
                          <div className="mkd-title-subtitle-holder">
                            <div className="mkd-title-subtitle-holder-inner">
                              <h1>
                                <span>{doc.title}</span>
                              </h1>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* WooCommerce single-product pages on production always show
               this exact generic title text in the hero, regardless of the
               product's real name (confirmed identical across many
               products/sites) - not per-product data, so hardcoded here. */}
            {type === "product" &&
              "images" in doc &&
              Array.isArray(doc.images) &&
              typeof doc.images[0] === "object" &&
              doc.images[0]?.url && (
                <div
                  className="mkd-title mkd-standard-type mkd-preload-background mkd-has-background mkd-has-responsive-background mkd-content-center-alignment mkd-title-small-text-size mkd-animation-no mkd-title-image-responsive mkd-title-in-grid"
                  style={{ height: 400 }}
                  data-height="400"
                >
                  <div className="mkd-title-image">
                    <img src={doc.images[0].url} alt="" />
                  </div>
                  <div className="mkd-title-holder">
                    <div className="mkd-container clearfix">
                      <div className="mkd-container-inner">
                        <div className="mkd-title-subtitle-holder">
                          <div className="mkd-title-subtitle-holder-inner">
                            <h1>
                              <span>Book Your Course Below</span>
                            </h1>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
      <div className={`${WrapperTag} ${slug[0] === 'courses' ? 'mkd-course-page' : ''}`}>
        <div className={InnerTag}>
          {(() => {
            const content = (
              <div className="wpb-content-wrapper">
            {styledHtml ? (
              "portfolioCategories" in doc &&
              Array.isArray(doc.portfolioCategories) &&
              doc.portfolioCategories.length > 0 &&
              // Portfolio-items whose own content already builds a complete
              // image+bio layout via mkd_elements_holder (WPBakery's side-
              // by-side module) manage their own full page, full stop - no
              // template wrapper at all on production (confirmed: la's
              // /courses/kindred-producer-dj/ and /courses/igor-krasnienko/,
              // both "instructors"-category with a real featuredImage, have
              // no .mkd-portfolio-media in their DOM whatsoever; the visible
              // photo there is one they embedded themselves inline). Only
              // pages WITHOUT that shortcode - simpler, "bare" bios/course
              // pages that never define their own image+text split - get
              // the synthetic wrapper below. Getting this backwards doesn't
              // just add an unwanted wrapper: it also duplicates the
              // person's own inline photo a second time via featuredImage,
              // stretched to the wrapper's 75%-wide column1 instead of its
              // own intended size.
              //
              // mkd_elements_holder presence is only correlated with the
              // real switch, not equal to it - the real one is WordPress's
              // own mkd_portfolio_single_template_meta postmeta ('custom' vs
              // absent/'default'), backfilled onto portfolioCustomTemplate
              // (see backfill-portfolio-custom-template.ts). Confirmed wrong
              // on nsh's /courses/ableton-live/: meta is 'custom' (renders
              // full-width, own-layout on production) but its content has no
              // mkd_elements_holder either, same as /courses/vocal-
              // production/ and /courses/mixing-mastering/ (meta absent,
              // correctly narrow on production) - the old check alone
              // couldn't tell these apart and put all three in one bucket.
              !(
                ("wpRawContent" in doc &&
                  typeof doc.wpRawContent === "string" &&
                  doc.wpRawContent.includes("mkd_elements_holder")) ||
                ("portfolioCustomTemplate" in doc && doc.portfolioCustomTemplate === true)
              ) ? (
                // Portfolio-item (course/instructor) singular template: the
                // theme renders the featured image, post content, and a
                // "Share" widget as three template-level pieces, entirely
                // outside post_content - wpContentToStyledHtml only ever
                // sees the raw shortcode content, so it can't produce this
                // wrapper itself (confirmed against production's DOM for
                // courses/dave-garnish AND courses/vocal-production, e.g.
                // .mkd-two-columns-75-25 > .mkd-column1 .mkd-portfolio-media
                // for the image, .mkd-column2 .mkd-portfolio-content for the
                // content, .mkd-column2 .mkd-portfolio-social for Share).
                // This wrapper applies to every qualifying portfolio-item,
                // not just instructor bios (confirmed against production:
                // /courses/vocal-production/ - a "Short Courses" item - uses
                // the exact same .mkd-portfolio-single-holder structure,
                // just with an empty, imageless .mkd-column1). Only the
                // actual <img> inside column1 stays gated on the
                // "instructors" category - confirmed course pages have a
                // real featuredImage set too but still render an empty
                // column1; showing it unconditionally duplicated the hero
                // photo as a second, redundant image on course pages. The
                // h3.mkd-portfolio-title the theme also renders here is
                // display:none on production (network-wide "modules" CSS
                // this app doesn't replicate), so it's omitted rather than
                // shown unstyled.
                // Matches production's full ancestor chain (confirmed
                // against courses/dave-garnish): without .mkd-container's
                // max-width, the two columns stretch full-bleed edge to edge
                // instead of sitting in the theme's normal centered content
                // width, at the wrong 75/25 pixel ratio despite already
                // being the correct proportion.
                (() => {
                  const isInstructor = doc.portfolioCategories.some(
                    (cat: any) => typeof cat === "object" && cat?.slug === "instructors"
                  );
                  const hasImage =
                    isInstructor &&
                    "featuredImage" in doc &&
                    doc.featuredImage &&
                    typeof doc.featuredImage === "object";
                  const canonicalUrl = `https://${site.domain}/${slug.join("/")}/`;
                  return (
                    <div className="small-images mkd-portfolio-single-holder">
                      <div className="mkd-container clearfix">
                        <div className="mkd-container-inner clearfix">
                          <div className="mkd-two-columns-75-25 clearfix">
                            <div className="mkd-column1">
                              <div className="mkd-column-inner">
                                {hasImage && (
                                  <div className="mkd-portfolio-media">
                                    <div className="mkd-portfolio-single-media">
                                      <img
                                        src={(doc.featuredImage as any).url ?? undefined}
                                        alt={(doc.featuredImage as any).alt || ""}
                                        width={(doc.featuredImage as any).width ?? undefined}
                                        height={(doc.featuredImage as any).height ?? undefined}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mkd-column2">
                              <div className="mkd-column-inner">
                                <div className="mkd-portfolio-info-holder">
                                  <div className="mkd-portfolio-info-item mkd-content-item">
                                    <div
                                      className="mkd-portfolio-content"
                                      suppressHydrationWarning
                                      dangerouslySetInnerHTML={{ __html: styledHtml }}
                                    />
                                  </div>
                                  <PortfolioShare
                                    title={doc.title}
                                    url={canonicalUrl}
                                    imageUrl={hasImage ? ((doc.featuredImage as any).url ?? undefined) : undefined}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  {type === "product" && site.slug !== "mia" && slug.join("/") !== "product/electronic-dj-class" && (
                    <div className="mkd-container" style={{ paddingTop: "40px" }}>
                      <div className="mkd-container-inner" style={{ padding: "0 20px" }}>
                        {(("price" in doc && doc.price != null) || ("variations" in doc && Array.isArray((doc as any).variations) && (doc as any).variations.length > 0)) && (
                          <AddToCart product={doc} variations={(doc as any).variations || []} />
                        )}
                      </div>
                    </div>
                  )}
                  <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styledHtml }} />
                </>
              )
            ) : (
              <article style={{ padding: "3rem 2rem", maxWidth: 900, margin: "0 auto" }}>
                <h1>{"title" in doc ? doc.title : doc.name}</h1>
                {"featuredImage" in doc &&
                  doc.featuredImage &&
                  typeof doc.featuredImage === "object" && (
                    <img
                      src={doc.featuredImage.url ?? undefined}
                      alt={doc.featuredImage.alt || ""}
                      width={doc.featuredImage.width ?? undefined}
                      height={doc.featuredImage.height ?? undefined}
                      style={{ maxWidth: "100%", height: "auto", marginBottom: "1.5rem" }}
                    />
                  )}
                {type === "product" && "images" in doc && Array.isArray(doc.images) && (
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    {doc.images.map((img: any, i: number) =>
                      typeof img === "object" && img?.url ? (
                        <img
                          key={i}
                          src={img.url}
                          alt={img.alt || ""}
                          style={{ maxWidth: 200, height: "auto" }}
                        />
                      ) : null
                    )}
                  </div>
                )}
                {type === "product" && site.slug !== "mia" && slug.join("/") !== "product/electronic-dj-class" && (
                  ("price" in doc && doc.price != null) ||
                  ("variations" in doc && Array.isArray((doc as any).variations) && (doc as any).variations.length > 0)
                ) && (
                  <AddToCart product={doc} variations={(doc as any).variations || []} />
                )}
                <RichText
                  data={
                    ("content" in doc
                      ? doc.content
                      : "description" in doc
                        ? doc.description
                        : undefined) || EMPTY_RICHTEXT
                  }
                />
                {type === "product" &&
                  "attributes" in doc &&
                  Array.isArray(doc.attributes) &&
                  doc.attributes.length > 0 && (
                    <div className="mkd-tab-container panel entry-content wc-tab" style={{ marginTop: "2rem" }}>
                      <h2>Additional information</h2>
                      <table className="woocommerce-product-attributes shop_attributes" aria-label="Product Details">
                        <tbody>
                          {doc.attributes.map((attr: any, i: number) => (
                            <tr key={i} className="woocommerce-product-attributes-item">
                              <th className="woocommerce-product-attributes-item__label" scope="row">
                                {attr.name}
                              </th>
                              <td className="woocommerce-product-attributes-item__value">
                                <p>{attr.options}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </article>
            )}
              </div>
            );
            return hasSidebar ? (
              <div className="mkd-two-columns-75-25 clearfix">
                <div className="mkd-column1 mkd-content-left-from-sidebar">
                  <div className="mkd-column-inner">{content}</div>
                </div>
                <div className="mkd-column2">
                  <div className="mkd-column-inner">
                    <Sidebar site={site} />
                  </div>
                </div>
              </div>
            ) : (
              content
            );
          })()}
        </div>
      </div>
      {slug.join("/") === "product/electronic-dj-class" && <PayPalHostedButtons />}
      <Footer site={site} />
    </>
  );
}
