export const dynamic = "force-dynamic";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText, type JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Sidebar from "../../../components/Sidebar";
import PortfolioShare from "../../../components/PortfolioShare";
import AddToCart from "../../../components/AddToCart";
import PayPalHostedButtons, { type PayPalButton } from "../../../components/PayPalHostedButtons";
import CourseScheduleDisclosure from "../../../components/CourseScheduleDisclosure";
import { Accordion } from "../../../components/ui/Accordion";
import NextCohortBanner from "../../../components/NextCohortBanner";
import { getCurrentSite } from "../../../lib/current-site";
import { getPayloadClient } from "../../../lib/get-payload";
import { getAllSitesCached } from "../../../lib/sites-cache";
import { getRelatedPosts } from "../../../lib/modern-related-posts";
import { buildImageResolver } from "../../../lib/wp-image-resolver";
import { buildPortfolioListResolver } from "../../../lib/wp-portfolio-resolver";
import { buildTestimonialsResolver } from "../../../lib/wp-testimonials-resolver";
import { buildHeroSliderResolver } from "../../../lib/wp-hero-slider-resolver";
import { buildBlogListResolver } from "../../../lib/wp-blog-list-resolver";
import { resolvePartners } from "../../../lib/wp-partners-resolver";
import { wpContentToStyledHtml } from "../../../scripts/wp-shortcode-render";
import { isCoursePagePath } from "../../../lib/course-pages";
import { BlockRenderer } from "../../../components/blocks/BlockRenderer";
import { createTtlCache } from "../../../lib/ttl-cache";
import ModernHomePage from "../../../components/modern/ModernHomePage";
import ModernContactPage from "../../../components/modern/ModernContactPage";
import { extractContactDetails } from "../../../lib/modern-contact-content";
import ModernCoursePage from "../../../components/modern/ModernCoursePage";
import {
  collectNavCourseSlugs,
  extractCourseSections,
  stripParisHiltonQuote,
  extractCurriculumModules,
  extractCourseIntro,
  extractCoursePricing,
  extractFaqs,
  extractAccordionModules,
  hasModulesAccordion,
  extractVideoEmbeds,
  extractSingleImageIds,
  resolveSingleImages,
  extractPortfolioSliderSpec,
  extractProgramHighlights,
  programHighlightsHtml,
  extractTestimonialCategorySlugs,
  extractAccordionBlogTab,
  extractParagraphs,
  extractIconBulletCardGroups,
  extractNumberedModuleCourse,
  extractHeadingBulletModule,
  extractIconWithTextModules,
  extractScheduleBlocks,
  type ScheduleBlock,
} from "../../../lib/modern-course-content";
import type { TestimonialItem } from "../../../scripts/wp-shortcode-render";
import ModernPrivateInstructionPage from "../../../components/modern/ModernPrivateInstructionPage";
import { getCityAbbr } from "../../../lib/modern-site-meta";
import { extractPrivateInstructionContent } from "../../../lib/modern-private-instruction-content";
import ModernInstructorsPage from "../../../components/modern/ModernInstructorsPage";
import ModernInstructorBioPage from "../../../components/modern/ModernInstructorBioPage";
import { extractInstructorBio, extractInstructorDirectory } from "../../../lib/modern-instructors-content";
import { MODERN_SITE_ROUTES } from "../../../lib/modern-site-routes";
import type { InstructorGridItem } from "../../../components/modern/ModernInstructorGrid";
import LegacyThemeAssets from "../../../components/LegacyThemeAssets";

// Blog post bodies get the "video" block (blocks/Video.ts, added to
// Posts.ts's Lexical editor via BlocksFeature) so a post can embed a
// playable YouTube video inline between paragraphs, not just at the top as
// a featuredImage. Mirrors the styling BlockRenderer's VideoBlock uses for
// the same block type on pages' `layout` field.
const postRichTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    video: ({ node }: { node: any }) => (
      <div style={{ margin: "2rem 0", borderRadius: 14, overflow: "hidden", aspectRatio: "16 / 9" }}>
        <iframe
          src={(node.fields as any).link}
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          // The legacy theme still loads fluidvids.js on every page (see
          // layout.tsx's themeScripts), which scans for any
          // youtube.com/vimeo iframe on DOMContentLoaded and rewraps it in
          // a `.fluidvids` div via direct DOM mutation - racing React's own
          // hydration of this exact node and throwing a hydration-mismatch
          // error. data-fluidvids is the attribute fluidvids.js itself
          // checks to skip already-processed iframes; this embed is already
          // responsive via the aspect-ratio wrapper above, so marking it
          // pre-handled opts it out instead of fighting the script.
          data-fluidvids="loaded"
        />
      </div>
    ),
  },
});

// Same 30s-window tradeoff already accepted for site config in
// sites-cache.ts: content edits can take up to this long to show up on a
// warm server instance, in exchange for collapsing repeat requests (the
// overwhelming majority of traffic to any given page) to zero DB round
// trips instead of 1-7 per request (findContent's collection lookups, plus
// the 6 parallel resolvers below).
const contentCache = createTtlCache<Awaited<ReturnType<typeof findContentUncached>>>(30_000);
const resolverCache = createTtlCache<unknown>(30_000);
const courseScheduleCache = createTtlCache<string | null>(30_000);
// Separate from courseScheduleCache above - ScheduleBlock's own
// isNextCohort flag depends on "today" at the moment it's computed, so this
// needs the same short TTL (a stale "next" cohort self-corrects within 30s
// of the real one changing, never noticeable) but a different value shape,
// hence its own cache rather than reusing that one.
const scheduleBlocksCache = createTtlCache<ScheduleBlock[] | null>(30_000);

// Course pages whose "View Course Schedule & Details" disclosure portals in
// content scraped from a separate product doc - see the comment at its call
// site below for why this is a whole extra doc fetch rather than just
// linking to the product page.
const COURSE_SCHEDULE_PAGES: Record<string, { productSlug: string; slotId: string; paypalButtons?: PayPalButton[] }> = {
  "courses/electronic-dj-course": {
    productSlug: "product/electronic-music-dj-course",
    slotId: "dj-course-schedule-slot",
    paypalButtons: [
      { id: "HN8269LYEWPSG", title: "DJ Class Early Bird Registration" },
      { id: "3HMQH4RMLRBZJ", title: "DJ Class Regular Registration" },
    ],
  },
  "courses/ableton-live-course": {
    productSlug: "product/ableton-production",
    slotId: "ableton-course-schedule-slot",
    paypalButtons: [
      { id: "3NDEQJ9UEMKRG", title: "Ableton Express Early Bird Registration" },
      { id: "Q7QDJWEQ3CHFS", title: "Ableton Express Registration" },
    ],
  },
  "courses/logic-course": {
    productSlug: "product/logic-course",
    slotId: "logic-course-schedule-slot",
    paypalButtons: [
      { id: "8D4NQG5Y6NRXA", title: "Logic Pro Early Bird Registration" },
      { id: "2SPZLGQV8EKC6", title: "Logic Pro Registration" },
    ],
  },
  "courses/summer-camp-school": {
    productSlug: "product/summer-camp",
    slotId: "summer-camp-schedule-slot",
    // No PayPal hosted buttons for this course yet.
  },
  "programs/ableton-producer-program": {
    productSlug: "product/ableton-producer-program",
    slotId: "ableton-producer-program-schedule-slot",
    // No PayPal hosted buttons for this program yet.
  },
  "programs/logic-producer-program": {
    productSlug: "product/logic-producer-program",
    slotId: "logic-producer-program-schedule-slot",
    // No PayPal hosted buttons for this program yet.
  },
  "courses/curso-de-dj-espanol": {
    productSlug: "product/curso-de-dj-pro-en-espanol",
    slotId: "curso-de-dj-espanol-schedule-slot",
    // No PayPal hosted buttons for this course yet.
  },
};
// The same products' own pages (visited directly) wrap their raw content in
// an equivalent inline disclosure - see the ternary at its call site below.
const COURSE_SCHEDULE_BY_PRODUCT_SLUG = new Map(Object.values(COURSE_SCHEDULE_PAGES).map((c) => [c.productSlug, c]));

// ny's product/electronic-dj-class used to reuse
// COURSE_SCHEDULE_PAGES["courses/electronic-dj-course"]'s buttons (shared
// with MIA) - split out once that pair's PayPal-side price broke (see the
// bottomPaypalButtons comment below) so fixing NY doesn't touch MIA's.
const NY_DJ_CLASS_PAYPAL_BUTTONS: PayPalButton[] = [
  { id: "DVBYCLCZLAZ34", title: "DJ Class Early Bird Registration" },
  { id: "6E64BWEW8RLQN", title: "DJ Class Regular Registration" },
];

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
  return contentCache(`${site.id}:${slugSegments.join("/")}`, () =>
    findContentUncached(site, slugSegments)
  );
}

async function findContentUncached(site: any, slugSegments: string[]) {
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

// Shared by the Instructors listing route and the individual instructor
// bio-page route below - both need la/staging's real instructors-directory
// content (see extractInstructorDirectory's own comment for why: it's a
// real, hand-maintained roster, not the empty shell pdx/hou's instructors
// pages are). Cached per-request via React's cache() so visiting a single
// instructor's own page doesn't pay for this fetch+parse twice.
//
// mia's own instructors page has no hand-authored directory markup at all -
// just a bare [mkd_portfolio_list category="instructors"] widget (real
// pages tagged via portfolioCategories, resolved through the same
// buildPortfolioListResolver the legacy pipeline already uses for this
// shortcode - see lib/wp-portfolio-resolver.ts). extractInstructorDirectory
// finds nothing there (no card markup to match), so that empty result falls
// through to this second resolve attempt instead of leaving the page with
// no roster at all. PortfolioItem carries no role/credits text (unlike la's
// hand-parsed cards), so those two fields are just left empty -
// ModernInstructorsPage already renders them conditionally.
//
// That second attempt still comes up empty on mia specifically - no
// "instructors" category exists anywhere in mia's data at all (confirmed:
// only Dave Garnish's own bio page has any portfolioCategories tag at all,
// "founder"), so the shortcode's own category query was already dormant on
// mia's real live site, not something this rebuild broke. Falls through to
// a third attempt: build directory cards directly from
// modernRoutes.instructorSlugs's own pages (real, confirmed courses/{slug}
// bio pages - see that list's own comment in modern-site-routes.ts),
// reading each one's title/featuredImage the same way PortfolioItem does,
// just skipping the broken category lookup entirely.
const getInstructorDirectoryCached = cache(async function getInstructorDirectory(
  site: any,
  instructorsSlug: string,
  instructorSlugs: string[]
) {
  const payload = await getPayloadClient();
  const instructorsPageRes = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: site.id } }, { slug: { equals: instructorsSlug } }] },
    limit: 1,
  });
  const instructorsPageDoc = instructorsPageRes.docs[0] as any;
  const raw = instructorsPageDoc?.wpRawContent || "";
  const directory = extractInstructorDirectory(raw);
  if (directory.length > 0) return directory;

  const resolver = await buildPortfolioListResolver(site.id, raw);
  const categoryMatch = raw.match(/\[mkd_portfolio_(?:list|slider)\b[^\]]*\bcategory="([^"]*)"/i);
  const fromPortfolio = categoryMatch
    ? resolver(categoryMatch[1].split(",")[0].trim()).map((item) => ({
        name: item.title,
        title: "",
        photoUrl: item.imageUrl,
        href: item.href.replace(/\/$/, "") || "/",
        info: [] as string[],
      }))
    : [];
  if (fromPortfolio.length > 0) return fromPortfolio;

  if (instructorSlugs.length === 0) return fromPortfolio;
  const bioPagesRes = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: site.id } }, { slug: { in: instructorSlugs } }] },
    depth: 1,
    limit: instructorSlugs.length,
  });
  return instructorSlugs
    .map((slug) => bioPagesRes.docs.find((d: any) => d.slug === slug) as any)
    .filter(Boolean)
    .map((doc: any) => ({
      name: doc.title,
      title: "",
      photoUrl: typeof doc.featuredImage === "object" ? doc.featuredImage?.url : undefined,
      href: `/${doc.slug}`,
      info: [] as string[],
    }));
});

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

  // pdx was the pilot for the fresh, non-legacy design system (webpro50-
  // style tokens, no jQuery/WPBakery-era markup) - see components/modern/
  // and lib/modern-site-routes.ts (MODERN_SITE_ROUTES) for the sites it now
  // covers and each one's real route slugs. Scoped to this handful of
  // rebuilt routes so the remaining live sites' rendering path is
  // completely untouched.
  const modernRoutes = MODERN_SITE_ROUTES[site.slug];
  if (modernRoutes && slug.length === 0) {
    return <ModernHomePage site={site} />;
  }
  if (modernRoutes && slug.join("/") === modernRoutes.contactSlug) {
    const payload = await getPayloadClient();
    const contactPages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { slug: { equals: modernRoutes.contactSlug } }] },
      limit: 1,
    });
    const contactDoc = contactPages.docs[0] as any;
    const contact = extractContactDetails(contactDoc?.wpRawContent || "");
    return <ModernContactPage site={site} contact={contact} />;
  }
  // Also covers each site's "Comprehensive/Production Programs" pages (see
  // modernRoutes.programSlugs in modern-site-routes.ts) - confirmed via
  // inspection to use the identical [mkd_section_title]+[vc_column_text]
  // shortcode shape as the course pages this template was built for, so no
  // separate component/extractor needed. private-instruction was checked
  // too and does NOT fit either shape this extractor handles (nested
  // accordion + pricing list) - deliberately left off this list rather than
  // risk a garbled render; still on the legacy path.
  const modernTemplatedSlugs = new Set([
    ...collectNavCourseSlugs(site.mainMenu),
    ...(modernRoutes?.programSlugs ?? []),
  ]);
  if (modernRoutes && modernTemplatedSlugs.has(slug.join("/"))) {
    const payload = await getPayloadClient();
    const coursePages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { slug: { equals: slug.join("/") } }] },
      limit: 1,
      depth: 1,
    });
    const courseDoc = coursePages.docs[0] as any;
    if (courseDoc) {
      let raw = courseDoc.wpRawContent || "";
      // [vc_single_image] shortcodes reference a media doc by id only - no
      // URL lives in the shortcode itself, so those ids are resolved to
      // real media docs and spliced back into the raw string as <img> tags
      // before any of the text extractors below run (they can only see
      // literal <img> tags, not shortcodes needing a DB round trip). The id
      // in [vc_single_image image="..."] is the *original WordPress*
      // attachment id (wpAttachmentId), not this media doc's own Payload
      // id - migration renumbered every doc, so looking up by `id` finds
      // nothing (confirmed: id 18427 doesn't exist at all, but a doc with
      // wpAttachmentId 18427 does).
      const singleImageIds = extractSingleImageIds(raw);
      if (singleImageIds.length > 0) {
        const mediaRes = await payload.find({
          collection: "media",
          where: { wpAttachmentId: { in: singleImageIds.map(Number) } },
          // Padded well past the number of unique ids requested - some
          // wpAttachmentIds have more than one media doc migrated under them
          // (confirmed: id 17604 has 2), and a limit sized exactly to the
          // unique-id count can silently truncate the result set before
          // reaching every id.
          limit: singleImageIds.length + 20,
          depth: 0,
        });
        const urlsById = new Map(mediaRes.docs.map((d: any) => [String(d.wpAttachmentId), d.url as string]));
        raw = resolveSingleImages(raw, urlsById);
      }
      const heroImage =
        (typeof courseDoc.titleBackgroundImage === "object" && courseDoc.titleBackgroundImage?.url) ||
        (typeof courseDoc.featuredImage === "object" && courseDoc.featuredImage?.url) ||
        undefined;
      // Two mutually exclusive content shapes exist across these pages (see
      // modern-course-content.ts) - sections is the newer [mkd_section_title]
      // shape, curriculum/intro is the older bare-<h2>/<ul> shape. Only fall
      // back to the older extractors when the newer one found nothing, so a
      // page using one shape doesn't also get garbled output from the
      // extractor built for the other.
      // Every course/program page's "Our Students Say" section carries the
      // exact same hardcoded Paris Hilton / "Garnish DJ Program" quote,
      // including pages with nothing to do with the DJ program - confirmed
      // via a full sweep of all 20 staging course/program pages. Left in
      // place only on the two DJ-related pages it's actually relevant to.
      const isDjCoursePage = slug.join("/") === "courses/dj-course" || slug.join("/") === "dj-production-program";
      // extractCourseSections' own default limit (6) is too tight here: once
      // resolveSingleImages (above) turns a [vc_single_image] comparison-
      // table shortcode into a real <img>, a "Why choose X at Garnish?"
      // section becomes extractable that wasn't visible as a distinct row
      // before substitution, pushing every later section down by one - on
      // several pages (both DJ pages included) this silently dropped the
      // trailing "Our Students Say" section (with its Paris Hilton quote)
      // past the cutoff. Confirmed via a full sweep that no course/program
      // page has more than 8 genuine sections, and isBoilerplateHeading
      // already stops the loop at real boilerplate (Testimonials, From The
      // Blog, ...), so raising this is safe.
      const rawSections = extractCourseSections(raw, 10);
      const sections = isDjCoursePage
        ? rawSections
        : rawSections.map((s) => ({ ...s, bodyHtml: stripParisHiltonQuote(s.bodyHtml) }));
      // certificate-music-production-songwriting's own headless "Program
      // Highlights"/"Prerequisites" two-column row (see
      // extractProgramHighlights) has no heading of its own to become a
      // section - appended to the intro section's body instead, matching
      // where it sits on the real page (right after the intro, before
      // pricing).
      const programHighlights = extractProgramHighlights(raw);
      if (programHighlights && sections.length > 0) {
        // Append to the real intro section specifically, not sections[0] -
        // this page has two short promo banners ("Enroll Now: Fall
        // Semester...", "Scholarship Program Available") ahead of its real
        // intro, so sections[0] isn't it. ">Apply Now<" is the intro
        // section's own CTA link text and a stable marker for it.
        const introIdx = sections.findIndex((s) => />Apply Now</i.test(s.bodyHtml));
        const targetIdx = introIdx === -1 ? 0 : introIdx;
        sections[targetIdx] = {
          ...sections[targetIdx],
          bodyHtml: sections[targetIdx].bodyHtml + programHighlightsHtml(programHighlights),
        };
      }
      // Requested wording tweak, applied network-wide.
      for (let i = 0; i < sections.length; i++) {
        sections[i] = { ...sections[i], bodyHtml: sections[i].bodyHtml.replace(/Next Batch/g, "Next Cohort") };
      }
      // comparisonTableHtml's own "Side-by-Side Overview" table (see its
      // own comment) hardcodes "Garnish LA" and, on the "18427" variant,
      // "Exclusive LA Events & Master Classes" - both true for la itself,
      // wrong on every other modern site whose own course pages reuse the
      // exact same three image ids (pdx/hou/staging, and now
      // ModernComparisonTable's own always-on section - see its matching
      // fix for the same row), so both get swapped for the real per-site
      // abbreviation here rather than in that shared builder, which has no
      // access to `site` at all.
      for (let i = 0; i < sections.length; i++) {
        sections[i] = {
          ...sections[i],
          bodyHtml: sections[i].bodyHtml
            .replace(/>Garnish LA</g, `>Garnish ${getCityAbbr(site)}<`)
            .replace(/Exclusive LA Events & Master Classes/g, `Exclusive ${getCityAbbr(site)} Events & Master Classes`),
        };
      }
      const curriculum = sections.length > 0 ? [] : extractCurriculumModules(raw);
      // ai-music-composition-marketing's own byline+overview lead-in isn't
      // reached by extractCourseIntro's own two shapes at all (see
      // extractNumberedModuleCourse's own comment for why). Checked first,
      // ahead of extractCourseIntro, not just as its fallback -
      // extractCourseIntro's own oldShape regex requires a literal
      // "[vc_column_text]" with no attributes, so on this page (whose real
      // first block is "[vc_column_text css=""]") it skips straight past
      // that to the next bare occurrence it finds, which happens to be the
      // FAQ section's own heading further down - a real bug in oldShape,
      // but only ever a problem for a page this specific fallback already
      // has a solid, narrowly-scoped match for.
      const introFromNumberedModules = sections.length > 0 ? [] : extractNumberedModuleCourse(raw).intro;
      const intro =
        sections.length > 0
          ? []
          : introFromNumberedModules.length > 0
            ? introFromNumberedModules
            : extractCourseIntro(raw);
      // A page's one [mkd_accordion] can be a real FAQ or a curriculum-
      // modules breakdown (la's academy page: 10 real program modules, not
      // Q&A) - hasModulesAccordion tells the two apart so modules don't
      // render mislabeled under a "Frequently asked questions" heading.
      const isModulesAccordion = hasModulesAccordion(raw);
      // This page has no real FAQ content in its own wpRawContent (checked
      // thoroughly - no "FAQ"/"Frequently" text and its only two "?"s are
      // section headings, not Q&A) - drafted from the real facts already on
      // this page (pricing, hours, modules, "who is this for") per explicit
      // instruction, not extracted. Flag as a draft if asked to verify.
      const draftFaqs =
        slug.join("/") === "programs/ableton-production-program"
          ? [
              {
                question: "How much does the Ableton Production Program cost?",
                answer: "$5,550 tuition plus a $300 registration fee, due at enrollment.",
              },
              {
                question: "How long is the program?",
                answer:
                  "120 hours of hands-on training, delivered in focused groups of up to 8 students.",
              },
              {
                question: "What will I learn?",
                answer:
                  "Six core modules: DAW and Track Building in Ableton, Music Theory and Keyboard Proficiency, Synthesis and Sound Design, Hit Songwriting, Studio Vocal Production, and Mixing.",
              },
              {
                question: "Do I need any prior experience?",
                answer:
                  "The program is built for artists, songwriters, producers and DJs ready to move from bedroom creator to pro releases, as well as working musicians looking to plug skill gaps - no professional experience required.",
              },
              {
                question: "What software and gear will I use?",
                answer:
                  "Ableton Live Suite and its Max4Live devices, plus industry-standard plugins and hardware synths in Garnish LA's studios - an Ableton Certified Training Center.",
              },
              {
                question: "What's the class schedule?",
                answer:
                  "Tue/Thu 6:30-9:30 PM, or Thu 6:30-9:30 PM plus Sat 10 AM-1 PM (US Pacific Time).",
              },
            ]
          : null;
      const faqs = draftFaqs ?? (isModulesAccordion ? [] : extractFaqs(raw));
      const curriculumAccordion = isModulesAccordion ? extractAccordionModules(raw) : [];
      // This page's one accordion is instructor bios (Shuba, LVMA BLACK,
      // Jake McPherson) plus a trailing syllabus tab, not curriculum
      // modules - "CURRICULUM / Program modules." mislabels it. Using
      // la's own real heading for this section instead.
      const isBioAccordionPage = slug.join("/") === "social-media-and-branding-for-artists";
      let curriculumEyebrow = isBioAccordionPage ? "Instructors" : "Curriculum";
      let curriculumHeading = isBioAccordionPage ? "Meet your curators." : "Program modules.";
      // This page's one [mkd_accordion_tab] scan (extractAccordionModules,
      // above) actually spans two real, separate accordions - 6 service
      // offerings, then a single-tab gear list - split apart here (the gear
      // list tab is always last, its own trailing "Gearlist" tab) so each
      // renders under its own real heading instead of one combined,
      // generically-labeled list.
      let secondaryAccordion: typeof curriculumAccordion = [];
      let secondaryAccordionEyebrow = "";
      let secondaryAccordionHeading = "";
      if (slug.join("/") === "garnish-la-artist-services" && curriculumAccordion.length > 0) {
        const splitIdx = curriculumAccordion.findIndex((m) => /gearlist/i.test(m.title));
        if (splitIdx !== -1) {
          secondaryAccordion = curriculumAccordion.slice(splitIdx);
          curriculumAccordion.length = splitIdx;
        }
        curriculumEyebrow = "Services";
        curriculumHeading = "Garnish LA Artist Services offerings.";
        secondaryAccordionEyebrow = "Studio";
        secondaryAccordionHeading = "Studio A gear list.";
      }
      // The modules accordion's own trailing "Blog" tab (a real
      // [mkd_blog_list category="..."] widget) was previously excluded
      // outright - included here, scoped to this one page for now, using
      // the same resolver the legacy pipeline already trusts for this exact
      // shortcode rather than re-querying posts by hand.
      if (slug.join("/") === "programs/ableton-production-program") {
        const blogTab = extractAccordionBlogTab(raw);
        if (blogTab) {
          const resolveBlogList = await buildBlogListResolver(site, raw);
          const posts = resolveBlogList(blogTab.categoryCsv);
          if (posts.length > 0) {
            const bodyHtml = `<div class="grid sm:grid-cols-2 gap-4 not-prose">${posts
              .map(
                (p) => `<a href="${p.href}"${p.targetBlank ? ' target="_blank" rel="noopener"' : ""} class="block border border-[var(--gmpm-line)] p-4 hover:bg-[var(--gmpm-bg-raised)] transition-colors">
                  <h4 class="gmpm-display font-bold text-sm mb-2">${p.title}</h4>
                  ${p.excerpt ? `<p class="text-xs text-[var(--gmpm-text-dim)] leading-relaxed line-clamp-3">${p.excerpt}</p>` : ""}
                </a>`
              )
              .join("")}</div>`;
            curriculumAccordion.push({ title: blogTab.title, bodyHtml });
          }
        }
      }
      // Requested removal, scoped to this one page only.
      const videoEmbeds = slug.join("/") === "programs/ableton-production-program" ? [] : extractVideoEmbeds(raw);
      // The real instructor photo grid behind this page's own "Meet Our
      // World-Class Instructors" section (see extractPortfolioSliderSpec) -
      // real instructor data is the same `pages` docs the individual bio
      // pages already use, so this queries only the site's own curated
      // instructorSlugs list (the same one the Instructors listing page
      // above already trusts as "actually featured", rather than every
      // portfolioCategories-tagged page network-wide - confirmed necessary
      // on staging: several older/deprecated pages, and even a *course*
      // page, share the same categories as real instructors, and would
      // otherwise show up in this grid too) rather than a broader,
      // unscoped query.
      const portfolioSpec = extractPortfolioSliderSpec(raw);
      let instructorGridItems: InstructorGridItem[] = [];
      if (portfolioSpec && modernRoutes.instructorSlugs.length > 0) {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const wantedCategorySlugs = portfolioSpec.categorySlugs.map(normalize);
        const instructorPagesRes = await payload.find({
          collection: "pages",
          where: {
            and: [
              { site: { equals: site.id } },
              { slug: { in: modernRoutes.instructorSlugs } },
              { portfolioCategories: { exists: true } },
            ],
          },
          limit: modernRoutes.instructorSlugs.length,
          depth: 1,
        });
        // Always exactly 4 featured instructors per page, picked round-robin
        // across the course's own wanted categories (in the shortcode's own
        // category order) rather than portfolioSpec.count / arbitrary DB
        // order or a raw overlap-count ranking. A pure overlap-count ranking
        // was tried and found wrong: a multi-category program page like
        // dj-production-program (categories dj/ableton/sound-design/mixing/
        // songwriting) would rank its two genuine DJ specialists (who only
        // carry the single "dj" tag) below generalist instructors who happen
        // to carry 3+ of the other, unrelated tags - crowding DJ instructors
        // entirely off a page named "DJ Production Program". Round-robin
        // guarantees every named category gets a pick before any category
        // gets a second one, so a narrowly-tagged specialist can't be
        // squeezed out by broader generalists.
        const instructorsByCategory = new Map<string, any[]>(
          wantedCategorySlugs.map((cat) => [
            cat,
            (instructorPagesRes.docs as any[]).filter((d) =>
              (d.portfolioCategories || []).some(
                (c: any) => normalize((typeof c === "object" ? c.slug : c) || "") === cat
              )
            ),
          ])
        );
        const pickedDocs: any[] = [];
        const pickedIds = new Set<string>();
        for (let round = 0; pickedDocs.length < 4; round++) {
          let addedThisRound = false;
          for (const cat of wantedCategorySlugs) {
            if (pickedDocs.length >= 4) break;
            const candidate = (instructorsByCategory.get(cat) || [])[round];
            if (candidate && !pickedIds.has(candidate.id)) {
              pickedDocs.push(candidate);
              pickedIds.add(candidate.id);
              addedThisRound = true;
            }
          }
          if (!addedThisRound) break;
        }
        instructorGridItems = pickedDocs.map((d) => ({
          name: d.title,
          href: `/${d.slug}/`,
          imageUrl:
            (typeof d.featuredImage === "object" && d.featuredImage?.url) ||
            (typeof d.titleBackgroundImage === "object" && d.titleBackgroundImage?.url) ||
            undefined,
        }));
      }
      // The same real [mkd_testimonials category="..."] widget behind the
      // homepage's own "Our Students Say..." carousel (see ModernHomePage)
      // sits under every course/program page's "Our Students Say" section
      // too - every one of them uses category="logic-pro" verbatim (real
      // content, confirmed identical network-wide, not a per-course value
      // despite the name). Paris Hilton's own testimonials-collection doc
      // is tagged famous-testimonials/electronic-dj, not logic-pro, so she
      // wouldn't be pulled in here regardless - excluded by name anyway as
      // an explicit belt-and-suspenders per instruction not to show her on
      // these pages until asked.
      const testimonialCategorySlugs = extractTestimonialCategorySlugs(raw);
      let testimonials: TestimonialItem[] = [];
      if (testimonialCategorySlugs.length > 0) {
        const testimonialsRes = await payload.find({
          collection: "testimonials",
          where: { site: { equals: site.id } },
          limit: 200,
          depth: 1,
        });
        testimonials = (testimonialsRes.docs as any[])
          .filter(
            (t) =>
              Array.isArray(t.categories) &&
              t.categories.some((c: any) => testimonialCategorySlugs.includes(typeof c === "object" ? c.slug : c)) &&
              !/paris hilton/i.test(t.author || "")
          )
          .map((t) => ({
            author: t.author,
            text: t.text,
            imageUrl: typeof t.image === "object" ? t.image?.url : undefined,
          }));
      }
      const allSites = await getAllSitesCached();
      const eduSite = allSites.find((s: any) => s.slug === "edu");
      const relatedPosts = eduSite ? await getRelatedPosts(payload, eduSite.id, slug.join("/")) : [];

      // "View Course Schedule & Details" - see COURSE_SCHEDULE_PAGES's own
      // comment further down (the legacy branch's version of this fetch)
      // for what this data actually is and why it lives on a separate
      // `products` doc. Built independently here rather than sharing that
      // branch's courseScheduleHtml: this needs extractParagraphs's real
      // <p>/<strong>/<a> output (the same shape every other course-page
      // body section on this template already renders), not
      // wpContentToStyledHtml's legacy wpb_*/mkd-* CSS classes, which have
      // no matching styles loaded on a modern page. Not gated by site.slug
      // (unlike the legacy branch) - the site-scoped `products` query below
      // already only ever finds a match for whichever site actually has
      // that product cloned in, so this works for any future modern site
      // with its own schedule data, not just mia's.
      const modernCourseScheduleConfig = COURSE_SCHEDULE_PAGES[slug.join("/")];
      const modernCourseScheduleHtml = modernCourseScheduleConfig
        ? await courseScheduleCache(
            `${site.id}:${modernCourseScheduleConfig.productSlug}:modern-schedule`,
            async () => {
              const productRes = await payload.find({
                collection: "products",
                where: {
                  and: [
                    { site: { equals: site.id } },
                    { slug: { equals: modernCourseScheduleConfig.productSlug } },
                  ],
                },
                limit: 1,
                depth: 0,
              });
              const productDoc = productRes.docs[0] as any;
              if (!productDoc?.wpRawContent) return null;
              // Cohort rows carry data-cohort-start/data-cohort-banner-html
              // attributes (used by some other, unrelated legacy "next
              // class" banner widget) - the banner one's own value is
              // itself a snippet of HTML (e.g. `data-cohort-banner-html="
              // Next <span class=&quot;next-class-arrow&quot;>👇🏽</span>
              // Class"`), and the *unescaped* ">" inside that nested <span>
              // prematurely closes extractParagraphs's own <p[^>]*> tag
              // match right there, leaking the rest of the attribute value
              // out as if it were real paragraph text ('Class">L) Sundays
              // ...' - confirmed on this exact content. Neither attribute
              // means anything to this rendering path, so both are just
              // dropped before extraction rather than taught to extractParagraphs
              // itself, which has no other caller that has ever hit this shape.
              const withoutCohortAttrs = productDoc.wpRawContent.replace(
                /\s+data-cohort-(?:start|banner-html)="[^"]*"/gi,
                ""
              );
              return extractParagraphs(withoutCohortAttrs);
            }
          )
        : null;
      // Per-paragraph blocks for the same product doc, tagged with which
      // cohort (if any) is chronologically next - see ScheduleBlock's own
      // comment. Only used by the "Next 👇🏽 Class" banner; modernCourseScheduleHtml
      // above stays the fallback for a product doc with no real cohort dates.
      const modernScheduleBlocks = modernCourseScheduleConfig
        ? await scheduleBlocksCache(
            `${site.id}:${modernCourseScheduleConfig.productSlug}:schedule-blocks`,
            async () => {
              const productRes = await payload.find({
                collection: "products",
                where: {
                  and: [
                    { site: { equals: site.id } },
                    { slug: { equals: modernCourseScheduleConfig.productSlug } },
                  ],
                },
                limit: 1,
                depth: 0,
              });
              const productDoc = productRes.docs[0] as any;
              if (!productDoc?.wpRawContent) return null;
              return extractScheduleBlocks(productDoc.wpRawContent);
            }
          )
        : null;

      // mia's own module-by-module curriculum breakdown (<h4>+[mkd_icon]-
      // bulleted cards - see extractIconBulletCardGroups's own comment for
      // why none of the other extractors above ever reach this shape).
      // Falls back to the numbered "N - Title" + "N. " shape
      // (extractNumberedModuleCourse, ai-music-composition-marketing's own)
      // when the icon-bullet one finds nothing - the two never coexist on
      // the same page.
      const iconBulletModules = extractIconBulletCardGroups(raw);
      const numberedModules = extractNumberedModuleCourse(raw).modules;
      const iconWithTextModules = extractIconWithTextModules(raw);
      const whatYouWillLearn =
        iconBulletModules.length > 0
          ? iconBulletModules
          : numberedModules.length > 0
            ? numberedModules
            : iconWithTextModules.length > 0
              ? iconWithTextModules
              : extractHeadingBulletModule(raw);

      return (
        <ModernCoursePage
          site={site}
          title={courseDoc.title}
          whatYouWillLearn={whatYouWillLearn}
          courseSchedule={
            modernCourseScheduleConfig && modernCourseScheduleHtml
              ? {
                  bodyHtml: modernCourseScheduleHtml,
                  scheduleBlocks: modernScheduleBlocks ?? undefined,
                  paypalButtons: modernCourseScheduleConfig.paypalButtons,
                }
              : undefined
          }
          heroImageUrl={heroImage}
          sections={sections}
          curriculum={curriculum}
          intro={intro}
          pricing={extractCoursePricing(raw)}
          faqs={faqs}
          curriculumAccordion={curriculumAccordion}
          curriculumEyebrow={curriculumEyebrow}
          curriculumHeading={curriculumHeading}
          secondaryAccordion={secondaryAccordion}
          secondaryAccordionEyebrow={secondaryAccordionEyebrow}
          secondaryAccordionHeading={secondaryAccordionHeading}
          videoEmbeds={videoEmbeds}
          instructorGridItems={instructorGridItems}
          testimonials={testimonials}
          relatedPosts={relatedPosts}
          eduDomain={eduSite?.domain || "edu.garnishmusicproduction.com"}
          themeClassName={
            [
              // pdx
              "courses/sound-design-synthesis-ableton",
              "courses/electronic-sound-art",
              // staging/la
              "courses/synthesis-and-sound-design",
              // staging/la both use this exact slug now - staging's own
              // page was renamed from courses/release-party to match,
              // after being repurposed as its Advanced Mastering course
              // with content copied over from la's real page.
              "courses/advanced-mastering",
              "courses/electronic-music-emp",
            ].includes(slug.join("/"))
              ? "gmpm-theme-classic-dark"
              : undefined
          }
          isSpanish={slug.join("/") === "courses/curso-de-dj-espanol"}
          hideStudentStories={slug.join("/") === "courses/vocal-production"}
          hideVideo={[
            "courses/ableton-live-course",
            "courses/logic-course",
            "courses/electronic-music-emp",
            "courses/composition",
            "courses/rhythm-section-programming",
          ].includes(
            slug.join("/")
          )}
        />
      );
    }
  }
  if (modernRoutes && slug.join("/") === modernRoutes.privateInstructionSlug) {
    const payload = await getPayloadClient();
    const privatePages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { slug: { equals: modernRoutes.privateInstructionSlug } }] },
      limit: 1,
    });
    const privateDoc = privatePages.docs[0] as any;
    if (privateDoc) {
      const raw = privateDoc.wpRawContent || "";
      return (
        <ModernPrivateInstructionPage
          site={site}
          title={privateDoc.title}
          content={extractPrivateInstructionContent(raw)}
          faqs={extractFaqs(raw)}
        />
      );
    }
  }
  if (modernRoutes && slug.join("/") === modernRoutes.instructorsSlug) {
    // la's own instructors page is a real, hand-maintained directory (29
    // real instructors, each linking to their own bio page) - parsed
    // directly and shown in full when present. pdx/hou's own instructors
    // pages have no real content of their own (confirmed empty), so they
    // fall back to a curated few individual bio pages instead - see each
    // site's instructorSlugs entry in modern-site-routes.ts for why those
    // specific ones.
    const directory = await getInstructorDirectoryCached(site, modernRoutes.instructorsSlug, modernRoutes.instructorSlugs);
    if (directory.length > 0) {
      return <ModernInstructorsPage site={site} instructors={[]} directory={directory} />;
    }

    const payload = await getPayloadClient();
    const INSTRUCTOR_SLUGS = modernRoutes.instructorSlugs;
    const instructorPages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { slug: { in: INSTRUCTOR_SLUGS } }] },
      limit: 10,
      depth: 1,
    });
    const bySlug = new Map(instructorPages.docs.map((d: any) => [d.slug, d]));
    const instructors = INSTRUCTOR_SLUGS.map((slug) => {
      const doc: any = bySlug.get(slug);
      if (!doc) return null;
      return {
        name: doc.title,
        photoUrl: typeof doc.featuredImage === "object" ? doc.featuredImage?.url : undefined,
        bioHtml: extractInstructorBio(doc.wpRawContent || ""),
      };
    }).filter((i): i is NonNullable<typeof i> => i !== null);
    return <ModernInstructorsPage site={site} instructors={instructors} />;
  }
  // Individual instructor bio pages (courses/{slug}) - previously fell
  // through to the legacy theme even on modern sites, since instructor bios
  // aren't part of any site's nav (collectNavCourseSlugs never finds them).
  // When the site has a real instructors directory, its per-instructor
  // role/photo (100% coverage - about a third of la's own bio pages have no
  // featuredImage of their own set) is preferred over this page's own
  // fields, and the role line (e.g. "Multi-platinum Songwriter") only
  // exists on the directory card in the first place.
  if (modernRoutes && modernRoutes.instructorSlugs.includes(slug.join("/"))) {
    const payload = await getPayloadClient();
    const bioPageRes = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { slug: { equals: slug.join("/") } }] },
      limit: 1,
      depth: 1,
    });
    const bioDoc = bioPageRes.docs[0] as any;
    if (bioDoc) {
      const directory = await getInstructorDirectoryCached(site, modernRoutes.instructorsSlug, modernRoutes.instructorSlugs);
      const directoryEntry = directory.find((d) => d.href === `/${slug.join("/")}`);
      return (
        <ModernInstructorBioPage
          site={site}
          name={bioDoc.title}
          role={directoryEntry?.title}
          photoUrl={
            directoryEntry?.photoUrl ||
            (typeof bioDoc.featuredImage === "object" ? bioDoc.featuredImage?.url : undefined)
          }
          bioHtml={extractInstructorBio(bioDoc.wpRawContent || "")}
          backHref={`/${modernRoutes.instructorsSlug}`}
        />
      );
    }
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
    // Cached the same way as findContent above, keyed off this doc's stable
    // id. A content edit to this same doc.id is picked up within the 30s
    // TTL window (same tradeoff sites-cache.ts already accepts for site
    // config), while repeat requests for the same doc skip these 6 DB
    // round trips entirely.
    const resolverKey = `${site.id}:${doc.id}`;
    const [resolveImage, resolvePortfolioList, resolveTestimonials, resolveHeroSlider, resolveBlogList, partners] =
      await Promise.all([
        resolverCache(`${resolverKey}:image`, () =>
          buildImageResolver(site.id, doc.wpRawContent as string)
        ),
        resolverCache(`${resolverKey}:portfolio`, () =>
          buildPortfolioListResolver(site.id, doc.wpRawContent as string)
        ),
        resolverCache(`${resolverKey}:testimonials`, () =>
          buildTestimonialsResolver(site.id, doc.wpRawContent as string)
        ),
        resolverCache(`${resolverKey}:heroSlider`, () =>
          buildHeroSliderResolver(site.id, doc.wpRawContent as string)
        ),
        resolverCache(`${resolverKey}:blogList`, () =>
          buildBlogListResolver(site, doc.wpRawContent as string)
        ),
        resolverCache(`${resolverKey}:partners`, () => resolvePartners(doc.wpRawContent as string)),
      ]) as [
        Awaited<ReturnType<typeof buildImageResolver>>,
        Awaited<ReturnType<typeof buildPortfolioListResolver>>,
        Awaited<ReturnType<typeof buildTestimonialsResolver>>,
        Awaited<ReturnType<typeof buildHeroSliderResolver>>,
        Awaited<ReturnType<typeof buildBlogListResolver>>,
        Awaited<ReturnType<typeof resolvePartners>>,
      ];
    // Course/program landing pages should send every body-content link to
    // a new tab (see lib/course-pages.ts for how "course page" is
    // determined - via the site's own courses/programs nav branch, which
    // is accurate and self-maintaining network-wide, unlike sniffing page
    // content for a heading that turned out not to be present on every
    // site's course pages).
    const isCourseLikePage = isCoursePagePath(site.mainMenu as any, site.domain, slug.join("/"));
    styledHtml = wpContentToStyledHtml(
      doc.wpRawContent as string,
      resolveImage,
      resolvePortfolioList,
      resolveTestimonials,
      resolveHeroSlider,
      resolveBlogList,
      partners,
      isCourseLikePage
    );
  }

  // The course schedule/pricing disclosure ("View Course Schedule &
  // Details") lives on the product page's own doc, but also needs to
  // render inside the matching course page's newsletter box - fetch and
  // convert the product's content the same way as above, independently of
  // whichever doc this request actually resolved to.
  const courseScheduleConfig = site.slug === "mia" ? COURSE_SCHEDULE_PAGES[slug.join("/")] : undefined;
  // "product/electronic-dj-class" is an older, no-longer-linked alias for
  // the DJ product with no course-page equivalent of its own - it still
  // gets the DJ buttons at the bottom of the page (see render site below).
  // It used to point at the same hosted buttons as MIA's courses/electronic-
  // dj-course, but those buttons' PayPal-side price was changed externally
  // (nothing in this repo touches a hosted button's price) to the full
  // course price instead of the $500/$600 registration fee, so NY now has
  // its own replacement button ids - MIA's stay on the original ones.
  const isNyDjClass = slug.join("/") === "product/electronic-dj-class";
  const bottomPaypalButtons = isNyDjClass
    ? NY_DJ_CLASS_PAYPAL_BUTTONS
    : COURSE_SCHEDULE_BY_PRODUCT_SLUG.get(slug.join("/"))?.paypalButtons;
  const courseScheduleHtml = courseScheduleConfig
    ? await courseScheduleCache(`${site.id}:${courseScheduleConfig.productSlug}:schedule`, async () => {
        const payload = await getPayloadClient();
        const productRes = await payload.find({
          collection: "products",
          where: { and: [{ site: { equals: site.id } }, { slug: { equals: courseScheduleConfig.productSlug } }] },
          limit: 1,
          depth: 0,
        });
        const productDoc = productRes.docs[0] as any;
        if (!productDoc?.wpRawContent) return null;
        const resolverKey = `${site.id}:${productDoc.id}:schedule`;
        const [resolveImage, resolvePortfolioList, resolveTestimonials, resolveHeroSlider, resolveBlogList, partners] =
          (await Promise.all([
            resolverCache(`${resolverKey}:image`, () => buildImageResolver(site.id, productDoc.wpRawContent)),
            resolverCache(`${resolverKey}:portfolio`, () => buildPortfolioListResolver(site.id, productDoc.wpRawContent)),
            resolverCache(`${resolverKey}:testimonials`, () => buildTestimonialsResolver(site.id, productDoc.wpRawContent)),
            resolverCache(`${resolverKey}:heroSlider`, () => buildHeroSliderResolver(site.id, productDoc.wpRawContent)),
            resolverCache(`${resolverKey}:blogList`, () => buildBlogListResolver(site, productDoc.wpRawContent)),
            resolverCache(`${resolverKey}:partners`, () => resolvePartners(productDoc.wpRawContent)),
          ])) as [
            Awaited<ReturnType<typeof buildImageResolver>>,
            Awaited<ReturnType<typeof buildPortfolioListResolver>>,
            Awaited<ReturnType<typeof buildTestimonialsResolver>>,
            Awaited<ReturnType<typeof buildHeroSliderResolver>>,
            Awaited<ReturnType<typeof buildBlogListResolver>>,
            Awaited<ReturnType<typeof resolvePartners>>,
          ];
        return wpContentToStyledHtml(
          productDoc.wpRawContent,
          resolveImage,
          resolvePortfolioList,
          resolveTestimonials,
          resolveHeroSlider,
          resolveBlogList,
          partners
        );
      })
    : null;
  // Marks the empty slot inside the "To be in the loop..." newsletter box
  // (the same nested .wpb_wrapper the old "See Schedule" button used to
  // occupy - see remove-schedules-buttons.ts) so CourseScheduleDisclosure
  // can portal the schedule/buy-buttons panel into it client-side. Only an
  // id attribute is added to the existing markup - unlike splicing React
  // elements into the middle of the raw HTML string, this keeps styledHtml
  // a single well-formed fragment, so server and client render identically
  // and there's no hydration mismatch from unbalanced tags.
  const courseScheduleSlotHtml =
    courseScheduleConfig && courseScheduleHtml && styledHtml
      ? styledHtml.replace(
          '<div class="wpb_text_column wpb_content_element">\n<div class="wpb_wrapper">\n</div>\n</div>',
          `<div class="wpb_text_column wpb_content_element">\n<div class="wpb_wrapper" id="${courseScheduleConfig.slotId}"></div>\n</div>`
        )
      : null;

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
                            {"featuredImage" in doc &&
                              doc.featuredImage &&
                              typeof doc.featuredImage === "object" && (
                                <div
                                  style={{
                                    margin: "0 0 2rem",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                    boxShadow: "0 8px 30px rgba(0,0,0,0.14)",
                                  }}
                                >
                                  <img
                                    src={doc.featuredImage.url ?? undefined}
                                    alt={doc.featuredImage.alt || doc.title}
                                    style={{
                                      width: "100%",
                                      aspectRatio: "16 / 9",
                                      objectFit: "cover",
                                      display: "block",
                                    }}
                                  />
                                </div>
                              )}
                            <RichText data={doc.content || EMPTY_RICHTEXT} converters={postRichTextConverters} />
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
        {/* The root layout skips every legacy theme stylesheet for a
            "modern" site (see LegacyThemeAssets' own comment) - this page
            doesn't fit any modern template, so it still needs them. */}
        {modernRoutes && <LegacyThemeAssets customCss={site.customCss} />}
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
      {/* The root layout skips every legacy theme stylesheet for a
          "modern" site (see LegacyThemeAssets' own comment) - this page
          doesn't fit any modern template, so it still needs them. */}
      {modernRoutes && <LegacyThemeAssets customCss={site.customCss} />}
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
                                      dangerouslySetInnerHTML={{ __html: courseScheduleSlotHtml ?? styledHtml }}
                                    />
                                    {courseScheduleConfig && courseScheduleHtml && (
                                      <CourseScheduleDisclosure
                                        targetId={courseScheduleConfig.slotId}
                                        html={courseScheduleHtml}
                                        paypalButtons={courseScheduleConfig.paypalButtons}
                                      />
                                    )}
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
                  {type === "product" && site.slug !== "mia" && slug.join("/") !== "product/electronic-dj-class" && slug.join("/") !== "product/electronic-music-dj-course" && (
                    <div className="mkd-container" style={{ paddingTop: "40px" }}>
                      <div className="mkd-container-inner" style={{ padding: "0 20px" }}>
                        {(("price" in doc && doc.price != null) || ("variations" in doc && Array.isArray((doc as any).variations) && (doc as any).variations.length > 0)) && (
                          <AddToCart product={doc} variations={(doc as any).variations || []} />
                        )}
                      </div>
                    </div>
                  )}
                  {COURSE_SCHEDULE_BY_PRODUCT_SLUG.has(slug.join("/")) ? (
                    <Accordion
                      items={[
                        {
                          title: "View Course Schedule & Details",
                          content: (
                            <div className="text-center">
                              <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styledHtml }} />
                              {(() => {
                                const buttons = COURSE_SCHEDULE_BY_PRODUCT_SLUG.get(slug.join("/"))!.paypalButtons;
                                return buttons && buttons.length > 0 && <PayPalHostedButtons buttons={buttons} />;
                              })()}
                            </div>
                          ),
                        },
                      ]}
                      variant="red"
                    />
                  ) : courseScheduleConfig && courseScheduleHtml ? (
                    // portfolioCustomTemplate courses (e.g. Ableton's, which
                    // renders full-width per its own template rather than the
                    // portfolio-item layout above) still need their schedule
                    // slot swapped in here, since they never reach that branch.
                    <>
                      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: courseScheduleSlotHtml ?? styledHtml }} />
                      <CourseScheduleDisclosure
                        targetId={courseScheduleConfig.slotId}
                        html={courseScheduleHtml}
                        paypalButtons={courseScheduleConfig.paypalButtons}
                      />
                    </>
                  ) : (
                    <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styledHtml }} />
                  )}
                </>
              )
            ) : (
              <article style={{ padding: "3rem 2rem", maxWidth: 900, margin: "0 auto" }}>
                <h1>{"title" in doc ? doc.title : doc.name}</h1>
                {"featuredImage" in doc &&
                  doc.featuredImage &&
                  typeof doc.featuredImage === "object" && (
                    <div
                      style={{
                        marginBottom: "2rem",
                        borderRadius: 14,
                        overflow: "hidden",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.14)",
                      }}
                    >
                      <img
                        src={doc.featuredImage.url ?? undefined}
                        alt={doc.featuredImage.alt || ""}
                        style={{
                          width: "100%",
                          aspectRatio: "16 / 9",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
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
                {type === "product" && site.slug !== "mia" && slug.join("/") !== "product/electronic-dj-class" && slug.join("/") !== "product/electronic-music-dj-course" && (
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
      {bottomPaypalButtons && <PayPalHostedButtons buttons={bottomPaypalButtons} checkoutOnly={isNyDjClass} />}
      <NextCohortBanner />
      <Footer site={site} />
    </>
  );
}
