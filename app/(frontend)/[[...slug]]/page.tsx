import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { getCurrentSite } from "../../../lib/current-site";
import { getPayloadClient } from "../../../lib/get-payload";
import { buildImageResolver } from "../../../lib/wp-image-resolver";
import { buildPortfolioListResolver } from "../../../lib/wp-portfolio-resolver";
import { buildTestimonialsResolver } from "../../../lib/wp-testimonials-resolver";
import { buildHeroSliderResolver } from "../../../lib/wp-hero-slider-resolver";
import { wpContentToStyledHtml } from "../../../scripts/wp-shortcode-render";

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

  const { doc } = result;
  const seo = "seo" in doc ? doc.seo : undefined;
  const title = seo?.metaTitle || ("title" in doc ? doc.title : doc.name);
  const description =
    seo?.metaDescription ||
    ("excerpt" in doc ? doc.excerpt : undefined) ||
    ("shortDescription" in doc ? doc.shortDescription : undefined) ||
    undefined;
  const noindex = Boolean(seo?.noindex);

  return {
    title,
    description,
    robots: noindex ? { index: false, follow: false } : undefined,
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
  const hasRawContent = type === "page" && "wpRawContent" in doc && doc.wpRawContent;

  let styledHtml: string | null = null;
  if (hasRawContent) {
    const resolveImage = await buildImageResolver(site.id, doc.wpRawContent as string);
    const resolvePortfolioList = await buildPortfolioListResolver(site.id, doc.wpRawContent as string);
    const resolveTestimonials = await buildTestimonialsResolver(site.id, doc.wpRawContent as string);
    const resolveHeroSlider = await buildHeroSliderResolver(site.id, doc.wpRawContent as string);
    styledHtml = wpContentToStyledHtml(
      doc.wpRawContent as string,
      resolveImage,
      resolvePortfolioList,
      resolveTestimonials,
      resolveHeroSlider
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
        <Header menu={site.mainMenu as any} />
        <div
          className="mkd-title mkd-standard-type mkd-content-left-alignment mkd-title-small-text-size mkd-animation-no mkd-title-in-grid"
          style={{ height: 200 }}
        >
          <div className="mkd-title-image"></div>
          <div className="mkd-title-holder" style={{ height: 200 }}>
            <div className="mkd-container clearfix">
              <div className="mkd-container-inner">
                <div className="mkd-title-subtitle-holder">
                  <div className="mkd-title-subtitle-holder-inner">
                    <h1>
                      <span>{site.name}</span>
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header menu={site.mainMenu as any} />
      <div className="mkd-full-width mkd-full-width-shift">
        <div className="mkd-full-width-inner">
          <div className="wpb-content-wrapper">
            {"titleBackgroundImage" in doc &&
              doc.titleBackgroundImage &&
              typeof doc.titleBackgroundImage === "object" && (
                <img
                  src={doc.titleBackgroundImage.url ?? undefined}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                  }}
                />
              )}

            {styledHtml ? (
              <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styledHtml }} />
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
                {type === "product" && "price" in doc && doc.price != null && (
                  <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>£{doc.price}</p>
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
              </article>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
